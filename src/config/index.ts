'use client';

import { useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { ChainConfig } from './chains/common';

// Import all chain configurations
import { unichainConfig } from './chains/130';
import { unichainSepoliaConfig } from './chains/1301';

// Map of chainId to config
const chainConfigs: Record<number, ChainConfig> = {
  130: unichainConfig,
  1301: unichainSepoliaConfig,
};

// Default to Unichain if not connected or on an unsupported chain
const DEFAULT_CHAIN_ID = 130;

export function useChainConfig(): ChainConfig {
  const chainId = useChainId();
  const [config, setConfig] = useState<ChainConfig>(chainConfigs[DEFAULT_CHAIN_ID]);
  
  useEffect(() => {
    if (chainId) {
      // Get config for current chain, fall back to default if not found
      const chainConfig = chainConfigs[chainId] || chainConfigs[DEFAULT_CHAIN_ID];
      setConfig(chainConfig);
    }
  }, [chainId]);
  
  return config;
}

// Export specific constants getters for convenience
export function usePredictionMarketHookAddress(): string {
  const config = useChainConfig();
  return config.PREDICTION_MARKET_HOOK_ADDRESS;
}

export function useStateViewAddress(): string {
  const config = useChainConfig();
  return config.STATE_VIEW_ADDRESS;
}

// Export other getters as needed... 