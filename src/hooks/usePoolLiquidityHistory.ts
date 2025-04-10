import { useQuery } from '@tanstack/react-query';

// Structure for individual pool TVL data from GraphQL
interface PoolTvlData {
  id: string; // Include ID to map results back
  token0: string;
  token1: string;
  totalValueLockedToken0: string;
  totalValueLockedToken1: string;
}

// GraphQL response structure for multiple pools
interface GraphQLResponse {
  data?: {
    Pool?: PoolTvlData[];
  };
  errors?: { message: string }[];
}

// Structure for the processed TVL amounts for one pool
interface TvlAmounts {
  tvlToken0: number;
  tvlToken1: number;
  // token0Id: string; // Can be omitted if known contextually
  // token1Id: string;
}

// Define the structure the hook will return (organized by pool)
interface PoolsTvlAmountsResult {
  yes?: TvlAmounts;
  no?: TvlAmounts;
}

const ENVOI_ENDPOINT = 'https://indexer.dev.hyperindex.xyz/e835e1f/v1/graphql';

// Renamed function to fetch data for multiple pools
async function fetchPoolsTvlAmounts(
  yesPoolId: string | undefined,
  noPoolId: string | undefined
): Promise<PoolsTvlAmountsResult | null> {
  const poolIdsToFetch = [yesPoolId, noPoolId].filter(Boolean) as string[];
  if (poolIdsToFetch.length === 0) {
    console.log("[fetchPoolsTvlAmounts] No valid pool IDs provided.");
    return null;
  }
  console.log(`[fetchPoolsTvlAmounts] Fetching TVL amounts for pool IDs: ${poolIdsToFetch.join(', ')}`);

  // Query to fetch TVL amounts for multiple pools using _in filter
  const query = `
    query GetPoolsTvlAmounts($poolIds: [String!]) {
      Pool(where: { id: { _in: $poolIds } }) { # Use _in filter
        id # Fetch ID to map results
        token0
        token1
        totalValueLockedToken0
        totalValueLockedToken1
      }
    }
  `;

  const response = await fetch(ENVOI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { poolIds: poolIdsToFetch }, // Pass array of IDs
      operationName: 'GetPoolsTvlAmounts' // Changed operationName
    }),
  });

  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }

  const result: GraphQLResponse = await response.json();
  console.log("[fetchPoolsTvlAmounts] Raw GraphQL response:", result);

  if (result.errors) {
    console.error('GraphQL Errors:', result.errors);
    throw new Error(`GraphQL Error: ${result.errors.map(e => e.message).join(', ')}`);
  }

  // Extract and process pool data
  const poolDataArray = result.data?.Pool ?? [];
  console.log("[fetchPoolsTvlAmounts] Extracted pool data array:", poolDataArray);

  if (poolDataArray.length === 0) {
    console.warn("[fetchPoolsTvlAmounts] No pool data found for provided IDs.");
    return null;
  }

  // Organize the results by yes/no pool ID
  const transformedData: PoolsTvlAmountsResult = {};
  poolDataArray.forEach(poolData => {
    const amounts: TvlAmounts = {
        tvlToken0: parseFloat(poolData.totalValueLockedToken0) || 0,
        tvlToken1: parseFloat(poolData.totalValueLockedToken1) || 0,
    };
    if (poolData.id === yesPoolId) {
      transformedData.yes = amounts;
    } else if (poolData.id === noPoolId) {
      transformedData.no = amounts;
    }
  });

  console.log("[fetchPoolsTvlAmounts] Transformed TVL amounts by pool:", transformedData);
  return transformedData;
}

// Renamed React Query hook
// Returns structured TVL amounts for Yes and No pools
export function usePoolsTvlAmounts(
    yesPoolId: string | undefined,
    noPoolId: string | undefined
) {
  // Use a combined query key
  const queryKey = ['poolsTvlAmounts', yesPoolId, noPoolId];
  
  return useQuery<PoolsTvlAmountsResult | null, Error>({
    queryKey: queryKey,
    queryFn: () => fetchPoolsTvlAmounts(yesPoolId, noPoolId),
    // Enable only if at least one ID is present
    enabled: !!(yesPoolId || noPoolId),
    staleTime: 1000 * 60 * 1, 
    refetchInterval: 1000 * 60 * 5, 
  });
} 