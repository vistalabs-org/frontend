"use client";

import { useCallback, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { IPredictionMarketHookAbi } from '@/contracts/IPredictionMarketHook_abi';
import { PREDICTION_MARKET_HOOK_ADDRESS } from '@/app/constants';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';

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
  
  // Step 1: Approve tokens
  const approveTokens = useCallback(async (
    collateralAddress: string,
    amount: string
  ) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    setIsApproving(true);
    try {
      const parsedAmount = parseEther(amount);
      
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
    }
  }, [address, isConnected, writeContract]);
  
  // Step 2: Create market
  const createMarket = useCallback(async (params: CreateMarketParams) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Convert duration from days to seconds
      const durationInSeconds = params.duration * 24 * 60 * 60;
      
      // Prepare contract parameters
      const contractParams = {
        oracle: address as `0x${string}`,
        creator: address as `0x${string}`,
        collateralAddress: params.collateralAddress as `0x${string}`,
        collateralAmount: parseEther(params.collateralAmount),
        title: params.title,
        description: params.description,
        duration: BigInt(durationInSeconds),
        curveId: BigInt(params.curveId)
      };
      
      // Call the contract
      const hash = await writeContract({
        address: PREDICTION_MARKET_HOOK_ADDRESS,
        abi: IPredictionMarketHookAbi,
        functionName: 'createMarketAndDepositCollateral',
        args: [contractParams],
      });
      
      return hash;
    } catch (error) {
      console.error('Error creating market:', error);
      throw error;
    }
  }, [address, isConnected, writeContract]);
  
  return {
    approveTokens,
    createMarket,
    isPending,
    isApproving,
    isReady: isConnected && !!address
  };
} 