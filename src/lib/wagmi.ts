import { defineChain } from 'viem';

// Define Unichain Sepolia chain
export const unichainSepolia = defineChain({
    id: 1301,
    name: 'Unichain Sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Sepolia Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: ['https://sepolia.unichain.org'] },
    },
    blockExplorers: {
      default: { name: 'Explorer', url: 'https://explorer.unichain.world' },
    },
    testnet: true,
  })

// Define Unichain Mainnet
export const unichain = defineChain({
  id: 130,
  name: 'Unichain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://unichain-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.unichain.world' },
  },
  testnet: false,
});

// Define Arbitrum chain
export const arbitrum = defineChain({
  id: 42161,
  name: 'Arbitrum',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://arb1.arbitrum.io/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://arbiscan.io' },
  },
  testnet: false,
});