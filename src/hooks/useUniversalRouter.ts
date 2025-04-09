import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Hex } from 'viem';
import { useChainConfig } from '@/config';
import { wagmiConfig } from '@/app/providers';

// Import ABI
import { UniversalRouterABI } from '@/contracts/UniversalRouterABI';

export interface SwapParams {
  key: {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
  };
  amountIn: string;
  minAmountOut: string;
  deadline?: number; // in seconds
}

export function useUniversalRouter() {
  const { address: userAddress } = useAccount();
  const config = useChainConfig();
  const routerAddress = config.UNIVERSAL_ROUTER_ADDRESS as `0x${string}`;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: swapTxHash, writeContract: swapWriteContract, isPending: isSwapping, error: swapError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isSwapConfirmed, error: confirmationError } = useWaitForTransactionReceipt({ hash: swapTxHash });

  const swapExactInputSingle = useCallback(async (params: SwapParams) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!userAddress || !routerAddress) {
        throw new Error("User address or router address not available");
      }

      // Commands encode (V4_SWAP command code)
      const commands = "0x09";
      
      // Action codes
      const SWAP_EXACT_IN_SINGLE = 0;
      const SETTLE_ALL = 9;
      const TAKE_ALL = 8;

      // Encode actions
      const actions = `0x${SWAP_EXACT_IN_SINGLE.toString(16).padStart(2, '0')}${SETTLE_ALL.toString(16).padStart(2, '0')}${TAKE_ALL.toString(16).padStart(2, '0')}`;

      // Encode parameters for each action
      const exactInputParams = {
        poolKey: params.key,
        zeroForOne: true,
        amountIn: BigInt(params.amountIn),
        amountOutMinimum: BigInt(params.minAmountOut),
        hookData: "0x"
      };

      const settleParams = {
        token: params.key.currency0,
        amount: BigInt(params.amountIn)
      };

      const takeParams = {
        token: params.key.currency1,
        amount: BigInt(params.minAmountOut)
      };

      // Combine actions and params
      const routerInputs = {
        actions,
        params: [exactInputParams, settleParams, takeParams]
      };

      // Deadline calculation
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1200; // Default 20 minutes

      // Execute swap through router
      swapWriteContract({
        address: routerAddress,
        abi: UniversalRouterABI,
        functionName: 'execute',
        args: [commands, [routerInputs], BigInt(deadline)],
        gas: BigInt(500000) // Adjust gas limit as needed
      });

    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
      setLoading(false);
      throw err;
    }
  }, [userAddress, routerAddress, swapWriteContract]);

  // Effect to handle transaction confirmation
  useEffect(() => {
    if (isSwapConfirmed && swapTxHash) {
      setLoading(false);
      // Handle successful swap
    }
    if (confirmationError) {
      setError(confirmationError.message);
      setLoading(false);
    }
  }, [isSwapConfirmed, swapTxHash, confirmationError]);

  return {
    swapExactInputSingle,
    loading: loading || isSwapping || isConfirming,
    error: error || swapError?.message || confirmationError?.message
  };
}
