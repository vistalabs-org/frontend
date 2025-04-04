"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { useCreateMarket } from '@/hooks/useCreateMarket';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';
import { PREDICTION_MARKET_HOOK_ADDRESS } from '@/app/constants';

// Add this component for the Loom video
const LoomVideoExplanation = () => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">How It Works</h2>
      <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden">
        <iframe 
          src="https://www.loom.com/embed/14eebc7c6f0e4312b68431ae8b6d0189?sid=011b6192-4b9f-442a-bd1f-b62b4614c2b3" 
          frameBorder="0" 
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
          allowFullScreen 
          className="absolute top-0 left-0 w-full h-full"
        ></iframe>
      </div>
      <p className="text-sm text-gray-400 mt-2">
        Watch this short video to understand how prediction markets work.
      </p>
    </div>
  );
};

export default function CreateProposal() {
  const router = useRouter();
  const { address, chain } = useAccount();
  const { approveTokens, createMarket, isPending, isApproving, isSimulating, isReady, checkBalance } = useCreateMarket();
  
  // Add a new step for market type selection
  const [step, setStep] = useState('select-type'); // 'select-type', 'prepare', 'approve', 'create'
  const [marketType, setMarketType] = useState<'token-price' | 'protocol-kpi' | null>(null);
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

  // Handle market type selection
  const handleMarketTypeSelect = (type: 'token-price' | 'protocol-kpi') => {
    setMarketType(type);
    if (type === 'protocol-kpi') {
      setStep('prepare');
    } else {
      // For token price markets, we'll redirect to a different page in the future
      alert('Token price markets are coming soon!');
    }
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
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Only show balance warning if not in select-type step */}
      {!hasEnoughBalance && hasEnoughBalance !== null && step !== 'select-type' && (
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
      
      {/* Market Type Selection Step */}
      {step === 'select-type' && (
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold mb-6">Create New Prediction Market</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Token Price Market Card */}
              <div 
                className="border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => handleMarketTypeSelect('token-price')}
              >
                <div className="flex items-center justify-center mb-4 text-blue-400">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-center mb-2">Proposal based on token price</h3>
                <p className="text-sm text-gray-400 text-center">
                  Decide based on the expected impact of the proposal on the token price
                </p>
                <div className="mt-4 text-xs text-center text-gray-500">Coming soon</div>
              </div>
              
              {/* Protocol KPI Market Card */}
              <div 
                className="border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => handleMarketTypeSelect('protocol-kpi')}
              >
                <div className="flex items-center justify-center mb-4 text-green-400">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    <path d="M7 12h2v5H7zm4-7h2v12h-2zm4 4h2v8h-2z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-center mb-2">Proposal based on KPIs</h3>
                <p className="text-sm text-gray-400 text-center">
                  Decide based on the expected impact of the proposal on the KPIs (e.g. TVL, volume, liquidity, etc.)
                </p>
              </div>
            </div>
          </div>
          
          {/* Video explanation now appears below the cards */}
          <div className="border-t border-gray-700 pt-8">
            <LoomVideoExplanation />
          </div>
        </div>
      )}
      
      {/* Form fields - only show if in prepare step */}
      {step !== 'select-type' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 'prepare' && (
            <>
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Market Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2 bg-[#1E2530] border border-gray-700 rounded focus:outline-none focus:border-green-500"
                  placeholder="Will Protocol X reach 1M TVL by EOY?"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Market Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-2 bg-[#1E2530] border border-gray-700 rounded focus:outline-none focus:border-green-500"
                  placeholder="Provide details about this market, including resolution criteria..."
                  required
                />
              </div>
              
              <div>
                <label htmlFor="duration" className="block text-sm font-medium mb-1">
                  Duration (days)
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full p-2 bg-[#1E2530] border border-gray-700 rounded focus:outline-none focus:border-green-500"
                >
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="collateralAmount" className="block text-sm font-medium mb-1">
                  Collateral Amount (USDC)
                </label>
                <input
                  type="number"
                  id="collateralAmount"
                  name="collateralAmount"
                  value={formData.collateralAmount}
                  onChange={handleChange}
                  className="w-full p-2 bg-[#1E2530] border border-gray-700 rounded focus:outline-none focus:border-green-500"
                  min="1"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  This amount will be used as collateral for the market.
                </p>
              </div>
            </>
          )}
          
          {(step === 'approve' || step === 'create') && (
            <div className="bg-[#2D3745] p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Market Summary</h3>
              <p><strong>Title:</strong> {formData.title}</p>
              <p><strong>Description:</strong> {formData.description}</p>
              <p><strong>Duration:</strong> {formData.duration} days</p>
              <p><strong>Collateral:</strong> {formData.collateralAmount} tokens</p>
              <p><strong>Collateral Address:</strong> {formData.collateralAddress}</p>
              
              {/* New information about token distribution */}
              <div className="mt-3 pt-3 border-t border-gray-600">
                <p>You will receive <strong>{formData.collateralAmount} YES tokens</strong> and <strong>{formData.collateralAmount} NO tokens</strong> after market creation.</p>
                <p className="text-sm text-gray-400 mt-1">
                  These tokens represent your position in this prediction market. You can use them to add liquidity to the market. You can also trade them on the market page.
                </p>
              </div>
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
      )}
    </div>
  );
}