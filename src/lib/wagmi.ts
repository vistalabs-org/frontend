import { http, createConfig } from 'wagmi'
import { unichainSepolia } from 'wagmi/chains';

// Create your wagmi config
export const wagmiConfig = createConfig({
    chains: [unichainSepolia],
    transports: {
        // Use http transport for each chain
        // [mainnet.id]: http(),
        [unichainSepolia.id]: http(),
    }
});