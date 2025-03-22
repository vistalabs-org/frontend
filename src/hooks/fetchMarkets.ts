// Import the ABI file and define types based on it
import { useReadContract } from 'wagmi'
import { useEffect, useState } from 'react'
import marketsABI from '@/contracts/PredictionMarketHook_abi.json'

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

/**
 * Custom hook for fetching all markets from the contract
 * 
 * @param contractAddress - The address of the contract
 * @param enabled - Whether the query should be enabled
 * @returns Object containing markets data and loading state
 */
export function useAllMarkets(contractAddress: `0x${string}`, enabled = true) {
  const { data, isLoading, isError, error } = useReadContract({
    address: contractAddress,
    abi: marketsABI,
    functionName: 'getAllMarkets',
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
 * Custom hook for fetching markets with pagination
 * 
 * @param contractAddress - The address of the contract
 * @param offset - The starting index for pagination
 * @param limit - The number of markets to fetch
 * @param enabled - Whether the query should be enabled
 * @returns Object containing paginated markets data and loading state
 */
export function usePaginatedMarkets(
  contractAddress: `0x${string}`, 
  offset: number, 
  limit: number, 
  enabled = true
) {
  const { data, isLoading, isError, error } = useReadContract({
    address: contractAddress,
    abi: marketsABI,
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
 * @param contractAddress - The address of the contract
 * @param pageSize - The number of markets to fetch per page
 * @returns Object containing all loaded markets and functions to load more
 */
export function useInfiniteMarkets(contractAddress: `0x${string}`, pageSize = 10) {
  const [markets, setMarkets] = useState<Market[]>([])
  const [currentOffset, setCurrentOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  // Get total count of markets
  const { data: totalCountData } = useReadContract({
    address: contractAddress,
    abi: marketsABI,
    functionName: 'getMarketCount',
  })
  
  const totalCount = totalCountData ? Number(totalCountData) : 0

  // Fetch the current page of markets
  const { markets: pageMarkets, isLoading: pageLoading } = usePaginatedMarkets(
    contractAddress,
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
    return useInfiniteMarkets(contractAddress, options.pageSize || 10)
  } else if (options?.pagination) {
    return usePaginatedMarkets(
      contractAddress,
      options.pagination.offset,
      options.pagination.limit
    )
  } else {
    return useAllMarkets(contractAddress)
  }
}