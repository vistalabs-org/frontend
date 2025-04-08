import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Hex, parseUnits } from 'viem';
import { PoolKey } from '@uniswap/v4-sdk';
import { PoolManagerABI } from '@/contracts/PoolManagerABI';
import { POSITION_MANAGER_ADDRESS } from '@/app/constants';
import { getPublicClient } from '@wagmi/core';
import { wagmiConfig } from '@/app/providers';

// Define constants
const BYTES32_ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;
const EMPTY_BYTES = '0x' as Hex;

interface UseAddV4LiquidityProps {
  poolKey: PoolKey | null;
  poolState?: { 
      sqrtPriceX96: bigint;
      tick: number;        
      liquidity: bigint;   
  } | null;
  estimatedLiquidity: string; // Expecting raw bigint string
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
  poolState, // Keep for potential future validation if needed
  estimatedLiquidity,
  onSuccess,
}: UseAddV4LiquidityProps): AddLiquidityStatus {
  const { address: userAddress, chainId } = useAccount(); // Keep chainId for context
  const [internalError, setInternalError] = useState<string | null>(null);
  const [finalTxHash, setFinalTxHash] = useState<Hex | undefined>(undefined);

  const publicClient = getPublicClient(wagmiConfig);

  const { data: addLiquidityTxHash, writeContract: addLiquidityWriteContract, isPending: isAddingWrite, error: addWriteError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isAddConfirmed, error: confirmationError } = useWaitForTransactionReceipt({ hash: addLiquidityTxHash });

  const addLiquidity = useCallback(async () => {
    console.log("useAddV4Liquidity: addLiquidity function entered.");
    setInternalError(null);
    setFinalTxHash(undefined);

    // console.log("useAddV4Liquidity: Checking preconditions...", { userAddress, poolKey, estimatedLiquidity }); // Reduced verbosity

    if (!userAddress || !poolKey || !estimatedLiquidity || BigInt(estimatedLiquidity) <= 0 || !POSITION_MANAGER_ADDRESS || !publicClient || !chainId) {
      const errorMsg = "useAddV4Liquidity: Missing required data (user, poolKey, liquidity, config).";
      console.error(errorMsg, { userAddress, poolKey, estimatedLiquidity, POSITION_MANAGER_ADDRESS, publicClientExists: !!publicClient, chainId });
      setInternalError(errorMsg);
      return;
    }

    // --- REMOVED Direct Allowance Check --- 

    console.log("useAddV4Liquidity: Preparing modifyLiquidity transaction...");
    try {

      const { tickLower, tickUpper } = getFullRangeTicks(poolKey.tickSpacing);
      // console.log(`useAddV4Liquidity: Using Ticks: Lower=${tickLower}, Upper=${tickUpper}`); // Reduced verbosity
      if (tickLower >= tickUpper) {
        throw new Error(`Invalid tick range: ${tickLower} >= ${tickUpper}`);
      }

      const liquidityDelta = BigInt(estimatedLiquidity);
      if (liquidityDelta <= 0) {
          throw new Error("Estimated liquidity must be positive.");
      }

      // Define ModifyLiquidity parameters for PoolManager
      const modifyParams = {
        tickLower: tickLower,
        tickUpper: tickUpper,
        liquidityDelta: liquidityDelta, 
        salt: BYTES32_ZERO // Use correct bytes32 zero value for salt
      };
      
      // Revert to using empty bytes for hookData
      const hookData: Hex = EMPTY_BYTES;
      
      console.log("Preparing modifyLiquidity call:", { key: poolKey, params: modifyParams, hookData });

      // Simulate Contract Call
      console.log("--- Simulating modifyLiquidity --- ");
      const { request } = await publicClient.simulateContract({
          account: userAddress,
          address: POSITION_MANAGER_ADDRESS, 
          abi: PoolManagerABI,          
          functionName: 'modifyLiquidity',
          args: [poolKey, modifyParams, hookData], 
      });
      console.log("Simulation successful, sending transaction...");

      // Execute Transaction
      addLiquidityWriteContract(request);

    } catch (error: any) {
      console.error("Error during modifyLiquidity preparation or simulation:", error);
      let readableError = error.message;
      // Attempt to extract more specific revert reason
      if (error.cause) {
          const cause = error.cause as any;
          if (cause.data?.args?.[0]) { // Check if revert reason string exists
              readableError = `Transaction reverted: ${cause.data.args[0]}`;
          } else if (cause.shortMessage) {
              readableError = `Transaction simulation failed: ${cause.shortMessage}`;
          } else {
              readableError = `Transaction simulation failed: ${cause.message || error.message}`;
          }
      } else if (error.shortMessage) {
          readableError = `Transaction simulation failed: ${error.shortMessage}`;
      }
      console.error("Simulation Error Full Details:", error);
      setInternalError(`Failed: ${readableError}`);
    }
  }, [
    userAddress, chainId, poolKey, estimatedLiquidity, // Removed poolState from deps if not used
    onSuccess, addLiquidityWriteContract, publicClient
  ]);

  // --- Effect for Handling Post-Confirmation --- 
  useEffect(() => {
    if (isAddConfirmed && addLiquidityTxHash) {
      console.log(`useAddV4Liquidity: Transaction confirmed: ${addLiquidityTxHash}`);
      setFinalTxHash(addLiquidityTxHash);
      if (onSuccess) {
        onSuccess(addLiquidityTxHash);
      }
    }
  }, [isAddConfirmed, addLiquidityTxHash, onSuccess]);

  // --- Combined Error Handling --- 
  useEffect(() => {
    let errorMsg: string | null = null;
    if (internalError) {
        errorMsg = internalError; // Prioritize simulation error
    } else if (addWriteError) {
      errorMsg = `Transaction submission failed: ${addWriteError.message}`;
    } else if (confirmationError) {
      errorMsg = `Transaction confirmation failed: ${confirmationError.message}`;
    } 
    setInternalError(errorMsg);
  }, [addWriteError, confirmationError, internalError]); // Add internalError dependency

  return {
    addLiquidity,
    isAdding: isAddingWrite, 
    isConfirming, 
    addError: internalError,
    txHash: finalTxHash,
  };
} 