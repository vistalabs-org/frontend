'use client';

import { SwapWidget } from '@uniswap/widgets'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import { useAccount, usePublicClient } from 'wagmi'
import { JsonRpcProvider } from '@ethersproject/providers'

// Default token list from Uniswap
const UNISWAP_TOKEN_LIST = 'https://gateway.ipfs.io/ipns/tokens.uniswap.org'

// Special address for native token
const NATIVE = 'NATIVE'

// Fallback RPC URL (you should replace this with your preferred fallback)
const FALLBACK_RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'

const UniswapSwapWidget = () => {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const provider = new JsonRpcProvider(
    publicClient?.transport?.url || FALLBACK_RPC_URL
  )

  return (
    <div className="w-full">
      <SwapWidget
        provider={provider}
        tokenList={UNISWAP_TOKEN_LIST}
        defaultInputTokenAddress={NATIVE}
        defaultInputAmount="1"
        width="100%"
        theme={{
          primary: '#3B82F6',
          secondary: '#6B7280',
          interactive: '#3B82F6',
          container: '#FFFFFF',
          module: '#F3F4F6',
          accent: '#3B82F6',
          outline: '#E5E7EB',
          dialog: '#FFFFFF',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      />
    </div>
  )
}

export default UniswapSwapWidget 