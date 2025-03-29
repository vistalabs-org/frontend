"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance, useWriteContract, useContractRead, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { PREDICTION_MARKET_HOOK_ADDRESS, ROUTER } from '@/app/constants';
import { PoolSwapTestAbi } from '@/contracts/PoolSwapTest_abi';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';

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
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | null>(null);
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

  // Update the needsApproval check to only check the relevant token
  const needsApproval = useMemo(() => {
    console.log('Evaluating needsApproval with:', {
      amount,
      selectedAction,
      collateralAllowance: collateralAllowance?.toString(),
      outcomeTokenAllowance: outcomeTokenAllowance?.toString(),
      isConnected,
      approvalSuccess
    });
    
    if (!amount || !isConnected || approvalSuccess) {
      console.log('Early return: false');
      return false;
    }
    
    try {
      if (parseFloat(amount) <= 0) return false;
      
      // For Buy actions, check ONLY collateral allowance
      if (selectedAction === 'Buy') {
        if (!collateralAllowance) return true;
        
        const decimals = 6; // USDC has 6 decimals
        const amountBigInt = parseUnits(amount, decimals);
        
        console.log('Checking Buy approval:', {
          collateralAllowance: collateralAllowance.toString(),
          amountBigInt: amountBigInt.toString(),
          hasEnoughAllowance: BigInt(collateralAllowance.toString()) >= amountBigInt
        });
        
        return BigInt(collateralAllowance.toString()) < amountBigInt;
      } 
      // For Sell actions, check ONLY the specific outcome token allowance
      else {
        // If we don't have allowance data yet, assume we need approval
        if (!outcomeTokenAllowance) return true;
        
        const decimals = 18; // Outcome tokens have 18 decimals
        const amountBigInt = parseUnits(amount, decimals);
        
        console.log('Checking Sell approval:', {
          outcomeTokenAllowance: outcomeTokenAllowance.toString(),
          amountBigInt: amountBigInt.toString(),
          needsApproval: outcomeTokenAllowance ? BigInt(outcomeTokenAllowance.toString()) < amountBigInt : true
        });
        
        return outcomeTokenAllowance ? BigInt(outcomeTokenAllowance.toString()) < amountBigInt : true;
      }
    } catch (error) {
      console.error('Error checking allowance:', error);
      return false;
    }
  }, [amount, selectedAction, collateralAllowance, outcomeTokenAllowance, isConnected, approvalSuccess]);
  
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
      setIsSwapping(true);
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        alert('Please enter a valid amount');
        setIsSwapping(false);
        return;
      }
      
      // Determine which pool to use
      const pool = selectedOption === 'Yes' ? yesPool : noPool;
      if (!pool) {
        alert('Pool data not available');
        setIsSwapping(false);
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
      
      // For buying outcome tokens (swapping collateral for outcome tokens)
      if (selectedAction === 'Buy') {
        // First approve the collateral token
        const decimals = 6; // Assuming USDC with 6 decimals
        const amountToApprove = parseUnits(amount, decimals);
        
        await approveCollateral({
          address: market?.collateralAddress as `0x${string}`,
          abi: MockERC20Abi,
          functionName: 'approve',
          args: [ROUTER, amountToApprove],
        });
        
        // After approval, execute the swap
        // When buying outcome tokens, we're swapping from currency0 (collateral) to currency1 (outcome)
        // So zeroForOne is true
        const swapParams = {
          zeroForOne: true, // From currency0 (collateral) to currency1 (outcome token)
          amountSpecified: parseUnits(amount, decimals), // Positive for exact input
          sqrtPriceLimitX96: BigInt(0) // 0 means no limit (will use router's default)
        };
        
        const testSettings = {
          takeClaims: true,
          settleUsingBurn: false
        };
        
        // Execute the swap
        executeSwap({
          address: ROUTER as `0x${string}`,
          abi: PoolSwapTestAbi,
          functionName: 'swap',
          args: [poolKey, swapParams, testSettings, '0x'],
        });
      } 
      // For selling outcome tokens (swapping outcome tokens for collateral)
      else {
        // First approve the outcome token
        const decimals = 18; // Outcome tokens typically have 18 decimals
        const amountToApprove = parseUnits(amount, decimals);
        
        await approveOutcomeToken({
          address: selectedOption === 'Yes' 
            ? market?.yesToken as `0x${string}` 
            : market?.noToken as `0x${string}`,
          abi: MockERC20Abi,
          functionName: 'approve',
          args: [ROUTER, amountToApprove],
        });
        
        // After approval, execute the swap
        // When selling outcome tokens, we're swapping from currency1 (outcome) to currency0 (collateral)
        // So zeroForOne is false
        const swapParams = {
          zeroForOne: false, // From currency1 (outcome token) to currency0 (collateral)
          amountSpecified: parseUnits(amount, decimals), // Positive for exact input
          sqrtPriceLimitX96: BigInt(0) // 0 means no limit (will use router's default)
        };
        
        const testSettings = {
          takeClaims: true,
          settleUsingBurn: false
        };
        
        // Execute the swap
        executeSwap({
          address: ROUTER as `0x${string}`,
          abi: PoolSwapTestAbi,
          functionName: 'swap',
          args: [poolKey, swapParams, testSettings, '0x'],
        });
      }
    } catch (error) {
      console.error('Swap error:', error);
      alert('Error executing swap. See console for details.');
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
  
  // Add transaction receipt tracking
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalConfirmed } = 
    useWaitForTransactionReceipt({
      hash: approvalTxHash,
      enabled: !!approvalTxHash,
    });

  // Update the handleApprove function to track the transaction
  const handleApprove = async (params: any) => {
    try {
      setApprovalSuccess(false);
      const hash = await (selectedAction === 'Buy' ? approveCollateral : approveOutcomeToken)(params);
      setApprovalTxHash(hash);
    } catch (error) {
      console.error('Error approving token:', error);
    }
  };

  // Reset approval success when changing tokens or actions
  useEffect(() => {
    setApprovalSuccess(false);
    setApprovalTxHash(null);
  }, [selectedAction, selectedOption]);

  // Set approval success when transaction is confirmed
  useEffect(() => {
    if (isApprovalConfirmed && approvalTxHash) {
      setApprovalSuccess(true);
    }
  }, [isApprovalConfirmed, approvalTxHash]);

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

  // At the end of the component, right before the return:
  console.log('FINAL VALUES before return:', { 
    needsApproval, 
    approvalSuccess,
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
    isApproving: isApproving || isApprovingOutcome || isWaitingForApproval,
    approvalSuccess,
    // Add debug values 
    debug: {
      collateralAllowance: collateralAllowance?.toString(),
      outcomeTokenAllowance: outcomeTokenAllowance?.toString(),
      isConnected,
      approvalSuccess
    }
  };
} 