'use client';

import { useChainId, useSwitchChain } from 'wagmi';
import { arbitrum } from '@/lib/wagmi';

export function ChainSelector() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const supportedChains = [arbitrum];
  
  return (
    <div className="flex items-center">
      <select 
        value={chainId} 
        onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
        className="bg-gray-100 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {supportedChains.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
} 