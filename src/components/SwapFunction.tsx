"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance, useWriteContract, useContractRead, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { PREDICTION_MARKET_HOOK_ADDRESS, ROUTER } from '@/app/constants';
import { PoolSwapTestAbi } from '@/contracts/PoolSwapTest_abi';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';
import { simulateContract } from '@wagmi/core';
import { wagmiConfig } from '@/lib/wagmi';

type SwapFunctionProps = {
  marketId: string;
  yesPool: any;
  noPool: any;
  market: any;
  selectedAction: 'Buy' | 'Sell';
  selectedOption: 'Yes' | 'No';
  amount: string;
  setAmount: (amount: string) => void;
};

export default function SwapFunction({ 
  marketId, 
  yesPool, 
  noPool, 
  market,
  selectedAction,
  selectedOption,
  amount,
  setAmount
}: SwapFunctionProps) {
  const { address, isConnected } = useAccount();
  const [expectedOutput, setExpectedOutput] = useState<string>('0');
  const [isSwapping, setIsSwapping] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  
  // Get collateral token balance
  const { data: collateralBalance } = useBalance({
    address,
    token: market?.collateralAddress as `0x${string}`
  });
  
  // Get YES token balance
  const { data: yesTokenBalance } = useBalance({
    address,
    token: market?.yesToken as `0x${string}`
  });
  
  // Get NO token balance
  const { data: noTokenBalance } = useBalance({
    address,
    token: market?.noToken as `0x${string}`
  });
  
  // Approve collateral token
  const { writeContract: approveCollateral, isPending: isApproving } = useWriteContract();
  
  // Approve outcome token (for selling)
  const { writeContract: approveOutcomeToken, isPending: isApprovingOutcome } = useWriteContract();
  
  // Swap via router
  const { writeContract: executeSwap, isPending: isExecutingSwap } = useWriteContract();
  
  // Update the allowance hooks and type handling
  const { data: collateralAllowance } = useReadContract({
    address: market?.collateralAddress,
    abi: MockERC20Abi,
    functionName: 'allowance',
    args: [address || '0x0', ROUTER],
  });

  const { data: outcomeTokenAllowance } = useReadContract({
    address: selectedOption === 'Yes' ? market?.yesToken : market?.noToken,
    abi: MockERC20Abi,
    functionName: 'allowance',
    args: [address || '0x0', ROUTER],
  });

  // Add this immediately at the start of the component
  console.log('SwapFunction INITIAL RENDER with props:', { 
    marketId, selectedAction, selectedOption, amount 
  });

  // Simplified approval check
  const needsApproval = useMemo(() => {
    if (!amount || !isConnected || parseFloat(amount) <= 0) return false;
    
    try {
      // For Buy actions, check collateral allowance
      if (selectedAction === 'Buy') {
        if (!collateralAllowance) return true;
        return BigInt(collateralAllowance.toString()) < parseUnits(amount, 6);
      } 
      // For Sell actions, check outcome token allowance
      else {
        if (!outcomeTokenAllowance) return true;
        return BigInt(outcomeTokenAllowance.toString()) < parseUnits(amount, 18);
      }
    } catch (error) {
      console.error('Error checking allowance:', error);
      return false;
    }
  }, [amount, selectedAction, collateralAllowance, outcomeTokenAllowance, isConnected]);
  
  // Reset approval success when changing tokens or actions
  useEffect(() => {
    if (!amount || !isConnected || parseFloat(amount) <= 0) {
      setApprovalSuccess(false);
      return;
    }

    // Set initial approval success based on existing allowance
    try {
      if (selectedAction === 'Buy' && collateralAllowance) {
        const hasEnoughAllowance = BigInt(collateralAllowance.toString()) >= parseUnits(amount, 6);
        console.log('Setting initial approval success:', hasEnoughAllowance);
        setApprovalSuccess(hasEnoughAllowance);
      } else if (selectedAction === 'Sell' && outcomeTokenAllowance) {
        const hasEnoughAllowance = BigInt(outcomeTokenAllowance.toString()) >= parseUnits(amount, 18);
        console.log('Setting initial approval success:', hasEnoughAllowance);
        setApprovalSuccess(hasEnoughAllowance);
      }
    } catch (error) {
      console.error('Error checking initial approval:', error);
    }
  }, [amount, selectedAction, collateralAllowance, outcomeTokenAllowance, isConnected]);
  
  // Calculate expected output based on input amount and current price
  useEffect(() => {
    if (!amount || amount === '0' || !yesPool?.price || !noPool?.price) {
      setExpectedOutput('0');
      return;
    }
    
    const inputAmount = parseFloat(amount);
    const currentPrice = selectedOption === 'Yes' ? yesPool.price : noPool.price;
    
    if (selectedAction === 'Buy') {
      // When buying outcome tokens: amount of collateral / price = outcome tokens received
      const outputAmount = inputAmount / (currentPrice || 1);
      setExpectedOutput(outputAmount.toFixed(6));
    } else {
      // When selling outcome tokens: amount of outcome tokens * price = collateral received
      const outputAmount = inputAmount * (currentPrice || 0);
      setExpectedOutput(outputAmount.toFixed(6));
    }
  }, [amount, selectedAction, selectedOption, yesPool?.price, noPool?.price]);
  
  // Handle the swap
  const handleSwap = async () => {
    if (!amount || !market || !address || !isConnected) {
      alert('Please connect your wallet and enter an amount');
      return;
    }
    
    try {
      // Determine which pool to use
      const pool = selectedOption === 'Yes' ? yesPool : noPool;
      if (!pool) {
        alert('Pool data not available');
        return;
      }
      
      // Prepare the pool key
      const poolKey = {
        currency0: pool.currency0,
        currency1: pool.currency1,
        fee: pool.fee || 500,
        tickSpacing: pool.tickSpacing || 10,
        hooks: PREDICTION_MARKET_HOOK_ADDRESS
      };
      
      // Prepare swap parameters based on action
      const swapParams = selectedAction === 'Buy' 
        ? {
            zeroForOne: true,
            amountSpecified: parseUnits(amount, 6),
            sqrtPriceLimitX96: BigInt(0)
          }
        : {
            zeroForOne: false,
            amountSpecified: parseUnits(amount, 18),
            sqrtPriceLimitX96: BigInt(0)
          };

      const testSettings = {
        takeClaims: true,
        settleUsingBurn: false
      };

      // Simulate the swap first
      console.log('Simulating swap with params:', {
        poolKey,
        swapParams,
        testSettings
      });

      const simulation = await simulateContract(wagmiConfig, {
        address: ROUTER as `0x${string}`,
        abi: PoolSwapTestAbi,
        functionName: 'swap',
        args: [poolKey, swapParams, testSettings, '0x'],
        account: address,
      });

      console.log('Simulation result:', simulation);

      // If simulation succeeds, proceed with actual swap
      setIsSwapping(true);
      await executeSwap({
        address: ROUTER as `0x${string}`,
        abi: PoolSwapTestAbi,
        functionName: 'swap',
        args: [poolKey, swapParams, testSettings, '0x'],
      });

    } catch (error) {
      console.error('Swap error:', error);
      // Print detailed error information
      if (error instanceof Error) {
        alert(`Swap failed: ${error.message}`);
        console.error('Error details:', {
          message: error.message,
          error
        });
      } else {
        alert('Unknown error occurred during swap');
        console.error('Unknown error:', error);
      }
    } finally {
      setIsSwapping(false);
    }
  };
  
  // Get the appropriate token balance based on the selected token type
  const getSelectedTokenBalance = () => {
    if (selectedAction === 'Buy') {
      return collateralBalance 
        ? formatUnits(collateralBalance.value, collateralBalance.decimals) 
        : '0';
    } else {
      if (selectedOption === 'Yes') {
        return yesTokenBalance 
          ? formatUnits(yesTokenBalance.value, yesTokenBalance.decimals) 
          : '0';
      } else {
        return noTokenBalance 
          ? formatUnits(noTokenBalance.value, noTokenBalance.decimals) 
          : '0';
      }
    }
  };
  
  // Simplified approve function
  const handleApprove = async (params: any) => {
    try {
      await (selectedAction === 'Buy' ? approveCollateral : approveOutcomeToken)(params);
    } catch (error) {
      console.error('Error approving token:', error);
    }
  };

  // Add this debugging function
  useEffect(() => {
    if (amount && isConnected) {
      try {
        // Debug logs specifically for approval checks
        console.log('=== APPROVAL CHECK DEBUG ===');
        console.log('Action:', selectedAction);
        console.log('Option:', selectedOption);
        console.log('Amount:', amount);
        
        if (selectedAction === 'Buy') {
          console.log('Collateral Address:', market?.collateralAddress);
          console.log('Collateral Allowance:', collateralAllowance ? collateralAllowance.toString() : 'undefined');
          
          if (collateralAllowance) {
            const decimals = 6; // USDC has 6 decimals
            const amountBigInt = parseUnits(amount, decimals);
            console.log('Amount in BigInt:', amountBigInt.toString());
            console.log('Sufficient allowance?', BigInt(collateralAllowance.toString()) >= amountBigInt);
          }
        } else {
          console.log('Token Address:', selectedOption === 'Yes' ? market?.yesToken : market?.noToken);
          console.log('Token Allowance:', outcomeTokenAllowance ? outcomeTokenAllowance.toString() : 'undefined');
          
          if (outcomeTokenAllowance) {
            const decimals = 18; // Outcome tokens have 18 decimals
            const amountBigInt = parseUnits(amount, decimals);
            console.log('Amount in BigInt:', amountBigInt.toString());
            console.log('Sufficient allowance?', BigInt(outcomeTokenAllowance.toString()) >= amountBigInt);
          }
        }
        
        console.log('needsApproval:', needsApproval);
        console.log('approvalSuccess:', approvalSuccess);
        console.log('=== END DEBUG ===');
      } catch (error) {
        console.error('Error in debug logging:', error);
      }
    }
  }, [amount, selectedAction, selectedOption, collateralAllowance, outcomeTokenAllowance, needsApproval, approvalSuccess, isConnected, market]);

  // Derive approvalSuccess from needsApproval with explicit logging
  const isApproved = useMemo(() => {
    const success = !needsApproval;
    console.log('Calculating approval status:', {
      needsApproval,
      calculatedSuccess: success,
      collateralAllowance: collateralAllowance?.toString(),
      amount
    });
    return success;
  }, [needsApproval, collateralAllowance, amount]);

  // At the end of the component, right before the return:
  console.log('FINAL VALUES before return:', { 
    needsApproval, 
    isApproved,
    isConnected,
    collateralAllowance: collateralAllowance?.toString(), 
    outcomeTokenAllowance: outcomeTokenAllowance?.toString()
  });

  return {
    handleSwap,
    isSwapping: isSwapping || isExecutingSwap,
    expectedOutput,
    tokenBalance: getSelectedTokenBalance(),
    needsApproval,
    handleApprove,
    isApproving: isApproving || isApprovingOutcome,
    isApproved,
    // Add debug values 
    debug: {
      collateralAllowance: collateralAllowance?.toString(),
      outcomeTokenAllowance: outcomeTokenAllowance?.toString(),
      isConnected,
      isApproved
    }
  };
} 