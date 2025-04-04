// frontend/src/app/create-proposal/create/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
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

  // Load form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('marketFormData');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    } else {
      router.push('/create-proposal/kpi-market');
    }
  }, [router]);

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
    if (allowance && formData) {
      const requiredAmount = parseEther(formData.collateralAmount);
      console.log('Allowance check:', {
        allowance: allowance.toString(),
        requiredAmount: requiredAmount.toString(),
        isEnough: BigInt(allowance.toString()) >= requiredAmount
      });
      
      if (BigInt(allowance.toString()) >= requiredAmount) {
        setStep('create');
      }
    }
  }, [allowance, formData]);

  // Handle token approval
  const handleApprove = async () => {
    if (!isReady || !formData) return;
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
      await createMarket(formData);
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
    disabled: isSubmitting || (step === 'approve' ? isApproving : (isPending || isSimulating)) || !isReady || !formData
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
          <p><strong>Collateral:</strong> {formData.collateralAmount} tokens</p>
          
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
    </div>
  );
}