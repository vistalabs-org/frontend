"use client";

import { useCallback, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import PredictionMarketHook_abi from '@/contracts/PredictionMarketHook.json';
import { usePredictionMarketHookAddress } from '@/config';
import MockERC20Abi from '@/contracts/MockERC20.json';
import { getPublicClient, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from '@/app/providers';

interface CreateMarketParams {
  title: string;
  description: string;
  duration: number; // in days
  collateralAmount: string;
  collateralAddress: string;
  curveId: number;
}


export function useCreateMarket() {
  const { address, isConnected, connector } = useAccount();
  
  // Configure useWriteContract with callbacks
  const { 
    writeContract, 
    isPending: isSubmitting, 
    error: writeContractError, 
    isError: isWriteContractError,
    reset, // Add reset function
    data: writeContractData // Get the hash from the hook's data
  } = useWriteContract({
    mutation: {
      onSuccess: (data) => {
        console.log('[useWriteContract onSuccess] Hash:', data);
      },
      onError: (error) => {
        console.error('[useWriteContract onError]', error);
      }
    }
  });

  const [isApproving, setIsApproving] = useState(false); // Tracks the approveTokens call
  const [isCreating, setIsCreating] = useState(false); // Tracks the createMarket call
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false); // Tracks waiting for receipt
  const hookAddress = usePredictionMarketHookAddress();
  
  // Add this function to get token decimals
  const getTokenDecimals = useCallback(async (
    tokenAddress: string
  ): Promise<number> => {
    if (!address) return 18; // Default to 18 if no address
    
    try {
      const publicClient = getPublicClient(wagmiConfig);
      // Use readContract for simplicity if simulation isn't strictly needed
      const decimals = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: MockERC20Abi,
        functionName: 'decimals',
      });
      
      console.log(`Token ${tokenAddress} has ${Number(decimals)} decimals`);
      return Number(decimals);
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
    return parseUnits(amount, decimals);
  }, [getTokenDecimals]);

  // Update checkBalance to use correct decimals
  const checkBalance = useCallback(async (
    collateralAddress: string,
    requiredAmountStr: string
  ): Promise<{ hasEnough: boolean; balanceFormatted: string; requiredFormatted: string; decimals: number }> => {
    if (!isConnected || !address) return { hasEnough: false, balanceFormatted: '0', requiredFormatted: '0', decimals: 0 };
    
    try {
      const publicClient = getPublicClient(wagmiConfig);
      const decimals = await getTokenDecimals(collateralAddress);
      
      // Get token balance
      const balanceResult = await publicClient.readContract({
        address: collateralAddress as `0x${string}`,
        abi: MockERC20Abi,
        functionName: 'balanceOf',
        args: [address],
      });
      
      // Cast the result to bigint to resolve linter error
      const balanceValue = balanceResult as bigint;
      
      const requiredAmountParsed = parseUnits(requiredAmountStr, decimals);
      const hasEnoughBalance = balanceValue >= requiredAmountParsed;
      
      const balanceFormatted = formatUnits(balanceValue, decimals);
      const requiredFormatted = formatUnits(requiredAmountParsed, decimals);

      console.log('Balance check:', {
        balance: balanceFormatted,
        required: requiredFormatted,
        hasEnough: hasEnoughBalance,
        decimals
      });
      
      return { hasEnough: hasEnoughBalance, balanceFormatted, requiredFormatted, decimals };
    } catch (error) {
      console.error('Error checking balance:', error);
      return { hasEnough: false, balanceFormatted: '0', requiredFormatted: '0', decimals: 0 };
    }
  }, [address, isConnected, getTokenDecimals]);
  
  // Step 1: Approve tokens
  const approveTokens = useCallback(async (
    collateralAddress: string,
    amount: string
  ): Promise<`0x${string}`> => {
    reset(); // Reset hook state before new operation
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    const balanceCheck = await checkBalance(collateralAddress, amount);
    if (!balanceCheck.hasEnough) {
      throw new Error(`Insufficient token balance. Required: ${balanceCheck.requiredFormatted}, Available: ${balanceCheck.balanceFormatted}`);
    }
    
    setIsApproving(true);
    setIsSimulating(false);
    setIsConfirming(false);
    
    let txHash: `0x${string}` | undefined;

    try {
      const parsedAmount = await parseAmount(amount, collateralAddress);
      
      setIsSimulating(true);
      console.log('Simulating approval...');
      const publicClient = getPublicClient(wagmiConfig);
      await publicClient.simulateContract({
        address: collateralAddress as `0x${string}`,
        abi: MockERC20Abi,
        functionName: 'approve',
        args: [hookAddress as `0x${string}`, parsedAmount],
        account: address, // Simulation needs account
      });
      console.log('Approval simulation successful.');
      setIsSimulating(false);
      
      console.log('Attempting to writeContract for approval...');
      
      // Call writeContract (triggers mutation, onSuccess/onError handle result)
      await new Promise<void>((resolve, reject) => {
        writeContract({
          address: collateralAddress as `0x${string}`,
          abi: MockERC20Abi,
          functionName: 'approve',
          args: [hookAddress as `0x${string}`, parsedAmount],
          // Let hook handle account/chainId from context
        }, {
          // Use the specific onSuccess/onError for this call if needed
          // These override the main hook config callbacks for this specific call
          onSuccess: (hash) => { 
            console.log('[approveTokens writeContract onSuccess] Hash:', hash);
            if (!hash || typeof hash !== 'string' || !hash.startsWith('0x')) {
              console.error('[approveTokens] Invalid hash received from onSuccess:', hash);
              reject(new Error(`[approveTokens] Invalid transaction hash received: ${hash}`));
              return;
            }
            txHash = hash;
            resolve(); 
          },
          onError: (error) => {
            console.error('[approveTokens writeContract onError]', error);
            reject(error);
          }
        });
      });

      if (!txHash) {
        // This case should be caught by the Promise reject, but for safety:
        throw new Error("[approveTokens] Hash was not set after writeContract call.");
      }

      setIsConfirming(true);
      console.log(`Approval tx submitted (${txHash}). Waiting for confirmation...`);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      console.log('Approval transaction confirmed:', receipt);
      setIsConfirming(false);

    } catch (error) {
      console.error('Error approving tokens (in catch block):', error);
       // Check if error is from the hook
       if (isWriteContractError && writeContractError) {
         console.error("Propagating error from useWriteContract:", writeContractError);
         throw writeContractError;
       }
      throw error; // Re-throw error
    } finally {
      setIsApproving(false);
      setIsSimulating(false);
      setIsConfirming(false);
    }
    
    // No need for redundant check, txHash assignment is guarded
    return txHash; 
  }, [address, isConnected, writeContract, checkBalance, parseAmount, hookAddress, getTokenDecimals, reset, isWriteContractError, writeContractError]);
  
  // Step 2: Create market
  const createMarket = useCallback(async (
    params: CreateMarketParams
  ): Promise<`0x${string}`> => {
    reset(); // Reset hook state before new operation
    console.log('Account Info:', { address, isConnected, connectorName: connector?.name });

    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    const balanceCheck = await checkBalance(params.collateralAddress, params.collateralAmount);
    if (!balanceCheck.hasEnough) {
      throw new Error(`Insufficient token balance. Required: ${balanceCheck.requiredFormatted}, Available: ${balanceCheck.balanceFormatted}`);
    }
    
    setIsCreating(true); // Use specific state for create
    setIsSimulating(false);
    setIsConfirming(false);
    let txHash: `0x${string}` | undefined; 

    try {
      if (typeof params.duration !== 'number' || isNaN(params.duration) || params.duration <= 0) {
        throw new Error(`Invalid duration provided: ${params.duration}`);
      }
      const durationInSeconds = params.duration * 24 * 60 * 60;

      if (typeof params.curveId !== 'number' || isNaN(params.curveId)) {
         console.warn(`Invalid curveId provided: ${params.curveId}, defaulting to 0.`);
         params.curveId = 0; // Default to 0 if invalid
      }
      
      const parsedCollateralAmount = await parseAmount(params.collateralAmount, params.collateralAddress);
      
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
      
      setIsSimulating(true);
      console.log('Simulating market creation with params:', {
        ...contractParams,
        collateralAmount: contractParams.collateralAmount.toString(),
        duration: contractParams.duration.toString(),
        curveId: contractParams.curveId.toString()
      });
      
      try {
        const publicClient = getPublicClient(wagmiConfig);
        const simulation = await publicClient.simulateContract({
          address: hookAddress as `0x${string}`,
          abi: PredictionMarketHook_abi,
          functionName: 'createMarketAndDepositCollateral',
          args: [contractParams],
          account: address, // Simulation needs account
        });
        
        console.log('Simulation successful:', {
          result: simulation.result,
          request: simulation.request,
        });
      } catch (simError) {
        console.error('Simulation failed:', simError);
        // Extract more detailed error information if possible
        if (simError instanceof Error) {
          const anyError = simError as any;
          if (anyError.cause) console.error('Simulation Cause:', anyError.cause);
          if (anyError.shortMessage) console.error('Simulation Short Message:', anyError.shortMessage);
          // Log internal error if available (common in Viem/RPC errors)
          if (anyError.innerError) console.error('Simulation Inner Error:', anyError.innerError);
          else if (anyError.error) console.error('Simulation Error Prop:', anyError.error);
        }
        throw new Error(`Market creation simulation failed: ${simError instanceof Error ? simError.message : String(simError)}`);
      } finally {
        setIsSimulating(false);
      }
      
      console.log('Attempting to write contract for market creation...');

      // Call writeContract (triggers mutation, onSuccess/onError handle result)
      await new Promise<void>((resolve, reject) => {
        writeContract({
          address: hookAddress as `0x${string}`,
          abi: PredictionMarketHook_abi,
          functionName: 'createMarketAndDepositCollateral',
          args: [contractParams],
           // Let hook handle account/chainId from context
        }, {
          // Use the specific onSuccess/onError for this call
          onSuccess: (hash) => {
            console.log('[createMarket writeContract onSuccess] Hash:', hash);
             if (!hash || typeof hash !== 'string' || !hash.startsWith('0x')) {
               console.error('[createMarket] Invalid hash received from onSuccess:', hash);
               reject(new Error(`[createMarket] Invalid transaction hash received: ${hash}`));
               return;
             }
            txHash = hash;
            resolve();
          },
          onError: (error) => {
            console.error('[createMarket writeContract onError]', error);
            reject(error);
          }
        });
      });

      if (!txHash) {
        throw new Error("[createMarket] Hash was not set after writeContract call.");
      }

      setIsConfirming(true);
      console.log(`Create market tx submitted (${txHash}). Waiting for confirmation...`);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      console.log('Create market transaction confirmed:', receipt);
      setIsConfirming(false);

    } catch (error) {
      console.error('Error creating market (in catch block):', error);
       // Check if error is from the hook state as a fallback
       if (isWriteContractError && writeContractError) {
         console.error("Propagating error from useWriteContract:", writeContractError);
         throw writeContractError;
       }
      throw error; // Re-throw error
    } finally {
      setIsCreating(false); // Use specific state
      setIsSimulating(false);
      setIsConfirming(false);
    }

    return txHash;
  }, [address, isConnected, writeContract, checkBalance, parseAmount, hookAddress, getTokenDecimals, connector, reset, isWriteContractError, writeContractError]);
  
  // Consolidate loading states for UI
  const isLoading = isApproving || isCreating || isSimulating || isSubmitting || isConfirming;
  
  return {
    approveTokens,
    createMarket,
    checkBalance, // Expose checkBalance if needed externally
    // Individual states for detailed UI feedback
    isApproving, // True during approveTokens call until confirmation/error
    isCreating,  // True during createMarket call until confirmation/error
    isSimulating, // True during simulation phase of either call
    isSubmitting, // True while wallet interaction is pending (from useWriteContract)
    isConfirming, // True while waiting for blockchain confirmation
    // Combined loading state
    isLoading, 
    // General readiness check (wallet connected, not busy)
    isReady: isConnected && !!address && !isLoading,
    // Expose errors if needed
    error: writeContractError,
    isError: isWriteContractError
  };
} 