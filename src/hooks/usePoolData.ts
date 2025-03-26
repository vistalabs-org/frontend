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
  // Get the market data
  const { market, isLoading: marketLoading, isError: marketError } = useMarketByIndex(marketId);
  
  // Generate pool IDs from pool keys
  const [poolIds, setPoolIds] = useState<{
    yesPoolId?: string;
    noPoolId?: string;
  }>({});
  
  useEffect(() => {
    if (market) {
      try {
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
        
        // Convert to pool IDs
        setPoolIds({
          yesPoolId: poolKeyToId(yesPoolKey),
          noPoolId: poolKeyToId(noPoolKey)
        });
      } catch (error) {
        console.error('Error generating pool IDs:', error);
        setPoolIds({});
      }
    }
  }, [market]);
  
  // Get Slot0 data for yes pool
  const { 
    data: yesSlot0Data, 
    isLoading: yesSlot0Loading 
  } = useSlot0(poolIds.yesPoolId);
  
  // Get Slot0 data for no pool
  const { 
    data: noSlot0Data, 
    isLoading: noSlot0Loading 
  } = useSlot0(poolIds.noPoolId);
  
  // Combine all data
  const yesPool = useMemo(() => {
    if (!market?.yesPoolKey) return null;
    
    return {
      poolId: poolIds.yesPoolId,
      currency0: market.yesPoolKey.currency0,
      currency1: market.yesPoolKey.currency1,
      fee: market.yesPoolKey.fee,
      token: market.yesToken,
      ...yesSlot0Data
    };
  }, [market, poolIds.yesPoolId, yesSlot0Data]);
  
  const noPool = useMemo(() => {
    if (!market?.noPoolKey) return null;
    
    return {
      poolId: poolIds.noPoolId,
      currency0: market.noPoolKey.currency0,
      currency1: market.noPoolKey.currency1,
      fee: market.noPoolKey.fee,
      token: market.noToken,
      ...noSlot0Data
    };
  }, [market, poolIds.noPoolId, noSlot0Data]);
  
  return {
    market,
    yesPool,
    noPool,
    isLoading: marketLoading || yesSlot0Loading || noSlot0Loading,
    isError: marketError
  };
} 