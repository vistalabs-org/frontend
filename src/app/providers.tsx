'use client';

import { config, queryClient } from "@root/config";
import { AlchemyClientState } from "@account-kit/core";
import { AlchemyAccountProvider } from "@account-kit/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi';

export const Providers = (
  props: PropsWithChildren<{ initialState?: AlchemyClientState }>
) => {
  return (
    // First wrap with React Query provider as both Wagmi and Alchemy need it
    <QueryClientProvider client={queryClient}>
      {/* Then add WagmiProvider */}
      <WagmiProvider config={wagmiConfig}>
        {/* Keep your existing Alchemy provider */}
        <AlchemyAccountProvider
          config={config}
          queryClient={queryClient}
          initialState={props.initialState}
        >
          {props.children}
        </AlchemyAccountProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};