import { useState, useEffect, useMemo } from 'react';
import { useSlot0 } from '@/hooks/useStateView';
import { PoolKey, poolKeyToId } from '@/utils/poolUtils';
import { useMarketByIndex } from '@/hooks/fetchMarkets';

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
  const [poolIds, setPoolIds] = useState<{
    yesPoolId?: string;
    noPoolId?: string;
  }>({});
  
  useEffect(() => {
    console.log('useMarketWithPoolData - useEffect for poolIds triggered');
    
    if (market) {
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
        
        setPoolIds({
          yesPoolId,
          noPoolId
        });
      } catch (error) {
        console.error('useMarketWithPoolData - Error generating pool IDs:', error);
        setPoolIds({});
      }
    }
  }, [market]);
  
  // Get Slot0 data for yes pool
  const { 
    data: yesSlot0Data, 
    isLoading: yesSlot0Loading 
  } = useSlot0(poolIds.yesPoolId);
  
  console.log('useMarketWithPoolData - yesPoolId:', poolIds.yesPoolId);
  console.log('useMarketWithPoolData - yesSlot0Data:', yesSlot0Data);
  console.log('useMarketWithPoolData - yesSlot0Loading:', yesSlot0Loading);
  
  // Get Slot0 data for no pool
  const { 
    data: noSlot0Data, 
    isLoading: noSlot0Loading 
  } = useSlot0(poolIds.noPoolId);
  
  console.log('useMarketWithPoolData - noPoolId:', poolIds.noPoolId);
  console.log('useMarketWithPoolData - noSlot0Data:', noSlot0Data);
  console.log('useMarketWithPoolData - noSlot0Loading:', noSlot0Loading);
  
  // Combine all data
  const yesPool = useMemo(() => {
    console.log('useMarketWithPoolData - yesPool useMemo triggered');
    
    if (!market?.yesPoolKey) {
      console.log('useMarketWithPoolData - no yesPoolKey available');
      return null;
    }
    
    const result = {
      poolId: poolIds.yesPoolId,
      currency0: market.yesPoolKey.currency0,
      currency1: market.yesPoolKey.currency1,
      fee: market.yesPoolKey.fee,
      token: market.yesToken,
      ...yesSlot0Data
    };
    
    console.log('useMarketWithPoolData - yesPool result:', result);
    return result;
  }, [market, poolIds.yesPoolId, yesSlot0Data]);
  
  const noPool = useMemo(() => {
    console.log('useMarketWithPoolData - noPool useMemo triggered');
    
    if (!market?.noPoolKey) {
      console.log('useMarketWithPoolData - no noPoolKey available');
      return null;
    }
    
    const result = {
      poolId: poolIds.noPoolId,
      currency0: market.noPoolKey.currency0,
      currency1: market.noPoolKey.currency1,
      fee: market.noPoolKey.fee,
      token: market.noToken,
      ...noSlot0Data
    };
    
    console.log('useMarketWithPoolData - noPool result:', result);
    return result;
  }, [market, poolIds.noPoolId, noSlot0Data]);
  
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