import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { simulateContract } from 'wagmi/actions';
import { type Hex, encodeAbiParameters, concat, toBytes, zeroAddress, maxUint128, numberToHex } from 'viem';
import { PoolKey } from '@uniswap/v4-sdk';
import { Token, Percent } from '@uniswap/sdk-core';
import { useChainConfig } from '@/config';
import { wagmiConfig } from '@/app/providers';
import PositionManagerABI from '@/contracts/PositionManager.json';

// Define constants
const DEADLINE_SECONDS = 60 * 20; // 20 minutes from now

// Actions Enum (approximated from typical usage, verify if necessary)
const Actions = {
    MINT_POSITION: 0,
    COLLECT_POSITION: 1,
    BURN_POSITION: 2,
    SETTLE_PAIR: 3,
    SWAP_TOKENS_FOR_EXACT_TOKENS: 4,
    SWAP_EXACT_TOKENS_FOR_TOKENS: 5,
};

interface UseAddV4LiquidityProps {
  poolKey: PoolKey | null;
  poolState: {
      sqrtPriceX96: bigint;
      tick: number;
      liquidity: bigint;
  } | null;
  token0: Token | null;
  token1: Token | null;
  estimatedLiquidity: string; // Expecting raw bigint string (liquidity delta)
  onSuccess?: (txHash: Hex) => void;
}

interface AddLiquidityStatus {
  addLiquidity: () => Promise<void>;
  isAdding: boolean;
  isConfirming: boolean;
  addError: string | null;
  txHash?: Hex;
}

// Full range tick calculation for Prediction Market (0 to 1 price range)
const getFullRangeTicks = (tickSpacing: number) => {
    if (tickSpacing <= 0) {
        console.error("Invalid tickSpacing provided:", tickSpacing);
        return { tickLower: 0, tickUpper: 0 }; 
    }
    // Use bounds specific to the PredictionMarketHook logic
    const MIN_PM_TICK = 0;       // Corresponds to price = 1 (max YES value)
    const MAX_PM_TICK = 207233;  // Corresponds to price = 1e-9 (min YES value)

    // Round MIN_PM_TICK UP to the nearest multiple of tickSpacing (remains 0)
    let tickLower = Math.ceil(MIN_PM_TICK / tickSpacing) * tickSpacing;

    // Round MAX_PM_TICK DOWN to the nearest multiple of tickSpacing
    let tickUpper = Math.floor(MAX_PM_TICK / tickSpacing) * tickSpacing;
    
    // Ensure lower is still less than upper after rounding
    if (tickLower >= tickUpper) {
        console.warn(`Tick rounding issue: ${tickLower} >= ${tickUpper}. Adjusting.`);
        // If min=0 and max rounded down becomes 0 or less, adjust upper
        tickUpper = tickLower + tickSpacing; 
    }
    console.log(`Prediction Market Ticks: Lower=${tickLower}, Upper=${tickUpper}`);
    return { tickLower, tickUpper };
};

