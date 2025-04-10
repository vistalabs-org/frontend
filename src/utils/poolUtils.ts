import { encodeAbiParameters, parseAbiParameters, keccak256 } from 'viem';

// Interface matching the PoolKey struct from the Solidity contract
export interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

/**
 * Converts a PoolKey to a PoolId by computing keccak256(abi.encode(poolKey))
 * This replicates the Solidity function:
 * 
 * function toId(PoolKey memory poolKey) internal pure returns (PoolId poolId) {
 *     assembly ("memory-safe") {
 *         poolId := keccak256(poolKey, 0xa0)
 *     }
 * }
 * 
 * @param poolKey The pool key object
 * @returns The pool ID as a hex string or undefined if an error occurs
 */
export function poolKeyToId(poolKey: PoolKey): string | undefined {
  console.log("[poolKeyToId] Input poolKey:", poolKey);
  
  let encodedPoolKey: `0x${string}` | undefined;
  try {
    const paramsToEncode = [
      {
        currency0: poolKey.currency0 as `0x${string}`,
        currency1: poolKey.currency1 as `0x${string}`,
        fee: poolKey.fee, // Keep as number
        tickSpacing: poolKey.tickSpacing, // Keep as number
        hooks: poolKey.hooks as `0x${string}`
      }
    ];
    console.log("[poolKeyToId] Params being passed to encodeAbiParameters:", paramsToEncode);

    // Encode the poolKey struct according to Solidity's abi.encode
    encodedPoolKey = encodeAbiParameters(
      // Define ABI structure directly instead of parsing string
      [
        {
          name: 'poolKey',
          type: 'tuple',
          components: [
            { name: 'currency0', type: 'address' },
            { name: 'currency1', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'tickSpacing', type: 'int24' },
            { name: 'hooks', type: 'address' },
          ],
        },
      ] as const,
      [paramsToEncode[0]] // Wrap the value object in an array
    );
    console.log("[poolKeyToId] Encoded poolKey:", encodedPoolKey);
  } catch (error) {
    console.error("[poolKeyToId] Error during encodeAbiParameters:", error);
    // Return undefined on encoding failure
    return undefined; 
  }
  
  // Compute keccak256 hash of the encoded data using viem
  try {
    // Ensure encodedPoolKey is defined before hashing
    if (!encodedPoolKey) {
        console.error("[poolKeyToId] Cannot hash undefined encodedPoolKey");
        return undefined;
    }
    const poolId = keccak256(encodedPoolKey);
    console.log("[poolKeyToId] Generated poolId:", poolId);
    return poolId;
  } catch (error) {
    console.error("[poolKeyToId] Error during keccak256:", error);
    // Return undefined on hashing failure
    return undefined;
  }
}

/**
 * Utility function to get pool IDs from market data
 * @param market The market data
 * @returns An object with yesPoolId and noPoolId (or undefined if calculation fails)
 */
export function getPoolIdsFromMarket(market: any): { yesPoolId: string | undefined, noPoolId: string | undefined } {
  // If the market already has poolIds, use them
  if (market.yesPoolKey?.poolId && market.noPoolKey?.poolId) {
    return {
      yesPoolId: market.yesPoolKey.poolId,
      noPoolId: market.noPoolKey.poolId
    };
  }
  
  // Otherwise, compute them from the pool keys
  const yesPoolKey = {
    currency0: market.yesPoolKey?.currency0 || '0x0000000000000000000000000000000000000000',
    currency1: market.yesPoolKey?.currency1 || '0x0000000000000000000000000000000000000000',
    fee: market.yesPoolKey?.fee || 500,
    tickSpacing: market.yesPoolKey?.tickSpacing || 10,
    hooks: market.yesPoolKey?.hooks || '0x0000000000000000000000000000000000000000'
  };
  
  const noPoolKey = {
    currency0: market.noPoolKey?.currency0 || '0x0000000000000000000000000000000000000000',
    currency1: market.noPoolKey?.currency1 || '0x0000000000000000000000000000000000000000',
    fee: market.noPoolKey?.fee || 500,
    tickSpacing: market.noPoolKey?.tickSpacing || 10,
    hooks: market.noPoolKey?.hooks || '0x0000000000000000000000000000000000000000'
  };
  
  // Call poolKeyToId and handle potential undefined return
  return {
    yesPoolId: poolKeyToId(yesPoolKey),
    noPoolId: poolKeyToId(noPoolKey)
  };
}