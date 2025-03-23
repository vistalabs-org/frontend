// Import the ABI file and define types based on it
import { useReadContract } from 'wagmi'
import { useEffect, useState } from 'react'
import {MarketHookAbi} from '@/contracts/PredictionMarketHook_abi'
import { PREDICTION_MARKET_HOOK_ADDRESS } from '@/app/constants'
import { IMarketMakerHookAbi } from '@/contracts/IMarketMakerHook';

// The ABI contains complex types for PoolKey and Market
// Let's define TypeScript interfaces for these
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
}

export const useMarketCount = () => {

  // Add a state to handle the case when the hook is called before the provider is ready
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [hookError, setHookError] = useState<Error | null>(null);

  const result = useReadContract({
    address: PREDICTION_MARKET_HOOK_ADDRESS,
    abi: IMarketMakerHookAbi,
    functionName: 'marketCount',
  });

  useEffect(() => {
    console.log(result.data)
    if (result.data !== undefined) {
      setCount(Number(result.data));
      setLoading(false);
    }
    if (result.error) {
      setHookError(result.error as Error);
      setLoading(false);
    }
  }, [result.data, result.error]);

  return {
    marketCount: count,
    isLoading: loading,
    error: hookError,
  };
};

/**
 * Custom hook for fetching all markets from the contract
 * 
 * @param enabled - Whether the query should be enabled
 * @returns Object containing markets data and loading state
 */
export function useAllMarkets(enabled = true) {
  const result = useReadContract({
    address: PREDICTION_MARKET_HOOK_ADDRESS,
    abi: IMarketMakerHookAbi,
    functionName: 'markets',
    query: {
      enabled,
    },
  });

  // Only log changes when data or error actually change
  useEffect(() => {
    console.log("Contract data:", result.data);
    console.log("Contract error:", result.error);
    // if (result.error) console.error("Contract error:", result.error);
  }, [result.data, result.error]);

  return {
    markets: result.data as Market[] | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
  }
}

export function useMarketByIndex(offset: number|string) {
  const result = usePaginatedMarkets(offset, 1);
  return {
    ...result,
    market: result.markets ? result.markets[0] : undefined
  }
}

/**
 * Custom hook for fetching markets with pagination
 * 
 * @param offset - The starting index for pagination
 * @param limit - The number of markets to fetch
 * @param enabled - Whether the query should be enabled
 * @returns Object containing paginated markets data and loading state
 */
export function usePaginatedMarkets(
  offset: number | string, 
  limit: number, 
  enabled = true
) {
  const { data, isLoading, isError, error } = useReadContract({
    address: PREDICTION_MARKET_HOOK_ADDRESS,
    abi: MarketHookAbi,
    functionName: 'getMarkets',
    args: [BigInt(offset), BigInt(limit)],
    query: {
        enabled,
      },
  })

  return {
    markets: data as Market[] | undefined,
    isLoading,
    isError,
    error,
  }
}

/**
 * Custom hook for infinite loading of markets
 * 
 * @param pageSize - The number of markets to fetch per page
 * @returns Object containing all loaded markets and functions to load more
 */
export function useInfiniteMarkets(pageSize = 10) {
  const [markets, setMarkets] = useState<Market[]>([])
  const [currentOffset, setCurrentOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  // Get total count of markets
  const { data: totalCountData } = useReadContract({
    address: PREDICTION_MARKET_HOOK_ADDRESS,
    abi: MarketHookAbi,
    functionName: 'getMarketCount',
  })
  
  const totalCount = totalCountData ? Number(totalCountData) : 0

  // Fetch the current page of markets
  const { markets: pageMarkets, isLoading: pageLoading } = usePaginatedMarkets(
    currentOffset,
    pageSize,
    currentOffset < totalCount // Only enable if there are more markets to fetch
  )
  
  // Update markets when new page data is received
  useEffect(() => {
    if (pageMarkets && !pageLoading) {
      setMarkets(prev => [...prev, ...pageMarkets])
      setIsLoading(false)
      
      // Check if we've loaded all markets
      if (currentOffset + pageSize >= totalCount || pageMarkets.length < pageSize) {
        setHasMore(false)
      }
    }
  }, [pageMarkets, pageLoading, currentOffset, pageSize, totalCount])
  
  // Function to load the next page
  const loadMore = () => {
    if (!isLoading && hasMore) {
      setIsLoading(true)
      setCurrentOffset(prev => prev + pageSize)
    }
  }
  
  return {
    markets,
    isLoading: isLoading || pageLoading,
    hasMore,
    loadMore,
    totalCount,
  }
}

// Optional: A simpler version that combines the hooks
export function useMarkets(
  contractAddress: `0x${string}`,
  options?: {
    pagination?: { offset: number; limit: number };
    infinite?: boolean;
    pageSize?: number;
  }
) {
  if (options?.infinite) {
    return useInfiniteMarkets(options.pageSize || 10)
  } else if (options?.pagination) {
    return usePaginatedMarkets(
      options.pagination.offset,
      options.pagination.limit
    )
  } else {
    return useAllMarkets()
  }
}