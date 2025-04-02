"use client";

import { useCallback, useState } from 'react';
import { useAccount, useWriteContract, useBalance } from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';
import { PredictionMarketHook_abi } from '@/contracts/PredictionMarketHook_abi';
import { PREDICTION_MARKET_HOOK_ADDRESS } from '@/app/constants';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';
import { simulateContract } from '@wagmi/core';
import { wagmiConfig } from '@/lib/wagmi';

interface CreateMarketParams {
  title: string;
  description: string;
  duration: number; // in days
  collateralAmount: string;
  collateralAddress: string;
  curveId: number;
}

export function useCreateMarket() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [isApproving, setIsApproving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Add this function to get token decimals
  const getTokenDecimals = useCallback(async (
    tokenAddress: string
  ): Promise<number> => {
    try {
      const result = await simulateContract(wagmiConfig, {
        address: tokenAddress as `0x${string}`,
        abi: MockERC20Abi,
        functionName: 'decimals',
        account: address,
      });
      
      return Number(result.result);
    } catch (error) {
      console.error('Error getting token decimals:', error);
      return 18; // Default to 18 decimals as fallback
    }
  }, [address]);

  // Function to parse amount with correct decimals
  const parseAmount = useCallback(async (
    amount: string,
    tokenAddress: string
  ): Promise<bigint> => {
    const decimals = await getTokenDecimals(tokenAddress);
    console.log(`Token has ${decimals} decimals`);
    
    // Parse the amount with the correct number of decimals
    return parseUnits(amount, decimals);
  }, [getTokenDecimals]);

  // Update checkBalance to use correct decimals
  const checkBalance = useCallback(async (
    collateralAddress: string,
    amount: string
  ): Promise<boolean> => {
    if (!isConnected || !address) return false;
    
    try {
      // Get token balance
      const balance = await simulateContract(wagmiConfig, {
        address: collateralAddress as `0x${string}`,
        abi: MockERC20Abi,
        functionName: 'balanceOf',
        args: [address],
        account: address,
      });
      
      // Get token decimals and parse amount
      const balanceValue = balance.result as unknown as bigint;
      const requiredAmount = await parseAmount(amount, collateralAddress);
      const hasEnoughBalance = balanceValue >= requiredAmount;
      
      // Get decimals for logging
      const decimals = await getTokenDecimals(collateralAddress);
      
      console.log('Balance check:', {
        balance: formatUnits(balanceValue, decimals),
        required: amount,
        hasEnough: hasEnoughBalance,
        decimals
      });
      
      return hasEnoughBalance;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }, [address, isConnected, parseAmount, getTokenDecimals]);
  
  // Step 1: Approve tokens
  const approveTokens = useCallback(async (
    collateralAddress: string,
    amount: string
  ) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    // Check balance first
    const hasEnoughBalance = await checkBalance(collateralAddress, amount);
    if (!hasEnoughBalance) {
      throw new Error('Insufficient token balance. Please mint more tokens first.');
    }
    
    setIsApproving(true);
    try {
      // Parse the amount with the correct number of decimals
      const parsedAmount = await parseAmount(amount, collateralAddress);
      
      // Simulate approval first
      setIsSimulating(true);
      await simulateContract(wagmiConfig, {
        address: collateralAddress as `0x${string}`,
        abi: MockERC20Abi,
        functionName: 'approve',
        args: [PREDICTION_MARKET_HOOK_ADDRESS, parsedAmount],
        account: address,
      });
      setIsSimulating(false);
      
      // If simulation succeeds, proceed with actual approval
      const hash = await writeContract({
        address: collateralAddress as `0x${string}`,
        abi: MockERC20Abi,
        functionName: 'approve',
        args: [PREDICTION_MARKET_HOOK_ADDRESS, parsedAmount],
      });
      
      return hash;
    } catch (error) {
      console.error('Error approving tokens:', error);
      throw error;
    } finally {
      setIsApproving(false);
      setIsSimulating(false);
    }
  }, [address, isConnected, writeContract, checkBalance, parseAmount]);
  
  // Step 2: Create market
  const createMarket = useCallback(async (params: CreateMarketParams) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    // Check balance first
    const hasEnoughBalance = await checkBalance(params.collateralAddress, params.collateralAmount);
    if (!hasEnoughBalance) {
      throw new Error('Insufficient token balance. Please mint more tokens first.');
    }
    
    try {
      // Convert duration from days to seconds
      const durationInSeconds = params.duration * 24 * 60 * 60;
      
      // Parse the collateral amount with the correct number of decimals
      const parsedCollateralAmount = await parseAmount(params.collateralAmount, params.collateralAddress);
      
      // Prepare contract parameters
      const contractParams = {
        oracle: address as `0x${string}`,
        creator: address as `0x${string}`,
        collateralAddress: params.collateralAddress as `0x${string}`,
        collateralAmount: parsedCollateralAmount,
        title: params.title,
        description: params.description,
        duration: BigInt(durationInSeconds),
        curveId: BigInt(params.curveId)
      };
      
      // Simulate the transaction first
      setIsSimulating(true);
      console.log('Simulating market creation with params:', {
        ...contractParams,
        collateralAmount: contractParams.collateralAmount.toString(),
        duration: contractParams.duration.toString(),
        curveId: contractParams.curveId.toString()
      });
      
      try {
        const simulation = await simulateContract(wagmiConfig, {
          address: PREDICTION_MARKET_HOOK_ADDRESS,
          abi: PredictionMarketHook_abi,
          functionName: 'createMarketAndDepositCollateral',
          args: [contractParams],
          account: address,
        });
        
        console.log('Simulation successful:', {
          result: simulation.result,
          request: simulation.request,
        });
      } catch (simError) {
        console.error('Simulation failed with error:', simError);
        
        // Try to extract more detailed error information
        if (simError instanceof Error) {
          // Log the full error object
          console.error('Full error object:', JSON.stringify(simError, Object.getOwnPropertyNames(simError)));
          
          // Check if there's a data property that might contain revert reason
          const anyError = simError as any;
          if (anyError.data) {
            console.error('Error data:', anyError.data);
          }
          
          // Check for inner error
          if (anyError.cause || anyError.error || anyError.innerError) {
            console.error('Inner error:', anyError.cause || anyError.error || anyError.innerError);
          }
        }
        
        throw simError;
      } finally {
        setIsSimulating(false);
      }
      
      // If simulation succeeds, proceed with actual transaction
      const hash = await writeContract({
        address: PREDICTION_MARKET_HOOK_ADDRESS,
        abi: PredictionMarketHook_abi,
        functionName: 'createMarketAndDepositCollateral',
        args: [contractParams],
      });
      
      return hash;
    } catch (error) {
      console.error('Error creating market:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient allowance')) {
          throw new Error('Insufficient token allowance. Please approve more tokens.');
        } else if (error.message.includes('insufficient balance')) {
          throw new Error('Insufficient token balance. Please mint more tokens first.');
        }
      }
      throw error;
    } finally {
      setIsSimulating(false);
    }
  }, [address, isConnected, writeContract, checkBalance, parseAmount]);
  
  return {
    approveTokens,
    createMarket,
    checkBalance,
    isPending,
    isApproving,
    isSimulating,
    isReady: isConnected && !!address
  };
} 