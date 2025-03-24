import { defineChain } from 'viem';
import { http, createConfig } from 'wagmi'
//import { unichainSepolia } from 'wagmi/chains';

// Define unichainSepolia chain
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

// Create your wagmi config
export const wagmiConfig = createConfig({
    chains: [unichainSepolia],
    transports: {
        // Use http transport for each chain
        // [mainnet.id]: http(),
        [unichainSepolia.id]: http(),
    }
});