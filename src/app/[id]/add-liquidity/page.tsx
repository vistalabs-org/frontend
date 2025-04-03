"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useBalance } from 'wagmi';
import { useMarketWithPoolData } from '@/hooks/usePoolData';
import { formatUnits, parseUnits } from 'ethers';
import { PoolModifyLiquidityTest_abi } from '@/contracts/PoolModifyLiquidityTest_abi';
import { POOL_MODIFY_LIQUIDITY_ROUTER } from '@/app/constants';
import JSBI from 'jsbi';

// Constants from Uniswap
const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));

export default function AddLiquidityPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;
  const { address: userAddress } = useAccount();
  

  
  // Set YES as default selected pool
  const [selectedPool, setSelectedPool] = useState<'YES' | 'NO'>('YES');
  const [amount0, setAmount0] = useState<string>('');
  const [amount1, setAmount1] = useState<string>('');
  const [liquidityAmount, setLiquidityAmount] = useState<string>('0');
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState<boolean>(false);

  // Fetch market data to get token addresses
  const { market: marketWithPools, yesPool, noPool } = useMarketWithPoolData(marketId);

  // Get token addresses
  const usdcAddress = marketWithPools?.collateralAddress as `0x${string}`;
  const outcomeTokenAddress = selectedPool === 'YES' 
    ? marketWithPools?.yesTokenAddress as `0x${string}`
    : marketWithPools?.noTokenAddress as `0x${string}`;

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

  // Get current price as a number
  const getCurrentPriceAsNumber = (): number => {
    const pool = selectedPool === 'YES' ? yesPool : noPool;
    if (!pool?.price) return 0;
    try {
      const priceAsNumber = Number(pool.price);
      const token0Price = 1 / priceAsNumber;
      return token0Price;
    } catch (error) {
      console.error('Error getting price as number:', error);
      return 0;
    }
  };

  // Uniswap V3 liquidity calculation functions
  // Based on https://github.com/Uniswap/sdks/blob/main/sdks/v3-sdk/src/utils/maxLiquidityForAmounts.ts
  
  function maxLiquidityForAmount0Precise(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, amount0: string): JSBI {
    if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    }
    
    const numerator = JSBI.multiply(
      JSBI.multiply(JSBI.BigInt(amount0), sqrtRatioAX96), 
      sqrtRatioBX96
    );
    const denominator = JSBI.multiply(Q96, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96));
    
    return JSBI.divide(numerator, denominator);
  }
  
  function maxLiquidityForAmount1(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, amount1: string): JSBI {
    if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    }
    
    return JSBI.divide(
      JSBI.multiply(JSBI.BigInt(amount1), Q96), 
      JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)
    );
  }
  
  function maxLiquidityForAmounts(
    sqrtRatioCurrentX96: JSBI,
    sqrtRatioAX96: JSBI,
    sqrtRatioBX96: JSBI,
    amount0: string,
    amount1: string
  ): JSBI {
    if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    }
    
    if (JSBI.lessThanOrEqual(sqrtRatioCurrentX96, sqrtRatioAX96)) {
      return maxLiquidityForAmount0Precise(sqrtRatioAX96, sqrtRatioBX96, amount0);
    } else if (JSBI.lessThan(sqrtRatioCurrentX96, sqrtRatioBX96)) {
      const liquidity0 = maxLiquidityForAmount0Precise(sqrtRatioCurrentX96, sqrtRatioBX96, amount0);
      const liquidity1 = maxLiquidityForAmount1(sqrtRatioAX96, sqrtRatioCurrentX96, amount1);
      return JSBI.lessThan(liquidity0, liquidity1) ? liquidity0 : liquidity1;
    } else {
      return maxLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1);
    }
  }

  // Calculate liquidity using Uniswap V3 algorithm
  const calculateLiquidity = (amount0: string, amount1: string): string => {
    if (!amount0 || !amount1) return '0';
    
    try {
      // For full range (min to max ticks), we use the minimum and maximum sqrt prices
      // Min tick corresponds to price of 0, max tick to price of infinity
      // In practice, we use very small and very large numbers
      const minSqrtPrice = JSBI.BigInt(1); // Close to 0
      const maxSqrtPrice = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)); // Very large
      
      // Current price in sqrt Q96 format
      const price = getCurrentPriceAsNumber();
      if (price <= 0) return '0';
      
      // Convert price to sqrt price in Q96 format
      const sqrtPrice = JSBI.BigInt(Math.floor(Math.sqrt(price) * 2**96));
      
      // Convert amounts to BigInt (assuming 18 decimals for simplicity)
      // In a real implementation, you'd use the actual token decimals
      const amt0 = parseFloat(amount0) * 10**18;
      const amt1 = parseFloat(amount1) * 10**18;
      
      // Calculate liquidity
      const liquidity = maxLiquidityForAmounts(
        sqrtPrice,
        minSqrtPrice,
        maxSqrtPrice,
        amt0.toString(),
        amt1.toString()
      );
      
      // Convert back to a readable format
      return (Number(liquidity.toString()) / 10**18).toFixed(6);
    } catch (error) {
      console.error('Error calculating liquidity:', error);
      return '0';
    }
  };

  // Update liquidity amount when inputs change
  useEffect(() => {
    if (amount0 && amount1) {
      const liquidity = calculateLiquidity(amount0, amount1);
      setLiquidityAmount(liquidity);
    }
  }, [amount0, amount1, selectedPool]);

  // Handle input changes
  const handleAmount0Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount0(e.target.value);
    // Optionally calculate amount1 based on price
    if (e.target.value) {
      const price = getCurrentPriceAsNumber();
      const calculatedAmount1 = (parseFloat(e.target.value) * price).toString();
      setAmount1(calculatedAmount1);
    }
  };

  const handleAmount1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount1(e.target.value);
    // Optionally calculate amount0 based on price
    if (e.target.value) {
      const price = getCurrentPriceAsNumber();
      const calculatedAmount0 = (parseFloat(e.target.value) / price).toString();
      setAmount0(calculatedAmount0);
    }
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
                value={amount0}
                onChange={handleAmount0Change}
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
                value={amount1}
                onChange={handleAmount1Change}
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