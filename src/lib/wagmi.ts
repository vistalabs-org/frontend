import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

// Create your wagmi config
export const wagmiConfig = createConfig({
    chains: [sepolia],
    transports: {
        // Use http transport for each chain
        // [mainnet.id]: http(),
        [sepolia.id]: http(),
    }
});