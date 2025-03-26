import { ethers } from 'ethers';

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
 * @returns The pool ID as a hex string
 */
export function poolKeyToId(poolKey: PoolKey): string {
  // Encode the poolKey struct according to Solidity's abi.encode
  // The order and types must match the PoolKey struct in the contract
  const encodedPoolKey = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      'tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks)'
    ],
    [{
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: poolKey.fee,
      tickSpacing: poolKey.tickSpacing,
      hooks: poolKey.hooks
    }]
  );
  
  // Compute keccak256 hash of the encoded data
  const poolId = ethers.keccak256(encodedPoolKey);
  
  return poolId;
}

/**
 * Utility function to get pool IDs from market data
 * @param market The market data
 * @returns An object with yesPoolId and noPoolId
 */
export function getPoolIdsFromMarket(market: any): { yesPoolId: string, noPoolId: string } {
  // If the market already has poolIds, use them
  if (market.yesPoolKey?.poolId && market.noPoolKey?.poolId) {
    return {
      yesPoolId: market.yesPoolKey.poolId,
      noPoolId: market.noPoolKey.poolId
    };
  }
  
  // Otherwise, compute them from the pool keys
  const yesPoolKey = {
    currency0: market.yesPoolKey?.currency0,
    currency1: market.yesPoolKey?.currency1,
    fee: market.yesPoolKey?.fee || 500,
    tickSpacing: market.yesPoolKey?.tickSpacing || 10,
    hooks: market.yesPoolKey?.hooks || '0x0000000000000000000000000000000000000000'
  };
  
  const noPoolKey = {
    currency0: market.noPoolKey?.currency0,
    currency1: market.noPoolKey?.currency1,
    fee: market.noPoolKey?.fee || 500,
    tickSpacing: market.noPoolKey?.tickSpacing || 10,
    hooks: market.noPoolKey?.hooks || '0x0000000000000000000000000000000000000000'
  };
  
  return {
    yesPoolId: poolKeyToId(yesPoolKey),
    noPoolId: poolKeyToId(noPoolKey)
  };
} 