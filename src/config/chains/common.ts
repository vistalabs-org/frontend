// Common types shared across chain configs
export interface ChainConfig {
  chainId: number;
  name: string;
  PREDICTION_MARKET_HOOK_ADDRESS: string;
  STATE_VIEW_ADDRESS: string;
  POOL_MANAGER_ADDRESS: string;
  UNIVERSAL_ROUTER_ADDRESS: string;
  POSITION_MANAGER_ADDRESS: string;
  COLLATERAL_TOKEN: string;
  ORACLE_SERVICE_MANAGER_ADDRESS: string;
  AGENT_REGISTRY_ADDRESS: string;
  // Add any other chain-specific constants here
} 