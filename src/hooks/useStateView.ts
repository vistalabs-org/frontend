import { useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import StateViewAbi from '@/contracts/StateView.json';
import { useStateViewAddress } from '@/config';

interface Slot0Data {
  sqrtPriceX96: bigint;
  tick: number;
  protocolFee: number;
  lpFee: number;
  price?: number;
  formattedPrice?: string;
}

/**
 * Hook to get liquidity for a pool
 * @param poolId The ID of the pool to query
 * @returns Liquidity data for the pool
 */
export function useLiquidity(poolId?: string) {
  const stateViewAddress = useStateViewAddress();

  const { data, isLoading, isError, error } = useReadContract({
    address: stateViewAddress as `0x${string}`,
    abi: StateViewAbi,
    functionName: 'getLiquidity',
    args: poolId ? [poolId] : undefined,
    query: {
      enabled: !!poolId && !!stateViewAddress,
    }
  });

  if (isError) {
    console.error('useLiquidity - Contract call error:', error);
  }
  
  return {
    data, // Return the raw bigint liquidity value
    isLoading,
    isError,
    error,
  };
}

/**
 * Hook to get liquidity for multiple pools
 * @param poolIds Array of pool IDs to query
 * @returns Object with pool IDs as keys and their liquidity data as values
 */
export function useMultipleLiquidity(poolIds: string[]) {
  const [results, setResults] = useState<Record<string, bigint | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const newResults: Record<string, bigint | null> = {};
        
        // Create an array of promises for all pool queries
        const promises = poolIds.map(async (poolId) => {
          try {
            const result = await fetch(`/api/liquidity?poolId=${poolId}`).then(res => res.json());
            newResults[poolId] = result ? BigInt(result) : null;
          } catch (err) {
            console.error(`Error fetching liquidity for pool ${poolId}:`, err);
            newResults[poolId] = null;
          }
        });
        
        // Wait for all promises to resolve
        await Promise.all(promises);
        
        setResults(newResults);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    if (poolIds.length > 0) {
      fetchData();
    } else {
      setResults({});
      setIsLoading(false);
    }
  }, [poolIds.join(',')]);

  return {
    results,
    isLoading,
    error,
  };
}

/**
 * Hook to get Slot0 data for a pool
 * @param poolId The ID of the pool to query
 * @returns Slot0 data including price information
 */
export function useSlot0(poolId?: string) {  
  const stateViewAddress = useStateViewAddress();

  const { data, isLoading, isError, error } = useReadContract({
    address: stateViewAddress as `0x${string}`,
    abi: StateViewAbi,
    functionName: 'getSlot0',
    args: poolId ? [poolId] : undefined,
    query: {
      enabled: !!poolId && !!stateViewAddress,
    }
  });

  if (isError) {
    console.error('useSlot0 - Contract call error:', error);
  }

  // Process the data to include calculated price
  const [processedData, setProcessedData] = useState<Slot0Data | null>(null);

  useEffect(() => {
    if (data) {
      const [sqrtPriceX96, tick, protocolFee, lpFee] = data as [bigint, number, number, number];

      // Calculate the original price of Yes in USDC
      const sqrtPrice = Number(sqrtPriceX96) / 2**96;
      const priceOfYesInUsdc = sqrtPrice * sqrtPrice;

      // Calculate the INVERTED price (USDC per YES, intended for display)
      let invertedPrice = 0;
      if (priceOfYesInUsdc > 0) {
          invertedPrice = 1 / priceOfYesInUsdc;
      }

      const newProcessedData = {
        sqrtPriceX96,
        tick,
        protocolFee,
        lpFee,
        price: invertedPrice,
        formattedPrice: `${(invertedPrice * 100).toFixed(2)}%`
      };

      setProcessedData(newProcessedData);
    } else {
      console.log('useSlot0 - no data available, setting processedData to null');
      setProcessedData(null);
    }
  }, [data]);
  
  const result = {
    data: processedData,
    isLoading,
    isError,
    error,
  };
  
  console.log('useSlot0 - final result (with inverted price display logic):', result);
  return result;
}

/**
 * Hook to get Slot0 data for multiple pools
 * @param poolIds Array of pool IDs to query
 * @returns Object with pool IDs as keys and their Slot0 data as values
 */
export function useMultipleSlot0(poolIds: string[]) {
  const [results, setResults] = useState<Record<string, Slot0Data | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const newResults: Record<string, Slot0Data | null> = {};
        
        // Create an array of promises for all pool queries
        const promises = poolIds.map(async (poolId) => {
          const result = await fetch(`/api/slot0?poolId=${poolId}`).then(res => res.json());
          newResults[poolId] = result;
        });
        
        // Wait for all promises to resolve
        await Promise.all(promises);
        
        setResults(newResults);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    if (poolIds.length > 0) {
      fetchData();
    } else {
      setResults({});
      setIsLoading(false);
    }
  }, [poolIds.join(',')]);

  return {
    results,
    isLoading,
    error,
  };
}
