"use client";

import { useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';

export function useMintCollateral() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  
  const mint = useCallback(async (
    collateralAddress: `0x${string}`,
    amount: string,
    decimals: number = 6 // Default to 6 decimals for USDC
  ) => {
    if (!amount || !collateralAddress) {
      throw new Error('Amount and collateral address are required');
    }
    
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Convert amount to proper units based on decimals
      const parsedAmount = parseUnits(amount, decimals);
      
      // Call the mint function directly using wagmi's writeContract
      const hash = await writeContract({
        abi: MockERC20Abi,
        address: collateralAddress,
        functionName: 'mint',
        args: [address, parsedAmount],
      });
      
      return hash;
    } catch (error) {
      console.error('Error minting collateral:', error);
      throw error;
    }
  }, [address, isConnected, writeContract]);

  return {
    mint,
    isMinting: isPending,
    isClientReady: isConnected
  };
}

// Helper function to encode function data
function encodeFunctionData({ abi, functionName, args }: {
  abi: any;
  functionName: string;
  args: any[];
}) {
  // Find the function in the ABI
  const functionFragment = abi.find(
    (fragment: any) => fragment.type === 'function' && fragment.name === functionName
  );
  
  if (!functionFragment) {
    throw new Error(`Function ${functionName} not found in ABI`);
  }
  
  // Encode the function selector (first 4 bytes of the keccak256 hash of the function signature)
  const inputTypes = functionFragment.inputs.map((input: any) => input.type).join(',');
  const functionSelector = `${functionName}(${inputTypes})`;
  const selector = keccak256(functionSelector).slice(0, 10);
  
  // Encode the arguments
  // This is a simplified version - in a real implementation you might want to use a library like ethers.js or viem
  const encodedArgs = args.map(arg => {
    if (typeof arg === 'bigint') {
      return arg.toString(16).padStart(64, '0');
    }
    if (typeof arg === 'string' && arg.startsWith('0x')) {
      return arg.slice(2).padStart(64, '0');
    }
    // Add more cases as needed
    return ''; 
  }).join('');
  
  return selector + encodedArgs;
}

// Simple keccak256 implementation for demonstration
// In a real app, use a proper library like ethers.js or viem
function keccak256(value: string): string {
  // This is just a placeholder - you should use a proper implementation
  return '0x' + Array.from(value).reduce((hash, char) => 
    ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0).toString(16).padStart(64, '0');
} 