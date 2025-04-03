"use client";

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { useCreateMarket } from '@/hooks/useCreateMarket';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';
import { PREDICTION_MARKET_HOOK_ADDRESS } from '@/app/constants';

export default function CreateProposal() {
  const router = useRouter();
  const { address, chain } = useAccount();
  const { approveTokens, createMarket, isPending, isApproving, isSimulating, isReady, checkBalance } = useCreateMarket();
  
  const [step, setStep] = useState('prepare'); // 'prepare', 'approve', 'create'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEnoughBalance, setHasEnoughBalance] = useState<boolean | null>(null);
  
  // Initial form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 7, // Default 7 days
    collateralAmount: '10',
    collateralAddress: '0x77a4d2324d8330a04a0187a36d35fa4b542d17eb', // test usdc unichain sepolia
    curveId: 0
  });

  // Check if tokens are already approved
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: formData.collateralAddress as `0x${string}`,
    abi: MockERC20Abi,
    functionName: 'allowance',
    args: [address || '0x0', PREDICTION_MARKET_HOOK_ADDRESS],
    query: {
      enabled: !!address && step === 'approve',
    }
  });

  // Check allowance when entering approve step
  useEffect(() => {
    if (step === 'approve' && allowance) {
      const requiredAmount = parseEther(formData.collateralAmount);
      
      // If allowance is sufficient, skip to create step
      if (BigInt(allowance.toString()) >= requiredAmount) {
        console.log('Tokens already approved, skipping to create step');
        setStep('create');
      }
    }
  }, [step, allowance, formData.collateralAmount]);

  // Add this effect to check balance when the form changes
  useEffect(() => {
    if (address && formData.collateralAddress && formData.collateralAmount) {
      const checkUserBalance = async () => {
        const result = await checkBalance(formData.collateralAddress, formData.collateralAmount);
        setHasEnoughBalance(result);
      };
      
      checkUserBalance();
    }
  }, [address, formData.collateralAddress, formData.collateralAmount, checkBalance]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  // Handle token approval
  const handleApprove = async () => {
    if (!isReady) return;
    setIsSubmitting(true);
    setError(null);
    
    try {
      await approveTokens(formData.collateralAddress, formData.collateralAmount);
      await refetchAllowance(); // Refresh allowance after approval
      setStep('create');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve tokens');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle market creation
  const handleCreateMarket = async () => {
    if (!isReady) return;
    setIsSubmitting(true);
    setError(null);
    
    try {
      await createMarket(formData);
      alert('Market created successfully!');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create market');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'prepare') {
      setStep('approve');
    } else if (step === 'approve') {
      handleApprove();
    } else if (step === 'create') {
      handleCreateMarket();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Prediction Market</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!hasEnoughBalance && hasEnoughBalance !== null && (
        <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 p-3 rounded mb-4">
          You don't have enough tokens. Please mint some tokens first.
          <button 
            onClick={() => router.push('/mint')} 
            className="ml-2 underline"
          >
            Go to mint page
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form fields - only show if in prepare step */}
        {step === 'prepare' && (
          <>
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium">
                Market Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-600 rounded bg-[#1E2631] text-white"
                placeholder="e.g., Will ETH price exceed $3000 by June 2023?"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full p-2 border border-gray-600 rounded bg-[#1E2631] text-white"
                placeholder="Provide details about your prediction market..."
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="duration" className="block text-sm font-medium">
                Duration (days)
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                required
                className="w-full p-2 border border-gray-600 rounded bg-[#1E2631] text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="collateralAddress" className="block text-sm font-medium">
                Collateral Token Address
              </label>
              <input
                type="text"
                id="collateralAddress"
                name="collateralAddress"
                value={formData.collateralAddress}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-600 rounded bg-[#1E2631] text-white"
                placeholder="0x..."
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="collateralAmount" className="block text-sm font-medium">
                Collateral Amount
              </label>
              <input
                type="text"
                id="collateralAmount"
                name="collateralAmount"
                value={formData.collateralAmount}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-600 rounded bg-[#1E2631] text-white"
                placeholder="100"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="curveId" className="block text-sm font-medium">
                Curve ID
              </label>
              <select
                id="curveId"
                name="curveId"
                value={formData.curveId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded bg-[#1E2631] text-white"
              >
                <option value="0">Default Curve (0)</option>
                <option value="1">Curve 1</option>
                <option value="2">Curve 2</option>
              </select>
            </div>
          </>
        )}
        
        {/* Summary - show in approve and create steps */}
        {(step === 'approve' || step === 'create') && (
          <div className="bg-[#2D3745] p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">Market Summary</h3>
            <p><strong>Title:</strong> {formData.title}</p>
            <p><strong>Description:</strong> {formData.description}</p>
            <p><strong>Duration:</strong> {formData.duration} days</p>
            <p><strong>Collateral:</strong> {formData.collateralAmount} tokens</p>
            <p><strong>Collateral Address:</strong> {formData.collateralAddress}</p>
          </div>
        )}
        
        {chain && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Connected to chain: {chain.name} (ID: {chain.id})
            </p>
          </div>
        )}
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isPending || isApproving || isSimulating || !isReady}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-500"
          >
            {isSubmitting || isPending || isApproving || isSimulating
              ? isSimulating 
                ? 'Simulating...' 
                : 'Processing...' 
              : step === 'prepare' 
                ? 'Continue' 
                : step === 'approve' 
                  ? 'Approve Tokens' 
                  : 'Create Market'}
          </button>
          
          {!isReady && (
            <p className="mt-2 text-red-400 text-sm">
              Please connect your wallet to create a market
            </p>
          )}
        </div>
      </form>
    </div>
  );
} 