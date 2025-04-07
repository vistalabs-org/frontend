import { useState, useEffect, useMemo } from 'react';
import { useSlot0 } from '@/hooks/useStateView';
import { PoolKey, poolKeyToId } from '@/utils/poolUtils';
import { useMarketByIndex } from '@/hooks/fetchMarkets';

// Helper to create stable dependency strings from complex objects
const createStableDeps = (obj: any): string => {
  try {
    // Only include necessary primitive fields or stable IDs
    if (!obj) return 'null';
    // Example: customize based on object structure
    if (obj.sqrtPriceX96 !== undefined) {
       return `${obj.sqrtPriceX96?.toString()}_${obj.tick}_${obj.price?.toString()}`;
    }
    if (obj.yesPoolKey !== undefined) {
       return `${obj.yesToken}_${obj.noToken}`;
    }
    // Fallback: stringify with sorted keys for basic stability
    return JSON.stringify(obj, Object.keys(obj).sort());
  } catch {
    return 'error';
  }
};

/**
 * Comprehensive hook to get market data with pool information
 * @param marketId The market ID
 * @returns Market data with yes and no pool information
 */
export function useMarketWithPoolData(marketId: string | number) {
  console.log('useMarketWithPoolData called with marketId:', marketId);
  
  // Get the market data
  const { market, isLoading: marketLoading, isError: marketError } = useMarketByIndex(marketId);
  
  console.log('useMarketWithPoolData - market data:', market);
  console.log('useMarketWithPoolData - marketLoading:', marketLoading);
  console.log('useMarketWithPoolData - marketError:', marketError);
  
  // Generate pool IDs from pool keys
  const { yesPoolId, noPoolId } = useMemo(() => {
    if (!market) return { yesPoolId: undefined, noPoolId: undefined };
    try {
      console.log('useMarketWithPoolData - market available, extracting pool keys');
      console.log('useMarketWithPoolData - yesPoolKey:', market.yesPoolKey);
      console.log('useMarketWithPoolData - noPoolKey:', market.noPoolKey);
      
      // Extract yes pool key
      const yesPoolKey: PoolKey = {
        currency0: market.yesPoolKey.currency0,
        currency1: market.yesPoolKey.currency1,
        fee: market.yesPoolKey.fee || 500,
        tickSpacing: market.yesPoolKey.tickSpacing || 10,
        hooks: market.yesPoolKey.hooks || '0x0000000000000000000000000000000000000000'
      };
      
      // Extract no pool key
      const noPoolKey: PoolKey = {
        currency0: market.noPoolKey.currency0,
        currency1: market.noPoolKey.currency1,
        fee: market.noPoolKey.fee || 500,
        tickSpacing: market.noPoolKey.tickSpacing || 10,
        hooks: market.noPoolKey.hooks || '0x0000000000000000000000000000000000000000'
      };
      
      console.log('useMarketWithPoolData - constructed yesPoolKey:', yesPoolKey);
      console.log('useMarketWithPoolData - constructed noPoolKey:', noPoolKey);
      
      // Convert to pool IDs
      const yesPoolId = poolKeyToId(yesPoolKey);
      const noPoolId = poolKeyToId(noPoolKey);
      
      console.log('useMarketWithPoolData - generated yesPoolId:', yesPoolId);
      console.log('useMarketWithPoolData - generated noPoolId:', noPoolId);
      
      return {
        yesPoolId,
        noPoolId
      };
    } catch (error) {
      console.error('useMarketWithPoolData - Error generating pool IDs:', error);
      return { yesPoolId: undefined, noPoolId: undefined };
    }
  }, [market?.yesPoolKey?.currency0, market?.yesPoolKey?.currency1, market?.yesPoolKey?.fee, market?.yesPoolKey?.tickSpacing, market?.yesPoolKey?.hooks, 
      market?.noPoolKey?.currency0, market?.noPoolKey?.currency1, market?.noPoolKey?.fee, market?.noPoolKey?.tickSpacing, market?.noPoolKey?.hooks]);
  
  // Get Slot0 data for yes pool
  const { 
    data: yesSlot0Data, 
    isLoading: yesSlot0Loading 
  } = useSlot0(yesPoolId);
  
  console.log('useMarketWithPoolData - yesPoolId:', yesPoolId);
  console.log('useMarketWithPoolData - yesSlot0Data:', yesSlot0Data);
  console.log('useMarketWithPoolData - yesSlot0Loading:', yesSlot0Loading);
  
  // Get Slot0 data for no pool
  const { 
    data: noSlot0Data, 
    isLoading: noSlot0Loading 
  } = useSlot0(noPoolId);
  
  console.log('useMarketWithPoolData - noPoolId:', noPoolId);
  console.log('useMarketWithPoolData - noSlot0Data:', noSlot0Data);
  console.log('useMarketWithPoolData - noSlot0Loading:', noSlot0Loading);
  
  // Combine all data
  const yesPool = useMemo(() => {
    console.log('useMarketWithPoolData - yesPool useMemo triggered');
    
    if (!market?.yesPoolKey || !yesPoolId) {
      console.log('useMarketWithPoolData - no yesPoolKey available');
      return null;
    }
    
    const result = {
      poolId: yesPoolId,
      currency0: market.yesPoolKey.currency0,
      currency1: market.yesPoolKey.currency1,
      fee: market.yesPoolKey.fee,
      token: market.yesToken,
      ...yesSlot0Data
    };
    
    console.log('useMarketWithPoolData - yesPool result:', result);
    return result;
  }, [yesPoolId, market?.yesToken, market?.yesPoolKey?.currency0, market?.yesPoolKey?.currency1, market?.yesPoolKey?.fee, createStableDeps(yesSlot0Data)]);
  
  const noPool = useMemo(() => {
    console.log('useMarketWithPoolData - noPool useMemo triggered');
    
    if (!market?.noPoolKey || !noPoolId) {
      console.log('useMarketWithPoolData - no noPoolKey available');
      return null;
    }
    
    const result = {
      poolId: noPoolId,
      currency0: market.noPoolKey.currency0,
      currency1: market.noPoolKey.currency1,
      fee: market.noPoolKey.fee,
      token: market.noToken,
      ...noSlot0Data
    };
    
    console.log('useMarketWithPoolData - noPool result:', result);
    return result;
  }, [noPoolId, market?.noToken, market?.noPoolKey?.currency0, market?.noPoolKey?.currency1, market?.noPoolKey?.fee, createStableDeps(noSlot0Data)]);
  
  const result = {
    market,
    yesPool,
    noPool,
    isLoading: marketLoading || yesSlot0Loading || noSlot0Loading,
    isError: marketError
  };
  
  console.log('useMarketWithPoolData - final result:', result);
  return result;
} 