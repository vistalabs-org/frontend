// Import the ABI file and define types based on it
import { useReadContract } from 'wagmi'
import { useEffect, useState } from 'react'
import PredictionMarketHook_abi from '@/contracts/PredictionMarketHook.json'
import IPredictionMarketHookAbi from '@/contracts/IPredictionMarketHook.json';
import { usePredictionMarketHookAddress } from '@/config';
import { useChainId } from 'wagmi';

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
  id?: string // Optional ID field that we can add for the UI
  yesPrice?: number // Optional calculated field for UI
  noPrice?: number // Optional calculated field for UI
}

export const useMarketCount = () => {
  const hookAddress = usePredictionMarketHookAddress();
  const chainId = useChainId();
  
  // Add a state to handle the case when the hook is called before the provider is ready
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [hookError, setHookError] = useState<Error | null>(null);

  // Log the hook address and chain ID
  useEffect(() => {
    console.log(`[useMarketCount] Chain ID: ${chainId}, Hook Address: ${hookAddress}`);
  }, [chainId, hookAddress]);

  const result = useReadContract({
    address: hookAddress as `0x${string}`,
    abi: IPredictionMarketHookAbi,
    functionName: 'marketCount',
  });

  useEffect(() => {
    console.log(`[useMarketCount] Data:`, result.data, `Error:`, result.error);
    if (result.data !== undefined) {
      setCount(Number(result.data));
      setLoading(false);
    }
    if (result.error) {
      console.error(`[useMarketCount] Error fetching market count:`, result.error);
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
  const hookAddress = usePredictionMarketHookAddress();
  const chainId = useChainId();
  
  // Log the contract address and chain ID
  useEffect(() => {
    console.log(`[useAllMarkets] Chain ID: ${chainId}, Hook Address: ${hookAddress}`);
  }, [chainId, hookAddress]);

  const result = useReadContract({
    address: hookAddress as `0x${string}`,
    abi: PredictionMarketHook_abi,
    functionName: 'getAllMarkets',
  });

  // Enhanced error logging
  useEffect(() => {
    console.log(`[useAllMarkets] Data:`, result.data);
    if (result.error) {
      console.error(`[useAllMarkets] Error fetching all markets:`, result.error);
      console.error(`Error details:`, JSON.stringify(result.error, null, 2));
    }
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
  const hookAddress = usePredictionMarketHookAddress();
  const chainId = useChainId();
  
  // Log the contract address and chain ID
  useEffect(() => {
    console.log(`[usePaginatedMarkets] Chain ID: ${chainId}, Hook Address: ${hookAddress}, Offset: ${offset}, Limit: ${limit}`);
  }, [chainId, hookAddress, offset, limit]);

  const { data, isLoading, isError, error } = useReadContract({
    address: hookAddress as `0x${string}`,
    abi: IPredictionMarketHookAbi,
    functionName: 'getMarkets',
    args: [BigInt(offset), BigInt(limit)],
  });

  // Log error details
  useEffect(() => {
    if (error) {
      console.error(`[usePaginatedMarkets] Error fetching markets:`, error);
      console.error(`Error details:`, JSON.stringify(error, null, 2));
    }
    if (data) {
      console.log(`[usePaginatedMarkets] Raw markets data:`, data);
    }
  }, [data, error]);

  // Process markets to add UI-specific fields
  const processedMarkets = data ? (data as Market[]).map((market, index) => {
    // Generate an ID based on index or any unique identifier in the market
    const marketId = `${index}`; // You might want to use a more robust ID generation
    
    // Calculate prices (simplified example - you'll need real price calculation logic)
    const yesPrice = 0.5; // Placeholder - calculate actual price
    const noPrice = 0.5; // Placeholder - calculate actual price
    
    return {
      ...market,
      id: marketId,
      yesPrice,
      noPrice
    };
  }) : undefined;

  return {
    markets: processedMarkets,
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
  const hookAddress = usePredictionMarketHookAddress();
  const chainId = useChainId();
  
  // Log the contract address and chain ID
  useEffect(() => {
    console.log(`[useInfiniteMarkets] Chain ID: ${chainId}, Hook Address: ${hookAddress}`);
  }, [chainId, hookAddress]);

  const [markets, setMarkets] = useState<Market[]>([])
  const [currentOffset, setCurrentOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  // Get total count of markets
  const { data: totalCountData, error: countError } = useReadContract({
    address: hookAddress as `0x${string}`,
    abi: PredictionMarketHook_abi,
    functionName: 'getMarketCount',
  })
  
  // Log error for getMarketCount
  useEffect(() => {
    if (countError) {
      console.error(`[useInfiniteMarkets] Error fetching market count:`, countError);
    }
  }, [countError]);
  
  const totalCount = totalCountData ? Number(totalCountData) : 0

  // Fetch the current page of markets
  const { markets: pageMarkets, isLoading: pageLoading, error: pageError } = usePaginatedMarkets(
    currentOffset,
    pageSize,
    currentOffset < totalCount // Only enable if there are more markets to fetch
  )
  
  // Log error for paginated markets
  useEffect(() => {
    if (pageError) {
      console.error(`[useInfiniteMarkets] Error fetching page markets:`, pageError);
    }
  }, [pageError]);
  
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