export function useAddV4Liquidity({
  poolKey,
  poolState,
  token0,
  token1,
  estimatedLiquidity,
  onSuccess,
}: UseAddV4LiquidityProps): AddLiquidityStatus {
  const { address: userAddress, chainId } = useAccount();
  const config = useChainConfig();
  const positionManagerAddress = config.POSITION_MANAGER_ADDRESS;

  const [internalError, setInternalError] = useState<string | null>(null);
  const [finalTxHash, setFinalTxHash] = useState<Hex | undefined>(undefined);
  const [isExecutingAdd, setIsExecutingAdd] = useState<boolean>(false);

  // --- Write Contract Hook & Receipt Hook (Using full ABI now) ---
  const { data: addLiquidityTxHash, writeContract: addLiquidityWriteContract, isPending: isAddingWrite, error: addWriteError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isAddConfirmed, error: confirmationError } = useWaitForTransactionReceipt({ hash: addLiquidityTxHash });

  // --- addLiquidity Callback (Updated Logic) ---
  const addLiquidity = useCallback(async () => {
    console.log("useAddV4Liquidity (modifyLiquidities approach): addLiquidity callback entered.");
    setInternalError(null);
    setFinalTxHash(undefined);
    setIsExecutingAdd(true);

    // 1. Precondition Checks (Simplified slightly as Pool/Position objects aren't directly used for calldata)
    if (!userAddress || !poolKey || !estimatedLiquidity || BigInt(estimatedLiquidity) <= 0 || !positionManagerAddress || !chainId || !addLiquidityWriteContract) {
        const errorMsg = "Add Liquidity preconditions failed (missing user, poolKey, liquidity, config, or write function).";
        console.error(errorMsg, { userAddress, poolKey, estimatedLiquidity, positionManagerAddress, chainId, addLiquidityWriteContract: !!addLiquidityWriteContract });
        setInternalError(errorMsg);
        setIsExecutingAdd(false);
        return;
    }

    try {
        // 2. Prepare Data for Encoding (mimicking AddLiquidity.sol)
        console.log("[addLiquidity] Preparing data for modifyLiquidities...");
        const { tickLower, tickUpper } = getFullRangeTicks(poolKey.tickSpacing);
        if (tickLower >= tickUpper) throw new Error(`Invalid tick range: ${tickLower} >= ${tickUpper}`);

        const liquidityDelta = BigInt(estimatedLiquidity);
        if (liquidityDelta <= 0) throw new Error("Estimated liquidity must be positive.");

        // Mimic Solidity script's max amounts (WARNING: Use calculated amounts + slippage in production)
        // Using maxUint128 as a large placeholder like type(uint256).max is often used in scripts
        const amount0Max = maxUint128;
        const amount1Max = maxUint128;
        // const amount0Max = 1n * 10n**18n; // Mimic 1 ether if tokens have 18 decimals
        // const amount1Max = 1n * 10n**18n;

        const recipient = userAddress;
        const salt = toBytes(''); // bytes("") equivalent

        // 3. Encode Actions and Params
        console.log("[addLiquidity] Encoding actions and parameters...");

        // Encode actions: MINT_POSITION (0), SETTLE_PAIR (3) - Use Actions enum values
        const actionsBytes = concat([
            numberToHex(Actions.MINT_POSITION, { size: 1 }),
            numberToHex(Actions.SETTLE_PAIR, { size: 1 })
        ]);

        // Encode params[0] for MINT_POSITION
        const mintParams = encodeAbiParameters(
            [
                { type: 'tuple', components: [ // PoolKey struct
                    { name: 'currency0', type: 'address' },
                    { name: 'currency1', type: 'address' },
                    { name: 'fee', type: 'uint24' },
                    { name: 'tickSpacing', type: 'int24' },
                    { name: 'hooks', type: 'address' }
                ]},
                { name: 'tickLower', type: 'int24' },
                { name: 'tickUpper', type: 'int24' },
                { name: 'liquidityDelta', type: 'uint128' },
                { name: 'amount0Max', type: 'uint128' }, // Use uint128 based on SDK/contract expectations
                { name: 'amount1Max', type: 'uint128' },
                { name: 'recipient', type: 'address' },
                { name: 'salt', type: 'bytes32' } // Salt is bytes32 in PositionManager, but script uses bytes("")? Let's use zero bytes32
            ],
            [
                { // PoolKey value
                    currency0: poolKey.currency0 as Hex, 
                    currency1: poolKey.currency1 as Hex,
                    fee: poolKey.fee,
                    tickSpacing: poolKey.tickSpacing,
                    hooks: poolKey.hooks as Hex // Assuming hooks is an address
                },
                tickLower,
                tickUpper,
                liquidityDelta,
                amount0Max,
                amount1Max,
                recipient as Hex,
                // salt // salt is bytes, encode parameter expects bytes32? Use zero bytes32 for now
                 '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex
            ]
        );

        // Encode params[1] for SETTLE_PAIR
        const settleParams = encodeAbiParameters(
            [ { name: 'currency0', type: 'address' }, { name: 'currency1', type: 'address' }],
            [ poolKey.currency0 as Hex, poolKey.currency1 as Hex ]
        );

        // Create params array
        const paramsArray: Hex[] = [mintParams, settleParams];

        // Encode the final `unlockData` payload: abi.encode(actions, params)
        const unlockData = encodeAbiParameters(
            [ { type: 'bytes' }, { type: 'bytes[]' } ],
            [ actionsBytes, paramsArray ]
        );

        const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);

        console.log("[addLiquidity] Encoded Data:", { actionsBytes, mintParams, settleParams, paramsArray, unlockData, deadline });

        // 4. Simulate Transaction (using modifyLiquidities)
        console.log("[addLiquidity] Simulating modifyLiquidities...");
        const simulationResult = await simulateContract(wagmiConfig, {
            address: positionManagerAddress as `0x${string}`,
            abi: PositionManagerABI, // Use the full ABI
            functionName: 'modifyLiquidities',
            // Args: [bytes unlockData, uint256 deadline]
            args: [unlockData, deadline],
            // value: 0n, // Assuming no ETH value needed, matching the script
            account: userAddress,
        });
        console.log("[addLiquidity] Simulation successful:", simulationResult);

        // 5. Execute Transaction
        if (!simulationResult?.request) {
            throw new Error("Transaction simulation failed to return a valid request.");
        }

        console.log("[addLiquidity] Executing transaction via writeContract...");
        addLiquidityWriteContract(simulationResult.request);

    } catch (error: any) {
        console.error("[addLiquidity] Error during encoding, simulation, or execution:", error);
        const errorMsg = error.message || "An unknown error occurred during add liquidity.";
        setInternalError(`Failed: ${errorMsg}`);
        setIsExecutingAdd(false);
    }

  }, [userAddress, chainId, poolKey, estimatedLiquidity, positionManagerAddress, addLiquidityWriteContract, onSuccess]);

  // --- Effect for Handling Post-Confirmation ---
  useEffect(() => {
    if (isAddConfirmed && addLiquidityTxHash) {
      console.log(`useAddV4Liquidity: Transaction confirmed: ${addLiquidityTxHash}`);
      setFinalTxHash(addLiquidityTxHash);
      setIsExecutingAdd(false);
      if (onSuccess) {
        onSuccess(addLiquidityTxHash);
      }
    }
    if (confirmationError) {
        setIsExecutingAdd(false);
    }
  }, [isAddConfirmed, addLiquidityTxHash, confirmationError, onSuccess]);

  // --- Combined Error Handling --- (Mostly unchanged)
  useEffect(() => {
    let errorMsg: string | null = null;
    if (addWriteError) {
       console.error("Add Liquidity Write Error:", addWriteError);
       errorMsg = `Transaction submission failed: ${addWriteError.message}`;
       setIsExecutingAdd(false);
    } else if (confirmationError) {
      console.error("Add Liquidity Confirmation Error:", confirmationError);
      errorMsg = `Transaction confirmation failed: ${confirmationError.message}`;
    }

    if (errorMsg && (!internalError || internalError.startsWith("Failed:"))) {
        setInternalError(errorMsg);
    }
    else if (!addWriteError && !confirmationError && internalError && !internalError.startsWith("Failed:")) {
        setInternalError(null);
    }

  }, [addWriteError, confirmationError, internalError]);

  return {
    addLiquidity,
    isAdding: isExecutingAdd || isAddingWrite,
    isConfirming,
    addError: internalError,
    txHash: finalTxHash,
  };
} 