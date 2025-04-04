// frontend/src/app/create-proposal/create/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { useCreateMarket } from '@/hooks/useCreateMarket';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';
import { PREDICTION_MARKET_HOOK_ADDRESS } from '@/app/constants';

export default function CreateMarket() {
  const router = useRouter();
  const { address } = useAccount();
  const { approveTokens, createMarket, isPending, isApproving, isSimulating, isReady } = useCreateMarket();
  const [formData, setFormData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'approve' | 'create'>('approve');
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);

  // Load form data from localStorage
  useEffect(() => {
    console.log('Deploy page mounted, checking for form data');
    try {
      const savedData = localStorage.getItem('marketFormData');
      console.log('Retrieved from localStorage:', savedData);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('Parsed form data:', parsedData);
        setFormData(parsedData);
      } else {
        console.log('No form data found, redirecting to form page');
        router.push('/create-proposal/kpi-market');
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      router.push('/create-proposal/kpi-market');
    }
  }, [router]);

  // Get token decimals
  const { data: decimals } = useReadContract({
    address: formData?.collateralAddress as `0x${string}`,
    abi: MockERC20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!formData?.collateralAddress,
    }
  });

  // Update token decimals when data is available
  useEffect(() => {
    if (decimals !== undefined) {
      console.log('Token decimals:', decimals);
      setTokenDecimals(Number(decimals));
    }
  }, [decimals]);

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: formData?.collateralAddress as `0x${string}`,
    abi: MockERC20Abi,
    functionName: 'allowance',
    args: [address || '0x0', PREDICTION_MARKET_HOOK_ADDRESS],
    query: {
      enabled: !!address && !!formData?.collateralAddress,
    }
  });

  // Check if already approved
  useEffect(() => {
    if (allowance && formData && tokenDecimals !== null) {
      try {
        const requiredAmount = parseUnits(formData.collateralAmount, tokenDecimals);
        console.log('Allowance check:', {
          allowance: allowance.toString(),
          requiredAmount: requiredAmount.toString(),
          tokenDecimals,
          isEnough: BigInt(allowance.toString()) >= requiredAmount
        });
        
        if (BigInt(allowance.toString()) >= requiredAmount) {
          setStep('create');
        }
      } catch (error) {
        console.error('Error checking allowance:', error);
      }
    }
  }, [allowance, formData, tokenDecimals]);

  // Handle token approval
  const handleApprove = async () => {
    if (!isReady || !formData || tokenDecimals === null) return;
    setIsSubmitting(true);
    
    try {
      await approveTokens(formData.collateralAddress, formData.collateralAmount);
      await refetchAllowance();
      setStep('create');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve tokens');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle market creation
  const handleCreateMarket = async () => {
    if (!isReady || !formData) return;
    setIsSubmitting(true);
    
    try {
      // Pass token decimals to createMarket
      await createMarket({
        ...formData,
        tokenDecimals: tokenDecimals || 18 // Fallback to 18 if not available
      });
      localStorage.removeItem('marketFormData'); // Clean up
      alert('Market created successfully!');
      router.push('/');
    } catch (err) {
      console.error('Market creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create market');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Button state based on current step
  const buttonState = {
    text: step === 'approve' 
      ? (isSubmitting || isApproving ? 'Approving...' : 'Approve Tokens')
      : (isSubmitting || isPending || isSimulating ? 'Creating Market...' : 'Create Market'),
    onClick: step === 'approve' ? handleApprove : handleCreateMarket,
    disabled: isSubmitting || (step === 'approve' ? isApproving : (isPending || isSimulating)) || !isReady || !formData || tokenDecimals === null
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {step === 'approve' ? 'Approve Tokens' : 'Create Market'}
      </h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Market summary */}
      {formData && (
        <div className="bg-[#2D3745] p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium mb-2">Market Summary</h3>
          <p><strong>Title:</strong> {formData.title}</p>
          <p><strong>Description:</strong> {formData.description}</p>
          <p><strong>Duration:</strong> {formData.duration} days</p>
          <p><strong>Collateral:</strong> {formData.collateralAmount} tokens {tokenDecimals !== null ? `(${tokenDecimals} decimals)` : ''}</p>
          
          {/* Token distribution info */}
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p>You will receive <strong>{formData.collateralAmount} YES tokens</strong> and <strong>{formData.collateralAmount} NO tokens</strong> after market creation.</p>
            <p className="text-sm text-gray-400 mt-1">
              These tokens represent your position in this prediction market. You can use them to add liquidity to the market or trade them.
            </p>
          </div>
        </div>
      )}
      
      <button
        onClick={buttonState.onClick}
        disabled={buttonState.disabled}
        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-500"
      >
        {buttonState.text}
      </button>
      
      {tokenDecimals === null && formData && (
        <p className="mt-2 text-yellow-400 text-sm">
          Loading token information...
        </p>
      )}
    </div>
  );
}