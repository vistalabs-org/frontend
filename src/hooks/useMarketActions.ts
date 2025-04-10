"use client";

import { useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import PredictionMarketHook_abi from '@/contracts/PredictionMarketHook.json';
import { usePredictionMarketHookAddress } from '@/config';

interface PoolKey {
  currency0: `0x${string}`
  currency1: `0x${string}`
  fee: number
  tickSpacing: number
  hooks: `0x${string}`
}

interface Market {
  yesPoolKey: PoolKey
  noPoolKey: PoolKey
  oracle: `0x${string}`
  creator: `0x${string}`
  yesToken: `0x${string}`
  noToken: `0x${string}`
  state: number
  outcome: boolean
  totalCollateral: bigint
  collateralAddress: `0x${string}`
  title: string
  description: string
  endTimestamp: bigint
  curveId: bigint
}

// Hook to fetch market data by ID
export function useMarketData(marketId?: string) {
  const hookAddress = usePredictionMarketHookAddress();

  // Ensure marketId is treated as bytes32 if necessary
  // The ABI expects bytes32, ensure the input string format is compatible or convert
  const formattedMarketId = marketId as `0x${string}` | undefined; // Basic cast, might need actual conversion

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: hookAddress as `0x${string}`,
    abi: PredictionMarketHook_abi,
    functionName: 'getMarketById',
    args: formattedMarketId ? [formattedMarketId] : undefined,
    query: {
      enabled: !!formattedMarketId && !!hookAddress, 
    },
  });

  // Cast the result to the Market interface
  const marketData = data as Market | undefined;

  return {
    marketData,
    isLoading,
    isError,
    error,
    refetch,
  };
}


// Hook to resolve a market
export function useResolveMarket() {
  const { address } = useAccount();
  const { writeContractAsync, isPending, error, data: transactionHash } = useWriteContract();
  const hookAddress = usePredictionMarketHookAddress();

  const resolveMarket = useCallback(async (marketId: string, outcome: boolean) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    if (!hookAddress) {
      throw new Error('Hook address not found');
    }
    if (!marketId) {
      throw new Error('Market ID is required');
    }

    // Ensure marketId is treated as bytes32
    const formattedMarketId = marketId as `0x${string}`;

    try {

      const hash = await writeContractAsync({
        address: hookAddress as `0x${string}`,
        abi: PredictionMarketHook_abi,
        functionName: 'resolveMarket',
        args: [formattedMarketId, outcome],
      });
      return hash;
    } catch (err) {
      console.error('Error resolving market:', err);
      throw err;
    }
  }, [address, hookAddress, writeContractAsync]);

  return {
    resolveMarket,
    isLoading: isPending,
    isError: !!error,
    error,
    transactionHash, // Hash of the submitted transaction
    isSuccess: !!transactionHash && !isPending && !error
  };
}


// Hook to cancel a market
export function useCancelMarket() {
  const { address } = useAccount();
  const { writeContractAsync, isPending, error, data: transactionHash } = useWriteContract();
  const hookAddress = usePredictionMarketHookAddress();

  const cancelMarket = useCallback(async (marketId: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    if (!hookAddress) {
      throw new Error('Hook address not found');
    }
    if (!marketId) {
      throw new Error('Market ID is required');
    }

    // Ensure marketId is treated as bytes32
    const formattedMarketId = marketId as `0x${string}`; 

    try {
      // TODO: Add simulation step here
      const hash = await writeContractAsync({
        address: hookAddress as `0x${string}`,
        abi: PredictionMarketHook_abi,
        functionName: 'cancelMarket',
        args: [formattedMarketId],
      });
      return hash;
    } catch (err) {
      console.error('Error cancelling market:', err);
      throw err;
    }
  }, [address, hookAddress, writeContractAsync]);

  return {
    cancelMarket,
    isLoading: isPending,
    isError: !!error,
    error,
    transactionHash,
    isSuccess: !!transactionHash && !isPending && !error
  };
}

