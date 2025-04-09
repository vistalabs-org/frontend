import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { simulateContract } from 'wagmi/actions';
import { type Hex } from 'viem';
import { PoolKey, V4PositionManager, Position, Pool, type MintOptions } from '@uniswap/v4-sdk';
import { Token, Percent } from '@uniswap/sdk-core';
import { useChainConfig } from '@/config';
import { wagmiConfig } from '@/app/providers';

// Define constants
const SLIPPAGE_TOLERANCE = new Percent(50, 10_000); // 0.5% slippage
const DEADLINE_SECONDS = 60 * 20; // 20 minutes from now

// --- Explicit ABI fragment for V4PositionManager multicall ---
const positionManagerMulticallAbi = [
  {
    "inputs": [
      {
        "internalType": "bytes[]",
        "name": "data",
        "type": "bytes[]"
      }
    ],
    "name": "multicall",
    "outputs": [
      {
        "internalType": "bytes[]",
        "name": "results",
        "type": "bytes[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
] as const; // Use 'as const' for stricter typing
// -----------------------------------------------------------

interface UseAddV4LiquidityProps {
  poolKey: PoolKey | null;
  poolState: { // Require poolState for Pool construction
      sqrtPriceX96: bigint;
      tick: number;
      liquidity: bigint; // Not directly needed for Position construction? Check SDK Position/Pool constructor
  } | null; // Make required
  token0: Token | null; // NEW: Pass Token objects
  token1: Token | null; // NEW: Pass Token objects
  estimatedLiquidity: string; // Expecting raw bigint string (liquidity delta)
  onSuccess?: (txHash: Hex) => void;
}

interface AddLiquidityStatus {
  addLiquidity: () => Promise<void>;
  isAdding: boolean; // writeContract is pending
  isConfirming: boolean; // Transaction is confirming
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

  // --- Write Contract Hook & Receipt Hook (Simulation hook removed) ---
  const { data: addLiquidityTxHash, writeContract: addLiquidityWriteContract, isPending: isAddingWrite, error: addWriteError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isAddConfirmed, error: confirmationError } = useWaitForTransactionReceipt({ hash: addLiquidityTxHash });

  // --- addLiquidity Callback (Updated Logic) ---
  const addLiquidity = useCallback(async () => {
    console.log("useAddV4Liquidity: addLiquidity callback entered.");
    setInternalError(null);
    setFinalTxHash(undefined);
    setIsExecutingAdd(true); // Start loading state

    // 1. Precondition Checks
    if (!userAddress || !poolKey || !poolState || !token0 || !token1 || !estimatedLiquidity || BigInt(estimatedLiquidity) <= 0 || !positionManagerAddress || !chainId || !addLiquidityWriteContract) {
        const errorMsg = "Add Liquidity preconditions failed (missing user, pool, tokens, liquidity, config, or write function).";
        console.error(errorMsg, { userAddress, poolKey, poolState, token0, token1, estimatedLiquidity, positionManagerAddress, chainId, addLiquidityWriteContract: !!addLiquidityWriteContract });
        setInternalError(errorMsg);
        setIsExecutingAdd(false); // Stop loading state
        return;
    }

    try {
        // 2. Generate Calldata (Synchronously within the callback)
        console.log("[addLiquidity] Generating calldata...");
        const { tickLower, tickUpper } = getFullRangeTicks(poolKey.tickSpacing);
        if (tickLower >= tickUpper) throw new Error(`Invalid tick range: ${tickLower} >= ${tickUpper}`);

        const liquidityDelta = BigInt(estimatedLiquidity);
        if (liquidityDelta <= 0) throw new Error("Estimated liquidity must be positive.");

        const pool = new Pool(
            token0, token1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks, 
            poolState.sqrtPriceX96.toString(), 
            poolState.liquidity.toString(), 
            poolState.tick, []
        );
        const position = new Position({ pool, tickLower, tickUpper, liquidity: liquidityDelta.toString() });

        const deadline = Math.floor(Date.now() / 1000) + DEADLINE_SECONDS;
        const mintOptions: MintOptions = {
            recipient: userAddress,
            slippageTolerance: SLIPPAGE_TOLERANCE,
            deadline: deadline.toString(),
            createPool: false, // Assuming pool exists
        };
        
        const { calldata, value } = V4PositionManager.addCallParameters(position, mintOptions);
        console.log("[addLiquidity] Calldata generated:", { calldata, value });

        if (!calldata) {
            throw new Error("Failed to generate transaction calldata.");
        }

        // 3. Simulate Transaction (Imperatively)
        console.log("[addLiquidity] Simulating transaction...");
        const simulationResult = await simulateContract(wagmiConfig, {
            address: positionManagerAddress as `0x${string}`,
            abi: positionManagerMulticallAbi,
            functionName: 'multicall',
            args: [[calldata as `0x${string}`]],
            value: (value && BigInt(value) > BigInt(0)) ? BigInt(value) : undefined,
            account: userAddress, // Specify the user account for simulation
        });
        console.log("[addLiquidity] Simulation successful:", simulationResult);

        // 4. Execute Transaction (using simulation result)
        if (!simulationResult?.request) {
            throw new Error("Transaction simulation failed to return a valid request.");
        }

        console.log("[addLiquidity] Executing transaction via writeContract...");
        addLiquidityWriteContract(simulationResult.request);
        // isAddingWrite state will become true now

    } catch (error: any) {
        console.error("[addLiquidity] Error during simulation or execution:", error);
        const errorMsg = error.message || "An unknown error occurred during add liquidity.";
        setInternalError(`Failed: ${errorMsg}`);
        setIsExecutingAdd(false); // Stop loading state on error
    }
    // Note: We don't set isExecutingAdd to false on success here,
    // because isAddingWrite takes over the loading state until the tx is sent.

  }, [userAddress, chainId, poolKey, poolState, token0, token1, estimatedLiquidity, positionManagerAddress, addLiquidityWriteContract, onSuccess]);

  // --- Effect for Handling Post-Confirmation ---
  useEffect(() => {
    if (isAddConfirmed && addLiquidityTxHash) {
      console.log(`useAddV4Liquidity: Transaction confirmed: ${addLiquidityTxHash}`);
      setFinalTxHash(addLiquidityTxHash);
      setIsExecutingAdd(false); // Stop loading state now that it's confirmed
      if (onSuccess) {
        onSuccess(addLiquidityTxHash);
      }
    }
    // Also stop loading if confirmation fails
    if (confirmationError) {
        setIsExecutingAdd(false);
    }
  }, [isAddConfirmed, addLiquidityTxHash, confirmationError, onSuccess]);

  // --- Combined Error Handling --- (Fixing linter errors)
  useEffect(() => {
    let errorMsg: string | null = null;
    // Simulation errors handled within the callback now
    if (addWriteError) {
       console.error("Add Liquidity Write Error:", addWriteError);
       // Use .message, not .shortMessage
       errorMsg = `Transaction submission failed: ${addWriteError.message}`;
       setIsExecutingAdd(false); // Stop loading if write fails
    } else if (confirmationError) {
      console.error("Add Liquidity Confirmation Error:", confirmationError);
      // Use .message, not .shortMessage
      errorMsg = `Transaction confirmation failed: ${confirmationError.message}`;
      // isExecutingAdd handled in confirmation effect
    }

    // Only set error if it's one of these, otherwise keep potential error from callback
    if (errorMsg && (!internalError || internalError.startsWith("Failed:"))) {
        setInternalError(errorMsg);
    }
    // Clear error if these specific errors resolve and no simulation error exists
    else if (!addWriteError && !confirmationError && internalError && !internalError.startsWith("Failed:")) {
        setInternalError(null);
    }

  }, [addWriteError, confirmationError, internalError]);

  return {
    addLiquidity,
    // isAdding reflects the entire process: executing the callback OR waiting for tx OR confirming
    isAdding: isExecutingAdd || isAddingWrite,
    isConfirming, // Still reflects tx receipt loading
    addError: internalError,
    txHash: finalTxHash,
  };
} 