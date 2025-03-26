import { useReadContract } from 'wagmi';
import { useEffect, useState } from 'react';
import { usePaginatedMarkets, useMarketByIndex } from '@/hooks/fetchMarkets';


// This hook gets a specific market and extracts pool information
export function useMarketWithPools(marketId: string | number) {
  // Get the specific market
  const { market, isLoading, isError, error } = useMarketByIndex(marketId);
  
  // Calculate and format pool data
  const formatPoolData = (poolKey: any) => {
    if (!poolKey) return null;
    
    // Extract relevant information from the pool key
    return {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: poolKey.fee,
      sqrtPriceX96: poolKey.sqrtPriceX96,
      liquidity: poolKey.liquidity,
    };
  };

  // Format the yes and no pools
  const yesPool = market ? formatPoolData(market.yesPoolKey) : null;
  const noPool = market ? formatPoolData(market.noPoolKey) : null;

  return {
    market,
    yesPool,
    noPool,
    isLoading,
    isError,
    error,
  };
}
