import { useQuery } from '@tanstack/react-query';

// Structure for individual swap event data from GraphQL
interface SwapEventData {
  timestamp: string; 
  amount0: string; // Fetch amount0 delta
  pool: string; // Fetch the pool ID associated with the swap
}

// GraphQL response structure
interface GraphQLResponse {
  data?: {
    Swap?: SwapEventData[];
  };
  errors?: { message: string }[];
}

// Define the structure for swap deltas
export interface SwapDeltaDataPoint {
  timestamp: number; // Unix timestamp (in milliseconds)
  amount0Delta: number;
}

// Structure for the hook's return value (organized by pool)
export interface SwapDeltasByPoolResult {
    yes: SwapDeltaDataPoint[];
    no: SwapDeltaDataPoint[];
}

// Helper function to fetch swap history deltas for multiple pools
async function fetchSwapDeltasForPools(
    yesPoolId: string | undefined,
    noPoolId: string | undefined
): Promise<SwapDeltasByPoolResult | null> {
  const poolIdsToFetch = [yesPoolId, noPoolId].filter(Boolean) as string[];
  if (poolIdsToFetch.length === 0) {
    // console.log("[fetchSwapDeltasForPools] No valid pool IDs provided.");
    return null;
  }
  
  const endpoint = process.env.NEXT_PUBLIC_ENVIO_ENDPOINT;
  if (!endpoint) {
      console.error("Error: NEXT_PUBLIC_ENVIO_ENDPOINT environment variable is not set.");
      return null; // Or throw an error
  }

  const query = `
    query GetSwapDeltasForPools($poolIds: [String!]) {
      Swap(
        where: { pool: { _in: $poolIds } } 
        order_by: { timestamp: asc }
        limit: 2000 
      ) {
        timestamp
        amount0
        pool
      }
    }
  `;

  // Prepare headers
  const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
  };
  // Add Authorization header if API key is provided
  const apiKey = process.env.NEXT_PUBLIC_ENVIO_API_KEY;
  if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
  } else {
      console.warn("[fetchSwapDeltasForPools] API Key (NEXT_PUBLIC_ENVIO_API_KEY) not found. Sending request without Authorization.");
  }

  try { 
    // Use endpoint variable directly in fetch
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers, 
      body: JSON.stringify({
        query,
        variables: { poolIds: poolIdsToFetch },
        operationName: 'GetSwapDeltasForPools'
      }),
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const result: GraphQLResponse = await response.json();
    console.log("[fetchSwapDeltasForPools] Raw GraphQL response:", result);

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      throw new Error(`GraphQL Error: ${result.errors.map(e => e.message).join(', ')}`);
    }

    const swapEvents = result.data?.Swap ?? [];
    console.log("[fetchSwapDeltasForPools] Extracted swap events:", swapEvents);

    // Return correct structure even if no events found
    const deltasByPool: SwapDeltasByPoolResult = { yes: [], no: [] }; 
    if (swapEvents.length === 0) {
        console.warn("[fetchSwapDeltasForPools] No swap events found for provided pool IDs.");
    } else {
      swapEvents.forEach(event => {
        const deltaPoint: SwapDeltaDataPoint = {
          timestamp: (parseInt(event.timestamp, 10) || 0) * 1000,
          amount0Delta: parseFloat(event.amount0) || 0,
        };
        if (event.pool === yesPoolId) {
          deltasByPool.yes.push(deltaPoint);
        } else if (event.pool === noPoolId) {
          deltasByPool.no.push(deltaPoint);
        }
      });
    }

    console.log("[fetchSwapDeltasForPools] Transformed delta data by pool:", deltasByPool);
    return deltasByPool;

  } catch (error) {
      console.error("[fetchSwapDeltasForPools] Fetch or processing error:", error);
      // Re-throw or return null/error state depending on desired handling
      throw error; 
  }
}

// React Query hook for fetching swap deltas for both pools
// Hook name kept generic, consider renaming file later
export function usePoolSwapHistory(
    yesPoolId: string | undefined, 
    noPoolId: string | undefined
) {
  return useQuery<SwapDeltasByPoolResult | null, Error>({
    // Use spread for queryKey elements
    queryKey: ['poolSwapDeltasByPool', yesPoolId, noPoolId], 
    queryFn: () => fetchSwapDeltasForPools(yesPoolId, noPoolId),
    enabled: !!(yesPoolId || noPoolId), 
    staleTime: 1000 * 60 * 5, 
    refetchInterval: 1000 * 60 * 10, 
    // Add other standard react-query options if needed, e.g., retry: false
  });
} 