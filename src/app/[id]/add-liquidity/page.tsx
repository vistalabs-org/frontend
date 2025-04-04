"use client";

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useBalance, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useMarketWithPoolData } from '@/hooks/usePoolData';
import { formatUnits, parseUnits } from 'ethers';
import { PoolModifyLiquidityTest_abi } from '@/contracts/PoolModifyLiquidityTest_abi';
import { POOL_MODIFY_LIQUIDITY_ROUTER } from '@/app/constants';
import JSBI from 'jsbi';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';
import { getPublicClient } from '@wagmi/core';
import { wagmiConfig } from '@/lib/wagmi';

// Constants from Uniswap
const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
const MAX_UINT256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export default function AddLiquidityPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;
  const { address: userAddress } = useAccount();
  
  // Contract address for PoolModifyLiquidityTest
  const poolModifyLiquidityTestAddress = POOL_MODIFY_LIQUIDITY_ROUTER;
  
  // Set YES as default selected pool
  const [selectedPool, setSelectedPool] = useState<'YES' | 'NO'>('YES');
  const [amount0, setAmount0] = useState<string>('');
  const [amount1, setAmount1] = useState<string>('');
  const [liquidityAmount, setLiquidityAmount] = useState<string>('0');
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState<boolean>(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Fetch market data to get token addresses
  const { market: marketWithPools, yesPool, noPool } = useMarketWithPoolData(marketId);

  // Get token addresses
  const usdcAddress = marketWithPools?.collateralAddress as `0x${string}`;
  const outcomeTokenAddress = selectedPool === 'YES' 
    ? marketWithPools?.yesToken as `0x${string}`
    : marketWithPools?.noToken as `0x${string}`;

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: userAddress,
    token: usdcAddress,
  });

  // Get YES/NO token balance
  const { data: outcomeTokenBalance } = useBalance({
    address: userAddress,
    token: outcomeTokenAddress,
  });

  // Check USDC allowance
  const { data: usdcAllowance, refetch: refetchUsdcAllowance } = useReadContract({
    address: usdcAddress,
    abi: MockERC20Abi,
    functionName: 'allowance',
    args: [userAddress as `0x${string}`, poolModifyLiquidityTestAddress as `0x${string}`],
    query: {
      enabled: !!userAddress && !!usdcAddress && !!poolModifyLiquidityTestAddress,
    }
  });

  // Check outcome token allowance
  const { data: outcomeTokenAllowance, refetch: refetchOutcomeTokenAllowance } = useReadContract({
    address: outcomeTokenAddress,
    abi: MockERC20Abi,
    functionName: 'allowance',
    args: [userAddress as `0x${string}`, poolModifyLiquidityTestAddress as `0x${string}`],
    query: {
      enabled: !!userAddress && !!outcomeTokenAddress && !!poolModifyLiquidityTestAddress,
    }
  });

  // Write contract hooks
  const { writeContract, data: writeData, isPending: isWritePending, error: writeError } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isWaitingForTransaction, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  // Handle successful transaction
  useEffect(() => {
    if (isTransactionSuccess) {
      refetchUsdcAllowance();
      refetchOutcomeTokenAllowance();
      checkApprovalStatus();
      setIsApproving(false);
      setIsAddingLiquidity(false);
      
      // If this was a successful liquidity addition, redirect to the market page
      if (isAddingLiquidity) {
        router.push(`/${marketId}`);
      }
    }
  }, [isTransactionSuccess, isAddingLiquidity]);

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

  // Check approval status when inputs change
  useEffect(() => {
    checkApprovalStatus();
  }, [amount0, amount1, usdcAllowance, outcomeTokenAllowance, usdcAddress, outcomeTokenAddress]);

  // Update approval status when token addresses change
  useEffect(() => {
    refetchUsdcAllowance();
    refetchOutcomeTokenAllowance();
  }, [usdcAddress, outcomeTokenAddress, userAddress]);

  // Check if approvals are needed
  const checkApprovalStatus = () => {
    if (!amount0 || !amount1) {
      setNeedsApproval(false);
      return;
    }

    try {
      const amt0 = parseUnits(amount0, 6); // USDC has 6 decimals
      const amt1 = parseUnits(amount1, 18); // Outcome tokens have 18 decimals
      
      const needsUsdcApproval = !usdcAllowance || BigInt(usdcAllowance.toString()) < BigInt(amt0.toString());
      const needsOutcomeTokenApproval = !outcomeTokenAllowance || BigInt(outcomeTokenAllowance.toString()) < BigInt(amt1.toString());
      
      setNeedsApproval(needsUsdcApproval || needsOutcomeTokenApproval);
      console.log('Approval status:', { needsUsdcApproval, needsOutcomeTokenApproval, usdcAllowance, outcomeTokenAllowance });
    } catch (error) {
      console.error('Error checking approval status:', error);
      setNeedsApproval(true);
    }
  };

  // Handle token approval
  const handleApprove = async () => {
    setIsApproving(true);
    setTxError(null);
    
    try {
      // Check which tokens need approval
      const amt0 = parseUnits(amount0, 6); // USDC has 6 decimals
      const amt1 = parseUnits(amount1, 18); // Outcome tokens have 18 decimals
      
      const needsUsdcApproval = BigInt(usdcAllowance?.toString() || '0') < BigInt(amt0.toString());
      const needsOutcomeTokenApproval = BigInt(outcomeTokenAllowance?.toString() || '0') < BigInt(amt1.toString());
      
      // Approve USDC if needed
      if (needsUsdcApproval) {
        console.log('Approving USDC...');
        
        const { request } = await getPublicClient(wagmiConfig).simulateContract({
          account: userAddress,
          address: usdcAddress,
          abi: MockERC20Abi,
          functionName: 'approve',
          args: [poolModifyLiquidityTestAddress, MAX_UINT256]
        });
        
        writeContract(request);
      } 
      // Approve outcome token if needed
      else if (needsOutcomeTokenApproval) {
        console.log('Approving outcome token...');
        
        const { request } = await getPublicClient(wagmiConfig).simulateContract({
          account: userAddress,
          address: outcomeTokenAddress,
          abi: MockERC20Abi,
          functionName: 'approve',
          args: [poolModifyLiquidityTestAddress, MAX_UINT256]
        });
        
        writeContract(request);
      }
    } catch (error) {
      console.error('Error approving tokens:', error);
      setIsApproving(false);
      setTxError(`Failed to approve tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle adding liquidity
  const handleAddLiquidity = async () => {
    if (!marketWithPools) {
      setTxError('Market data not available');
      return;
    }
    
    setIsAddingLiquidity(true);
    setTxError(null);
    
    try {
      // Get the pool key directly from market data
      const poolKey = selectedPool === 'YES' 
        ? marketWithPools.yesPoolKey 
        : marketWithPools.noPoolKey;
      
      if (!poolKey) {
        setTxError(`${selectedPool} pool key not available`);
        setIsAddingLiquidity(false);
        return;
      }
      
      console.log("marketWithPools", marketWithPools)
      console.log("Using pool key:", poolKey);
      
      // Use the tick range from PredictionMarketHook
      // These ticks constrain the price between 0.01 and 0.99 USDC
      const tickLower = -9200; // Slightly above 0.01 USDC
      const tickUpper = -100;  // Slightly below 0.99 USDC
      
      // Get the modify liquidity params
      const saltBytes = new Uint8Array(32);
      crypto.getRandomValues(saltBytes);
      const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const modifyLiquidityParams = {
        tickLower: tickLower,
        tickUpper: tickUpper,
        liquidityDelta: BigInt(parseUnits(liquidityAmount, 18).toString()), // Convert to bigint
        salt: `0x${saltHex}` as `0x${string}` // Use Web Crypto API for salt
      };
      
      console.log('Adding liquidity with params:', {
        poolKey,
        modifyLiquidityParams,
        liquidityAmount
      });
      
      // Ensure poolKey structure matches ABI
      const abiCompatiblePoolKey = {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks
      };

      // Simulate transaction
      const { request } = await getPublicClient(wagmiConfig).simulateContract({
        account: userAddress,
        address: poolModifyLiquidityTestAddress,
        abi: PoolModifyLiquidityTest_abi,
        functionName: 'modifyLiquidity',
        args: [
          abiCompatiblePoolKey, // Pass the structured poolKey
          modifyLiquidityParams,
          '0x', // No hook data
          false, // Don't settle using burn
          false  // Don't take claims
        ],
      });
      
      console.log('Simulation successful, sending transaction');
      
      // Call modifyLiquidity
      writeContract(request);
    } catch (error) {
      console.error('Error adding liquidity:', error);
      setIsAddingLiquidity(false);
      setTxError(`Failed to add liquidity: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Get button state
  const getButtonState = () => {
    // Check if inputs are valid
    const isInputValid = amount0 && amount1 && parseFloat(amount0) > 0 && parseFloat(amount1) > 0;
    
    // If waiting for transaction
    if (isWaitingForTransaction) {
      return {
        text: isApproving ? 'Approving...' : 'Adding Liquidity...',
        disabled: true,
        onClick: () => {}
      };
    }
    
    // If approving
    if (isWritePending) {
      return {
        text: 'Confirming...',
        disabled: true,
        onClick: () => {}
      };
    }
    
    // If needs approval
    if (needsApproval) {
      return {
        text: 'Approve Tokens',
        disabled: !isInputValid,
        onClick: handleApprove
      };
    }
    
    // Default state - ready to add liquidity
    return {
      text: 'Add Liquidity',
      disabled: !isInputValid,
      onClick: handleAddLiquidity
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="max-w-screen-xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link 
          href={`/${marketId}`}
          className="text-blue-600 hover:text-blue-700 hover:underline flex items-center"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Market
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Liquidity</h1>
      
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <p className="text-gray-600 mb-4">
          Add liquidity to this prediction market to earn fees from trades.
        </p>
        
        {txError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-400 rounded-md text-red-700">
            <p className="font-medium">Transaction Error</p>
            <p className="text-sm">{txError}</p>
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Pool Selection
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div 
              className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${
                selectedPool === 'YES' ? 'bg-gray-50 border-blue-500' : 'border-gray-300'
              }`}
              onClick={() => setSelectedPool('YES')}
            >
              <div className="font-medium text-gray-900">Yes Pool</div>
              <div className="text-sm text-gray-600">Add liquidity to the Yes outcome</div>
            </div>
            <div 
              className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${
                selectedPool === 'NO' ? 'bg-gray-50 border-blue-500' : 'border-gray-300'
              }`}
              onClick={() => setSelectedPool('NO')}
            >
              <div className="font-medium text-gray-900">No Pool</div>
              <div className="text-sm text-gray-600">Add liquidity to the No outcome</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-700 font-medium">
                USDC Amount to Add
              </label>
              <div className="text-sm text-gray-600">
                Balance: {formatBalance(usdcBalance)} USDC
              </div>
            </div>
            <div className="flex">
              <input 
                type="number" 
                className="flex-grow p-2 bg-white border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.0"
                value={amount0}
                onChange={handleAmount0Change}
              />
              <div className="bg-gray-50 border border-l-0 border-gray-300 rounded-r-md p-2 flex items-center text-gray-700">
                USDC
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-700 font-medium">
                {selectedPool} Token Amount to Add
              </label>
              <div className="text-sm text-gray-600">
                Balance: {formatBalance(outcomeTokenBalance)} {selectedPool}
              </div>
            </div>
            <div className="flex">
              <input 
                type="number" 
                className="flex-grow p-2 bg-white border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.0"
                value={amount1}
                onChange={handleAmount1Change}
              />
              <div className="bg-gray-50 border border-l-0 border-gray-300 rounded-r-md p-2 flex items-center text-gray-700">
                {selectedPool}
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Current Price:</span>
              <span className="font-medium text-gray-900">{getCurrentPrice()}%</span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {selectedPool === 'YES' 
                ? `1 USDC = ${getCurrentPrice()} YES tokens` 
                : `1 USDC = ${getCurrentPrice()} NO tokens`}
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Liquidity Amount:</span>
              <span className="font-medium text-gray-900">{liquidityAmount}</span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Estimated liquidity based on your input amounts and current price
            </div>
          </div>
        </div>
        
        <button 
          className={`w-full px-6 py-4 font-semibold rounded-lg transition-colors ${
            buttonState.disabled
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={buttonState.disabled}
          onClick={buttonState.onClick}
        >
          {buttonState.text}
        </button>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Note: Adding liquidity will require approving USDC and outcome tokens.</p>
          <p>You will receive LP tokens representing your position in the pool.</p>
        </div>
      </div>
    </div>
  );
}