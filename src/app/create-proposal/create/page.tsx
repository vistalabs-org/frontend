// frontend/src/app/create-proposal/create/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { useCreateMarket } from '@/hooks/useCreateMarket';
import MockERC20Abi from '@/contracts/MockERC20.json';
import { PREDICTION_MARKET_HOOK_ADDRESS } from '@/app/constants';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// Define a type for the form data for better type safety
interface MarketFormData {
  title: string;
  description: string;
  duration: string; // Kept as string from previous form
  collateralAmount: string;
  collateralAddress: `0x${string}`; // Use viem Address type
  curveId: number;
}

export default function CreateMarketConfirmation() {
  const router = useRouter();
  const { address } = useAccount();
  const {
    approveTokens,
    createMarket,
    isApproving,      // Used for initial approval phase logic
    isSimulating,     // Used for simulation phase
    isSubmitting,     // Replaces isPending, indicates tx sent to wallet
    isConfirming,     // Indicates tx is confirming on-chain
    isReady           // General readiness check
  } = useCreateMarket();
  const [formData, setFormData] = useState<MarketFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'approve' | 'create'>('approve');

  // Load form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('marketFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Basic validation of parsed data structure
        if (parsedData && typeof parsedData === 'object' && parsedData.collateralAddress) {
          setFormData(parsedData as MarketFormData);
        } else {
           throw new Error("Invalid market data found in storage.");
        }
      } catch (e) {
        console.error("Failed to parse market data from localStorage:", e);
        setError("Failed to load market creation details.");
        // Consider redirecting if data is crucial and invalid
        // router.push('/create-proposal/kpi-market');
      }
    } else {
      // Redirect if no data found
      console.warn("No market form data found, redirecting back.");
      router.push('/create-proposal/kpi-market');
    }
  }, [router]);

  // Determine required collateral amount (ensure it's BigInt)
  const requiredCollateralBigInt = React.useMemo(() => {
    if (!formData?.collateralAmount) return BigInt(0);
    try {
      // Assume collateral uses 6 decimals (like USDC)
      return parseUnits(formData.collateralAmount, 6);
    } catch {
      console.error("Invalid collateral amount:", formData.collateralAmount);
      return BigInt(0);
    }
  }, [formData?.collateralAmount]);

  // Check allowance using useReadContract
  const { data: allowance, refetch: refetchAllowance, isError: isAllowanceError, error: allowanceError } = useReadContract({
    address: formData?.collateralAddress,
    abi: MockERC20Abi,
    functionName: 'allowance',
    // Ensure args are valid even if address/hook address are undefined initially
    args: [address ?? '0x0', PREDICTION_MARKET_HOOK_ADDRESS ?? '0x0'], 
    query: {
      enabled: !!address && !!formData?.collateralAddress && requiredCollateralBigInt > 0,
    }
  });

  // Effect to check if allowance is sufficient and update step
  useEffect(() => {
    if (allowance !== undefined && allowance !== null && requiredCollateralBigInt > 0) {
      console.log('Allowance check:', {
        allowance: allowance.toString(),
        requiredAmount: requiredCollateralBigInt.toString(),
        isEnough: BigInt(allowance.toString()) >= requiredCollateralBigInt
      });
      if (BigInt(allowance.toString()) >= requiredCollateralBigInt) {
        setStep('create');
      } else {
        setStep('approve'); // Ensure step is set back to approve if allowance becomes insufficient
      }
    }
  }, [allowance, requiredCollateralBigInt]);

  // Effect to handle allowance read error
  useEffect(() => {
      if (isAllowanceError) {
          setError(`Failed to check token allowance: ${allowanceError?.message || 'Unknown error'}`);
      }
  }, [isAllowanceError, allowanceError]);

  // Handle token approval
  const handleApprove = async () => {
    if (!isReady || !formData || !address || requiredCollateralBigInt <= 0) return;
    setError(null);

    try {
      await approveTokens(formData.collateralAddress, formData.collateralAmount);
      await refetchAllowance();
      // Step will automatically update via useEffect watching 'allowance'
    } catch (err) {
      console.error("Approval error:", err);
      setError(err instanceof Error ? err.message : 'Failed to approve tokens');
    }
  };

  // Handle market creation
  const handleCreateMarket = async () => {
    if (!isReady || !formData || step !== 'create') return;
    setError(null);

    try {
      const paramsForCreate = {
        ...formData,
        duration: parseInt(formData.duration, 10),
      };
      if (isNaN(paramsForCreate.duration)) {
         throw new Error("Invalid duration value.");
      }

      await createMarket(paramsForCreate);
      localStorage.removeItem('marketFormData'); // Clean up
      // TODO: Use Toast notification for success instead of alert
      alert('Market created successfully!'); 
      router.push('/');
    } catch (err) {
      console.error('Market creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create market');
    }
  };

  // Updated button logic using hook states
  const getButtonState = () => {
    let text = '...';
    // Combined conditions for disabling the button
    let disabled = !isReady || !formData || isApproving || isSimulating || isSubmitting || isConfirming;

    if (step === 'approve') {
      if (isConfirming) text = 'Confirming Approval...';
      else if (isSubmitting) text = 'Approving (Check Wallet)...';
      else if (isApproving) text = 'Preparing Approval...'; // Or just 'Approving...' if state is quick
      else text = 'Approve Tokens';
    } else { // step === 'create'
      if (isConfirming) text = 'Confirming Creation...';
      else if (isSubmitting) text = 'Creating (Check Wallet)...';
      else if (isSimulating) text = 'Simulating Creation...';
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
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === 'approve' ? 'Step 1: Approve Tokens' : 'Step 2: Create Market'}
          </CardTitle>
          <CardDescription>
            {step === 'approve' 
              ? 'Allow the contract to use your collateral tokens.'
              : 'Confirm the details and create your prediction market.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Market Summary Section */}
          {formData ? (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Market Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Title:</strong> {formData.title}</p>
                <p><strong>Description:</strong> {formData.description}</p>
                <p><strong>Duration:</strong> {formData.duration} days</p>
                <p><strong>Collateral:</strong> {formData.collateralAmount} USDC</p>
                
                <div className="pt-3 border-t">
                  <p className="font-medium">Token Distribution:</p>
                  <p className="text-muted-foreground">
                    You will receive <strong>{formData.collateralAmount} YES</strong> and <strong>{formData.collateralAmount} NO</strong> tokens after market creation.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center text-muted-foreground">Loading market details...</div>
          )}

          {/* Approval Status (Optional) */}
           {step === 'create' && (
             <Alert variant="default" className="border-green-500/50 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
               <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
               <AlertTitle className="text-green-800 dark:text-green-300">Tokens Approved</AlertTitle>
               <AlertDescription className="text-green-700 dark:text-green-400">
                 Sufficient allowance confirmed. You can now proceed to create the market.
               </AlertDescription>
             </Alert>
           )}

        </CardContent>
        <CardFooter>
          <Button
            onClick={buttonState.onClick}
            disabled={buttonState.disabled}
            className="w-full"
          >
            {(isApproving || isSimulating || isSubmitting || isConfirming) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {buttonState.text}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}