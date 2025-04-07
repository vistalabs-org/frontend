// frontend/src/app/create-proposal/create/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useCreateMarket } from '@/hooks/useCreateMarket';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';
import { usePredictionMarketHookAddress } from '@/config';
import { useMintCollateral } from '@/hooks/useMintCollateral';

export default function CreateMarket() {
  const router = useRouter();
  const { address } = useAccount();
  const hookAddress = usePredictionMarketHookAddress();
  const { approveTokens, createMarket, isPending, isApproving, isSimulating, isReady } = useCreateMarket();
  const { mint, isMinting, isClientReady } = useMintCollateral();
  const [formData, setFormData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'approve' | 'create'>('approve');
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);
  const [mintAmount, setMintAmount] = useState<string>('');
  const [isMintingCollateral, setIsMintingCollateral] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

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

  // Get token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: formData?.collateralAddress as `0x${string}`,
    abi: MockERC20Abi,
    functionName: 'balanceOf',
    args: [address || '0x0'],
    query: {
      enabled: !!address && !!formData?.collateralAddress,
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
    args: [address || '0x0', hookAddress],
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

  // Handle minting collateral tokens
  const handleMintCollateral = async () => {
    if (!isClientReady || !formData?.collateralAddress || !mintAmount || tokenDecimals === null) return;
    
    setIsMintingCollateral(true);
    setError(null);
    setMintSuccess(false);
    
    try {
      await mint(
        formData.collateralAddress as `0x${string}`, 
        mintAmount, 
        tokenDecimals
      );
      setMintSuccess(true);
      setMintAmount(''); // Reset input
      await refetchBalance(); // Update balance
      await refetchAllowance(); // Update allowance
    } catch (err) {
      console.error('Error minting tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint tokens');
    } finally {
      setIsMintingCollateral(false);
    }
  };

  // Format token balance for display
  const formattedBalance = tokenBalance && tokenDecimals !== null
    ? formatUnits(tokenBalance as bigint, tokenDecimals)
    : '0';

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {step === 'approve' ? 'Approve Tokens' : 'Create Market'}
      </h1>
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {mintSuccess && (
        <div className="bg-green-50 border border-green-400 text-green-700 p-3 rounded mb-4">
          Tokens minted successfully!
        </div>
      )}
      
      {/* Mint Collateral Form */}
      {formData && tokenDecimals !== null && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mint Collateral Tokens</h2>
          
          <div className="mb-3">
            <p className="text-gray-600 mb-1">Current Balance:</p>
            <p className="text-gray-900 font-medium">{formattedBalance} tokens</p>
          </div>
          
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="mintAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Mint
              </label>
              <input
                id="mintAmount"
                type="text"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleMintCollateral}
              disabled={isMintingCollateral || !isClientReady || !mintAmount}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isMintingCollateral ? 'Minting...' : 'Mint Tokens'}
            </button>
          </div>
          
          <p className="mt-2 text-sm text-gray-500">
            Mint test tokens to use for creating your market.
          </p>
        </div>
      )}
      
      {/* Market summary */}
      {formData && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Market Summary</h2>
          
          <div className="space-y-4">
            <div>
              <span className="text-gray-600">Title:</span>
              <span className="text-gray-900 ml-2">{formData.title}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Description:</span>
              <span className="text-gray-900 ml-2">{formData.description}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Duration:</span>
              <span className="text-gray-900 ml-2">{formData.duration} days</span>
            </div>
            
            <div>
              <span className="text-gray-600">Collateral:</span>
              <span className="text-gray-900 ml-2">{formData.collateralAmount} tokens ({tokenDecimals} decimals)</span>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-gray-900 mb-4">
              You will receive <span className="font-semibold">{formData.collateralAmount} YES tokens</span> and 
              <span className="font-semibold"> {formData.collateralAmount} NO tokens</span> after market creation.
            </p>
            <p className="text-gray-600">
              These tokens represent your position in this prediction market. You can use them to add liquidity to the market or trade them.
            </p>
          </div>
        </div>
      )}
      
      <button
        onClick={buttonState.onClick}
        disabled={buttonState.disabled}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        {buttonState.text}
      </button>
      
      {tokenDecimals === null && formData && (
        <p className="mt-2 text-yellow-600 text-sm">
          Loading token information...
        </p>
      )}
    </div>
  );
}