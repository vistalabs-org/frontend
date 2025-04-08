import { useEffect, useMemo } from 'react';
import { useSlot0, useLiquidity } from '@/hooks/useStateView';
import { PoolKey, poolKeyToId } from '@/utils/poolUtils';
import { useMarketByIndex } from '@/hooks/fetchMarkets';
import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';

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
 * Comprehensive hook to get market data with pool information AND token decimals
 * @param marketId The market ID
 * @returns Market data with yes/no pool info (including liquidity) and token decimals
 */
export function useMarketWithPoolData(marketId: string | number) {
  
  // Get the market data
  const { market: baseMarket, isLoading: marketLoading, isError: marketError } = useMarketByIndex(marketId);
  
  // Fetch collateral token (currency0 in either pool, assuming it's the same) decimals
  const { data: collateralDecimalsData, isLoading: collateralDecimalsLoading } = useReadContract({
    address: baseMarket?.collateralAddress as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!baseMarket?.collateralAddress },
  });
  const collateralDecimals = typeof collateralDecimalsData === 'number' ? collateralDecimalsData : undefined;

  // Fetch YES token (currency1 in YES pool) decimals
  const { data: yesTokenDecimalsData, isLoading: yesTokenDecimalsLoading } = useReadContract({
    address: baseMarket?.yesToken as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!baseMarket?.yesToken },
  });
  const yesTokenDecimals = typeof yesTokenDecimalsData === 'number' ? yesTokenDecimalsData : undefined;

  // Fetch NO token (currency1 in NO pool) decimals
  const { data: noTokenDecimalsData, isLoading: noTokenDecimalsLoading } = useReadContract({
    address: baseMarket?.noToken as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!baseMarket?.noToken },
  });
  const noTokenDecimals = typeof noTokenDecimalsData === 'number' ? noTokenDecimalsData : undefined;
  
  // Generate pool IDs from pool keys
  const { yesPoolId, noPoolId } = useMemo(() => {
    if (!baseMarket) return { yesPoolId: undefined, noPoolId: undefined };
    try {      
      // Extract yes pool key
      const yesPoolKey: PoolKey = {
        currency0: baseMarket.yesPoolKey.currency0,
        currency1: baseMarket.yesPoolKey.currency1,
        fee: baseMarket.yesPoolKey.fee || 500,
        tickSpacing: baseMarket.yesPoolKey.tickSpacing || 10,
        hooks: baseMarket.yesPoolKey.hooks || '0x0000000000000000000000000000000000000000'
      };
      
      // Extract no pool key
      const noPoolKey: PoolKey = {
        currency0: baseMarket.noPoolKey.currency0,
        currency1: baseMarket.noPoolKey.currency1,
        fee: baseMarket.noPoolKey.fee || 500,
        tickSpacing: baseMarket.noPoolKey.tickSpacing || 10,
        hooks: baseMarket.noPoolKey.hooks || '0x0000000000000000000000000000000000000000'
      };
      
      // Convert to pool IDs
      const yesPoolId = poolKeyToId(yesPoolKey);
      const noPoolId = poolKeyToId(noPoolKey);
      
      console.log(`[usePoolData] Derived Pool IDs - Yes: ${yesPoolId}, No: ${noPoolId}`); // Log derived IDs
      return {
        yesPoolId,
        noPoolId
      };
    } catch (error) {
      return { yesPoolId: undefined, noPoolId: undefined };
    }
  }, [baseMarket?.yesPoolKey?.currency0, baseMarket?.yesPoolKey?.currency1, baseMarket?.yesPoolKey?.fee, baseMarket?.yesPoolKey?.tickSpacing, baseMarket?.yesPoolKey?.hooks,
      baseMarket?.noPoolKey?.currency0, baseMarket?.noPoolKey?.currency1, baseMarket?.noPoolKey?.fee, baseMarket?.noPoolKey?.tickSpacing, baseMarket?.noPoolKey?.hooks]);
  
  // Get Slot0 data for yes pool
  const { 
    data: yesSlot0DataRaw, 
    isLoading: yesSlot0Loading, 
    error: yesSlot0Error 
  } = useSlot0(yesPoolId);
  // Log Slot0 results
  useEffect(() => {
      console.log(`[usePoolData] Yes Pool (${yesPoolId}) Slot0:`, { data: yesSlot0DataRaw, isLoading: yesSlot0Loading, error: yesSlot0Error });
  }, [yesPoolId, yesSlot0DataRaw, yesSlot0Loading, yesSlot0Error]);
  const yesSlot0Data = yesSlot0DataRaw; // Keep using the data variable

  // Get Slot0 data for no pool
  const { 
    data: noSlot0DataRaw, 
    isLoading: noSlot0Loading, 
    error: noSlot0Error 
  } = useSlot0(noPoolId);
  // Log Slot0 results
  useEffect(() => {
      console.log(`[usePoolData] No Pool (${noPoolId}) Slot0:`, { data: noSlot0DataRaw, isLoading: noSlot0Loading, error: noSlot0Error });
  }, [noPoolId, noSlot0DataRaw, noSlot0Loading, noSlot0Error]);
  const noSlot0Data = noSlot0DataRaw;
    
  // Use the useLiquidity hook from useStateView
  const { data: yesLiquidityData, isLoading: isYesLiquidityLoading, isError: isYesLiquidityError } = useLiquidity(yesPoolId);
  const { data: noLiquidityData, isLoading: isNoLiquidityLoading, isError: isNoLiquidityError } = useLiquidity(noPoolId);

  // Process the results
  const yesPool = useMemo(() => {
    if (yesPoolId && baseMarket?.yesToken && baseMarket?.yesPoolKey && yesSlot0Data && typeof yesLiquidityData === 'bigint') {
      return {
        id: yesPoolId,
        currency0: baseMarket.yesPoolKey.currency0,
        currency1: baseMarket.yesPoolKey.currency1,
        fee: baseMarket.yesPoolKey.fee,
        token: baseMarket.yesToken,
        decimals0: collateralDecimals,
        decimals1: yesTokenDecimals,
        ...yesSlot0Data,
        liquidity: yesLiquidityData
      };
    }
    return null;
  }, [yesPoolId, baseMarket?.yesToken, baseMarket?.yesPoolKey?.currency0, baseMarket?.yesPoolKey?.currency1, baseMarket?.yesPoolKey?.fee, collateralDecimals, yesTokenDecimals, createStableDeps(yesSlot0Data), yesLiquidityData]);
  
  const noPool = useMemo(() => {
    if (noPoolId && baseMarket?.noToken && baseMarket?.noPoolKey && noSlot0Data && typeof noLiquidityData === 'bigint') {
      return {
        id: noPoolId,
        currency0: baseMarket.noPoolKey.currency0,
        currency1: baseMarket.noPoolKey.currency1,
        fee: baseMarket.noPoolKey.fee,
        token: baseMarket.noToken,
        decimals0: collateralDecimals,
        decimals1: noTokenDecimals,
        ...noSlot0Data,
        liquidity: noLiquidityData
      };
    }
    return null;
  }, [noPoolId, baseMarket?.noToken, baseMarket?.noPoolKey?.currency0, baseMarket?.noPoolKey?.currency1, baseMarket?.noPoolKey?.fee, collateralDecimals, noTokenDecimals, createStableDeps(noSlot0Data), noLiquidityData]);
  
  // Combine base market data with decimals before returning
  const market = useMemo(() => {
    if (!baseMarket) return undefined;
    return {
      ...baseMarket,
      collateralDecimals,
      yesTokenDecimals,
      noTokenDecimals
    };
  }, [baseMarket, collateralDecimals, yesTokenDecimals, noTokenDecimals]);
  
  const result = {
    market,
    yesPool,
    noPool,
    isLoading: marketLoading || yesSlot0Loading || noSlot0Loading || collateralDecimalsLoading || yesTokenDecimalsLoading || noTokenDecimalsLoading || isYesLiquidityLoading || isNoLiquidityLoading,
    isError: marketError || isYesLiquidityError || isNoLiquidityError
  };
  
  console.log('useMarketWithPoolData - final result:', result);
  return result;
} 