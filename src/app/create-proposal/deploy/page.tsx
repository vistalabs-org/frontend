// frontend/src/app/create-proposal/create/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useCreateMarket } from '@/hooks/useCreateMarket';
import { useMintCollateral } from '@/hooks/useMintCollateral';
import MockERC20Abi from '@/contracts/MockERC20.json';
import { Button } from "@/components/ui/button";
import { usePredictionMarketHookAddress } from '@/config';

export default function CreateMarket() {
  const router = useRouter();
  const { address } = useAccount();
  const hookAddress = usePredictionMarketHookAddress();
  const { 
    approveTokens, 
    createMarket, 
    isApproving, 
    isSimulating, 
    isSubmitting,
    isConfirming,
    checkBalance,
    isReady 
  } = useCreateMarket();
  const { mint, isMinting, isClientReady } = useMintCollateral();
  const [formData, setFormData] = useState<any>(null);
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'approve' | 'create'>('approve');
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);
  const [mintAmount, setMintAmount] = useState<string>('');
  const [isMintingCollateral, setIsMintingCollateral] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  
  // Market owner address
  const MARKET_OWNER_ADDRESS = "0x6786B1148E0377BEFe86fF46cc073dE96B987FE4";
  
  // Check if current user is the market owner
  const isMarketOwner = address?.toLowerCase() === MARKET_OWNER_ADDRESS.toLowerCase();

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
    setIsLocalSubmitting(true);
    setError(null);
    try {
      await approveTokens(formData.collateralAddress, formData.collateralAmount);
      await refetchAllowance();
      setStep('create');
    } catch (err) {
      console.error('Approval error:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve tokens');
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  // Handle market creation with added validation
  const handleCreateMarket = async () => {
    if (!isReady || !formData || tokenDecimals === null) {
      setError("Form data or wallet not ready.");
      return;
    }

    // Validate and prepare data right before calling the hook
    const durationNum = Number(formData.duration);
    // Default curveId to 0 if missing, null, undefined, or NaN
    const curveIdNum = (formData.curveId === null || formData.curveId === undefined || isNaN(Number(formData.curveId))) 
                       ? 0 
                       : Number(formData.curveId);

    if (isNaN(durationNum) || durationNum <= 0) {
        setError(`Invalid duration value: ${formData.duration}`);
        return;
    }
    // No need to check curveIdNum for NaN as we default it to 0

    const marketParams = {
      ...formData,
      duration: durationNum, // Pass validated number
      collateralAmount: formData.collateralAmount, // Keep as string for the hook
      curveId: curveIdNum      // Pass validated number (or default 0)
    };

    console.log('Calling createMarket hook with params:', marketParams);

    setIsLocalSubmitting(true);
    setError(null);
    try {
      await createMarket(marketParams);
      localStorage.removeItem('marketFormData');
      alert('Market created successfully!');
      router.push('/');
    } catch (err) {
      console.error('Market creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create market');
    } finally {
      setIsLocalSubmitting(false);
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
      setMintAmount('');
      await refetchBalance();
      await refetchAllowance();
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

  // Button state based on current step and hook states
  const getButtonState = () => {
    let text = '...';
    let disabled = !isReady || !formData || tokenDecimals === null || isLocalSubmitting || isSimulating || isSubmitting || isConfirming;

    // Add check for market owner
    if (!isMarketOwner) {
      text = 'Only Market Owner Can Deploy';
      disabled = true;
    } else if (step === 'approve') {
      if (isConfirming) text = 'Confirming Approval...';
      else if (isSubmitting) text = 'Approving (Check Wallet)...';
      else if (isApproving) text = 'Preparing Approval...';
      else text = 'Approve Tokens';
    } else {
      if (isConfirming) text = 'Confirming Creation...';
      else if (isSubmitting) text = 'Creating (Check Wallet)...';
      else if (isSimulating) text = 'Simulating...';
      else text = 'Create Market';
    }

    return {
      text,
      onClick: step === 'approve' ? handleApprove : handleCreateMarket,
      disabled,
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {step === 'approve' ? 'Approve Tokens' : 'Create Market'}
      </h1>
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 p-3 rounded mb-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {!isMarketOwner && (
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 p-3 rounded mb-4 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400">
          <p className="mb-3">Only the market owner (0x6786...7FE4) can deploy markets. Current account is not authorized.</p>
          <a 
            href="https://t.me/silviobusonero" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Contact us if you'd like to deploy
          </a>
        </div>
      )}

      {mintSuccess && (
        <div className="bg-green-50 border border-green-400 text-green-700 p-3 rounded mb-4 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
          Tokens minted successfully!
        </div>
      )}
      
      {/* Mint Collateral Form */}
      {formData && tokenDecimals !== null && (
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Mint Collateral Tokens</h2>
          
          <div className="mb-3">
            <p className="text-muted-foreground mb-1">Current Balance:</p>
            <p className="text-foreground font-medium">{formattedBalance} tokens</p>
          </div>
          
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="mintAmount" className="block text-sm font-medium text-foreground mb-1">
                Amount to Mint
              </label>
              <input
                id="mintAmount"
                type="text"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-2 border border-input bg-background rounded focus:ring-ring focus:border-ring"
              />
            </div>
            <Button
              onClick={handleMintCollateral}
              disabled={isMintingCollateral || !isClientReady || !mintAmount}
              variant="secondary"
            >
              {isMintingCollateral ? 'Minting...' : 'Mint Tokens'}
            </Button>
          </div>
          
          <p className="mt-2 text-sm text-muted-foreground">
            Mint test tokens to use for creating your market.
          </p>
        </div>
      )}
      
      {/* Market summary */}
      {formData && (
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Market Summary</h2>
          
          <div className="space-y-4">
            <div>
              <span className="text-muted-foreground">Title:</span>
              <span className="text-foreground ml-2">{formData.title}</span>
            </div>
            
            <div>
              <span className="text-muted-foreground">Description:</span>
              <span className="text-foreground ml-2">{formData.description}</span>
            </div>
            
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <span className="text-foreground ml-2">{formData.duration} days</span>
            </div>
            
            <div>
              <span className="text-muted-foreground">Collateral:</span>
              <span className="text-foreground ml-2">{formData.collateralAmount} tokens ({tokenDecimals} decimals)</span>
            </div>
          </div>
          
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-foreground mb-4">
              You will receive <span className="font-semibold">{formData.collateralAmount} YES tokens</span> and 
              <span className="font-semibold"> {formData.collateralAmount} NO tokens</span> after market creation.
            </p>
            <p className="text-muted-foreground">
              These tokens represent your position in this prediction market. You can use them to add liquidity to the market or trade them.
            </p>
          </div>
        </div>
      )}
      
      {/* Main Action Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={buttonState.onClick}
          disabled={buttonState.disabled}
          className="w-full max-w-xs"
          size="lg"
        >
          {buttonState.text}
        </Button>
      </div>
      
      {tokenDecimals === null && formData && (
        <p className="mt-2 text-yellow-600 dark:text-yellow-400 text-sm">
          Loading token information...
        </p>
      )}
    </div>
  );
}