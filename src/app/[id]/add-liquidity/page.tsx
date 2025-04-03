"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useBalance } from 'wagmi';
import { useMarketWithPoolData } from '@/hooks/usePoolData';
import { formatUnits } from 'ethers';

export default function AddLiquidityPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;
  const { address: userAddress } = useAccount();
  
  // Set YES as default selected pool
  const [selectedPool, setSelectedPool] = useState<'YES' | 'NO'>('YES');

  // Fetch market data to get token addresses
  const { market: marketWithPools, yesPool, noPool } = useMarketWithPoolData(marketId);

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: userAddress,
    token: marketWithPools?.collateralAddress as `0x${string}`,
    watch: true,
  });

  // Get YES/NO token balance
  const { data: outcomeTokenBalance } = useBalance({
    address: userAddress,
    token: selectedPool === 'YES' 
      ? marketWithPools?.yesTokenAddress as `0x${string}`
      : marketWithPools?.noTokenAddress as `0x${string}`,
    watch: true,
  });

  // Format balance for display
  const formatBalance = (balance: any) => {
    if (!balance) return '0';
    return parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(2);
  };

  // Format price for display
  const formatPrice = (pool: any) => {
    if (!pool?.price) return '0.00';
    try {
      // Convert the price to token0/token1 by taking reciprocal
      const priceAsNumber = Number(pool.price);
      const token0Price = 1 / priceAsNumber;
      return (token0Price * 100).toFixed(2);
    } catch (error) {
      console.error('Error formatting price:', error);
      return '0.00';
    }
  };

  // Get current price based on selected pool
  const getCurrentPrice = () => {
    const pool = selectedPool === 'YES' ? yesPool : noPool;
    return formatPrice(pool);
  };

  return (
    <div className="max-w-screen-xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link 
          href={`/${marketId}`}
          className="text-primary-color hover:underline flex items-center"
          style={{ color: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Market
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Add Liquidity</h1>
      
      <div className="bg-[#2D3745] rounded-lg p-6">
        <p className="text-secondary mb-4">
          Add liquidity to this prediction market to earn fees from trades.
        </p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Pool Selection
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div 
              className={`border border-border-color rounded-md p-3 cursor-pointer hover:bg-[#1E2530] ${
                selectedPool === 'YES' ? 'bg-[#1E2530] border-primary-color' : ''
              }`}
              onClick={() => setSelectedPool('YES')}
            >
              <div className="font-medium">Yes Pool</div>
              <div className="text-sm text-secondary">Add liquidity to the Yes outcome</div>
            </div>
            <div 
              className={`border border-border-color rounded-md p-3 cursor-pointer hover:bg-[#1E2530] ${
                selectedPool === 'NO' ? 'bg-[#1E2530] border-primary-color' : ''
              }`}
              onClick={() => setSelectedPool('NO')}
            >
              <div className="font-medium">No Pool</div>
              <div className="text-sm text-secondary">Add liquidity to the No outcome</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">
                USDC Amount to Add
              </label>
              <div className="text-sm text-secondary">
                Balance: {formatBalance(usdcBalance)} USDC
              </div>
            </div>
            <div className="flex">
              <input 
                type="number" 
                className="flex-grow p-2 bg-[#1E2530] border border-border-color rounded-l-md focus:outline-none"
                placeholder="0.0"
              />
              <div className="bg-[#1E2530] border border-l-0 border-border-color rounded-r-md p-2 flex items-center">
                USDC
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">
                {selectedPool} Token Amount to Add
              </label>
              <div className="text-sm text-secondary">
                Balance: {formatBalance(outcomeTokenBalance)} {selectedPool}
              </div>
            </div>
            <div className="flex">
              <input 
                type="number" 
                className="flex-grow p-2 bg-[#1E2530] border border-border-color rounded-l-md focus:outline-none"
                placeholder="0.0"
              />
              <div className="bg-[#1E2530] border border-l-0 border-border-color rounded-r-md p-2 flex items-center">
                {selectedPool}
              </div>
            </div>
          </div>
          
          {/* Price Range Field */}
          <div>
            <div className="mb-2">
              <label className="text-sm font-medium">
                Price Range
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-secondary mb-1">Low</label>
                <input 
                  type="number" 
                  className="p-2 bg-[#1E2530] border border-border-color rounded-md focus:outline-none"
                  value="0"
                  disabled
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-secondary mb-1">High</label>
                <input 
                  type="number" 
                  className="p-2 bg-[#1E2530] border border-border-color rounded-md focus:outline-none"
                  value="1"
                  disabled
                />
              </div>
            </div>
            <div className="mt-1 text-xs text-secondary">
              Full range (0 to 1) provides liquidity across all price points
            </div>
            
            {/* Current Price Information */}
            <div className="mt-3 p-3 bg-[#1E2530] rounded-md border border-border-color">
              <div className="flex justify-between items-center">
                <span className="text-sm">Current Price:</span>
                <span className="text-sm font-medium">{getCurrentPrice()}%</span>
              </div>
              <div className="mt-1 text-xs text-secondary">
                {selectedPool === 'YES' 
                  ? `1 USDC = ${getCurrentPrice()} YES tokens` 
                  : `1 USDC = ${getCurrentPrice()} NO tokens`}
              </div>
            </div>
          </div>
        </div>
        
        <button 
          className="banner-button w-full" 
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          Add Liquidity
        </button>
        
        <div className="mt-4 text-sm text-secondary">
          <p>Note: Adding liquidity will require approving USDC and outcome tokens.</p>
          <p>You will receive LP tokens representing your position in the pool.</p>
        </div>
      </div>
    </div>
  );
}