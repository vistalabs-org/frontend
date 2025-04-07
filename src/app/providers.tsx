'use client';

import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { 
  getDefaultConfig, 
  RainbowKitProvider,
  lightTheme
} from '@rainbow-me/rainbowkit';
import { unichain, unichainSepolia } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

// Import Account Kit config and provider
import { config } from "@root/config";
import { AlchemyAccountProvider } from "@account-kit/react";
import { cookieToInitialState } from "@account-kit/core";

// Create a client
const queryClient = new QueryClient();

// Configure wagmi with RainbowKit
const wagmiConfig = getDefaultConfig({
  appName: 'Vista Markets',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [unichain, unichainSepolia],
  ssr: true
});

// Define props including the cookie string
interface ProviderProps extends PropsWithChildren {
  cookie: string | undefined;
}

export const Providers = ({ children, cookie }: ProviderProps) => {
  // Calculate initial state inside the client component
  const initialState = cookieToInitialState(config, cookie);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#3b82f6', // blue-500
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system'
          })}
        >
          <AlchemyAccountProvider config={config} initialState={initialState} queryClient={queryClient}>
            {children}
          </AlchemyAccountProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};