"use client";

export const runtime = 'edge';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useMarketWithPoolData } from '@/hooks/usePoolData';
import { formatUnits, zeroAddress } from 'viem';
import { useChainConfig } from '@/config';
import { Token } from '@uniswap/sdk-core'; // Import Token

// Import UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Info, ArrowLeft, HelpCircle } from 'lucide-react';

// Import custom hooks
import { useLiquidityCalculations } from '@/hooks/useLiquidityCalculations';
import { useV4Approvals } from '@/hooks/useV4Approvals';
import { useAddV4Liquidity } from '@/hooks/useAddV4Liquidity';
import { PoolKey } from '@uniswap/v4-sdk'; // Keep type for PoolKey structure

// --- Helper Functions ---
const formatBalance = (balance: any, decimals: number | undefined) => {
  // Ensure decimals is a number before proceeding
  if (decimals === undefined || !balance?.data?.value) {
    return '0.00';
  }
  try {
    // Handle potential bigint using toString before formatting
    return parseFloat(formatUnits(BigInt(balance.data.value.toString()), decimals)).toFixed(2);
  } catch (e) {
    console.error("[formatBalance] Error formatting:", e, { balance_data: balance?.data, decimals });
    return '0.00';
  }
};

// Simplified price formatting for display
const formatDisplayPrice = (pool: any) => {
    if (!pool?.price) return 'N/A';
    try {
        // Assuming pool.price is the price of YES/NO token in USDC (e.g., 0.6 for 60%)
        return `${(Number(pool.price) * 100).toFixed(1)}%`;
    } catch {
        return 'N/A';
    }
};
// --- End Helper Functions ---\

export default function AddLiquidityPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;
  const { address: userAddress } = useAccount();
  const chainId = useChainId(); // Get current chain ID
  // Get config for the current chain
  const config = useChainConfig();
  const positionManagerAddress = config.POSITION_MANAGER_ADDRESS; // Get address from config

  // Core state for pool selection
  const [selectedPool, setSelectedPool] = useState<'YES' | 'NO'>('YES');
  // Overall transaction error state (can be set by either hook)
  const [displayError, setDisplayError] = useState<string | null>(null);

  // Fetch market and pool data (including decimals)
  const { market: marketWithPools, yesPool, noPool, isLoading: marketLoading } = useMarketWithPoolData(marketId);

  // Determine current pool data based on selection
  const currentPoolDetails = useMemo(() => {
      // Now assuming yesPool/noPool include liquidity from the updated hook
      return selectedPool === 'YES' ? yesPool : noPool;
  }, [selectedPool, yesPool, noPool]);

  // Get token addresses and hook address
  const token0Address = marketWithPools?.collateralAddress as `0x${string}` | undefined;
  const token1Address = selectedPool === 'YES'
      ? marketWithPools?.yesToken as `0x${string}` | undefined
      : marketWithPools?.noToken as `0x${string}` | undefined;
  const hookAddress = marketWithPools?.yesPoolKey?.hooks as `0x${string}` | undefined;
  const token0Decimals = marketWithPools?.collateralDecimals;
  const token1Decimals = selectedPool === 'YES' ? marketWithPools?.yesTokenDecimals : marketWithPools?.noTokenDecimals;

  // --- Balances ---
  const usdcBalance = useBalance({
      address: userAddress,
      token: token0Address,
      query: { enabled: !!userAddress && !!token0Address }
  });
  const outcomeTokenBalance = useBalance({
      address: userAddress,
      token: token1Address,
      query: { enabled: !!userAddress && !!token1Address }
  });

  // --- Create Token Objects ---
  const currentToken0 = useMemo((): Token | null => {
      if (!chainId || !token0Address || token0Decimals === undefined) return null;
      try {
          // Using generic names for now, replace if specific symbols/names are available
          return new Token(chainId, token0Address, token0Decimals, 'USDC', 'USD Coin');
      } catch (e) { console.error("Error creating Token0:", e); return null; }
  }, [chainId, token0Address, token0Decimals]);

  const currentToken1 = useMemo((): Token | null => {
      if (!chainId) return null;
      const address = selectedPool === 'YES' ? marketWithPools?.yesToken : marketWithPools?.noToken;
      const decimals = selectedPool === 'YES' ? marketWithPools?.yesTokenDecimals : marketWithPools?.noTokenDecimals;
      const symbol = selectedPool === 'YES' ? 'YES' : 'NO';
      const name = selectedPool === 'YES' ? 'YES Token' : 'NO Token';

      if (!address || decimals === undefined) return null;
      try {
         return new Token(chainId, address as `0x${string}`, decimals, symbol, name);
      } catch (e) { console.error("Error creating Token1:", e); return null; }
  }, [chainId, selectedPool, marketWithPools?.yesToken, marketWithPools?.yesTokenDecimals, marketWithPools?.noToken, marketWithPools?.noTokenDecimals]);

  // --- Custom Hook Instantiation ---

  // 1. Liquidity Calculations Hook
  const {
    amount0,
    amount1,
    estimatedLiquidity,
    handleAmount0Change,
    setAmount0, // Get setter to reset on success if desired
  } = useLiquidityCalculations({
      poolData: currentPoolDetails ? {
        sqrtPriceX96: currentPoolDetails.sqrtPriceX96,
        decimals0: currentPoolDetails.decimals0,
        decimals1: currentPoolDetails.decimals1
      } : null,
  });

  // 2. Approvals Hook
  const {
    needsApproval,
    isApproving,
    isConfirming: isConfirmingApproval,
    approvalError,
    approve,
    approvalTxHash,
  } = useV4Approvals({
      token0Address,
      token1Address,
      token0Decimals,
      token1Decimals,
      amount0,
      amount1,
      hookAddress,
      positionManagerAddress: positionManagerAddress
  });

  // Callback for when adding liquidity succeeds
  const handleAddLiquiditySuccess = useCallback((finalTxHash: `0x${string}`) => {
      console.log(`Add liquidity successful callback triggered! Tx: ${finalTxHash}`);
      setAmount0(''); // Reset input using setter from calculation hook
      usdcBalance.refetch();
      outcomeTokenBalance.refetch();
      setDisplayError(null);
  }, [setAmount0, usdcBalance, outcomeTokenBalance]);

   // Prepare PoolKey for the add liquidity hook
   const currentPoolKey = useMemo((): PoolKey | null => {
       if (!marketWithPools || !chainId) return null; 
       const pkData = selectedPool === 'YES' ? marketWithPools.yesPoolKey : marketWithPools.noPoolKey;
       const collateralData = marketWithPools;

       // Check essential properties are present
       if (!pkData || !pkData.currency0 || !pkData.currency1 || pkData.hooks === undefined || pkData.hooks === null || pkData.fee === undefined || pkData.tickSpacing === undefined ||
           !collateralData.collateralAddress || collateralData.collateralDecimals === undefined ||
           (selectedPool === 'YES' && (!collateralData.yesToken || collateralData.yesTokenDecimals === undefined)) ||
           (selectedPool === 'NO' && (!collateralData.noToken || collateralData.noTokenDecimals === undefined)) ) {
            console.error("[currentPoolKey useMemo] Missing pkData or required properties for PoolKey/Token validation", { pkData, collateralData, selectedPool });
            return null;
       }

       const hooksRaw = pkData.hooks as string;
       if (!/^0x[a-fA-F0-9]{40}$/.test(hooksRaw)) {
           console.error("[currentPoolKey useMemo] pkData.hooks invalid format:", hooksRaw);
           return null;
       }
       const hooks = hooksRaw as `0x${string}`;

       try {
           // --- Internal Validation Step (Create temporary Token objects) --- 
           const collateralAddress = collateralData.collateralAddress as `0x${string}`;
           // Address check
           if (pkData.currency0.toLowerCase() !== collateralAddress.toLowerCase() && pkData.currency1.toLowerCase() !== collateralAddress.toLowerCase()) {
                console.error("[currentPoolKey useMemo] Collateral address mismatch", { marketCollateral: collateralAddress, pkCurrency0: pkData.currency0, pkCurrency1: pkData.currency1 });
                return null;
           }
           // Attempt Token creation (will throw if decimals are wrong)
           new Token(
               chainId,
               collateralAddress,
               collateralData.collateralDecimals, // Already checked for undefined above
               'CLTRL', // Placeholder symbol
               'Collateral' // Placeholder name
           );

           const token1Address = (selectedPool === 'YES' ? collateralData.yesToken : collateralData.noToken) as `0x${string}`;
           const token1Decimals = selectedPool === 'YES' ? collateralData.yesTokenDecimals : collateralData.noTokenDecimals;
           // Explicit undefined check for outcome decimals BEFORE using it
           if (token1Decimals === undefined) { 
               console.error("[currentPoolKey useMemo] Outcome token decimals are undefined.");
               return null;
           }
            // Address check
           if (pkData.currency0.toLowerCase() !== token1Address.toLowerCase() && pkData.currency1.toLowerCase() !== token1Address.toLowerCase()) {
                console.error("[currentPoolKey useMemo] Selected outcome token address mismatch", { selectedToken: token1Address, pkCurrency0: pkData.currency0, pkCurrency1: pkData.currency1 });
                return null;
           }
           // Attempt Token creation (will throw if decimals are wrong)
           new Token(
               chainId,
               token1Address,
               token1Decimals, // Checked above
               selectedPool === 'YES' ? 'YES' : 'NO', 
               selectedPool === 'YES' ? 'YES Token' : 'NO Token'
           );
           // --- End Internal Validation --- 

           console.log("[currentPoolKey useMemo] Internal token validation successful.");
           console.log("[currentPoolKey useMemo] Using hook address:", hooks);
           console.log("[currentPoolKey useMemo] Returning PoolKey with ADDRESS STRINGS:", { currency0: pkData.currency0, currency1: pkData.currency1, fee: pkData.fee, tickSpacing: pkData.tickSpacing, hooks });

           // Return PoolKey with ADDRESS STRINGS as required by consumer hook
           return {
               currency0: pkData.currency0 as `0x${string}`, // Use address string from pkData
               currency1: pkData.currency1 as `0x${string}`, // Use address string from pkData
               fee: pkData.fee,
               tickSpacing: pkData.tickSpacing,
               hooks: hooks,
           };
       } catch (error) {
            // Catch errors from new Token() constructor if chainId/address/decimals are invalid
            console.error("[currentPoolKey useMemo] Error during internal token validation (new Token creation failed):", error);
            return null;
       }
   }, [marketWithPools, selectedPool, chainId]); 

   // Prepare PoolState for the add liquidity hook (REINSTATED)
   const currentPoolState = useMemo(() => {
       // Check required fields are present and valid
       if (!currentPoolDetails || 
           currentPoolDetails.sqrtPriceX96 === undefined || 
           currentPoolDetails.tick === undefined || 
           currentPoolDetails.liquidity === undefined) { // Liquidity is now expected
           console.log("currentPoolState: Missing required details", { currentPoolDetails });
           return null;
       }
       // Ensure liquidity is bigint (it should be from useReadContract)
       if (typeof currentPoolDetails.liquidity !== 'bigint') {
            console.error("Pool liquidity is not a bigint:", currentPoolDetails.liquidity);
            return null; // Or attempt conversion if it might be a string/number
       }
        // Ensure sqrtPriceX96 is bigint
        if (typeof currentPoolDetails.sqrtPriceX96 !== 'bigint') {
            console.error("Pool sqrtPriceX96 is not a bigint:", currentPoolDetails.sqrtPriceX96);
            return null; 
        }
        // Ensure tick is number
        if (typeof currentPoolDetails.tick !== 'number') {
            console.error("Pool tick is not a number:", currentPoolDetails.tick);
            return null; 
        }

       console.log("currentPoolState: Preparing state object", currentPoolDetails);
       return {
           sqrtPriceX96: currentPoolDetails.sqrtPriceX96, 
           tick: currentPoolDetails.tick,                 
           liquidity: currentPoolDetails.liquidity // Directly use bigint from hook          
       };
   }, [currentPoolDetails]);

  // 3. Add Liquidity Hook - Pass poolState again
  const {
    addLiquidity,
    isAdding,
    isConfirming: isConfirmingAdd,
    addError,
    txHash: addLiquidityFinalTxHash
  } = useAddV4Liquidity({
      poolKey: currentPoolKey,
      poolState: currentPoolState,
      token0: currentToken0, // Pass Token object
      token1: currentToken1, // Pass Token object
      estimatedLiquidity,
      onSuccess: handleAddLiquiditySuccess,
  });

  // --- Combined Error Handling & State Update ---
  useEffect(() => {
      // Prioritize showing add error, then approval error
      if (addError) {
          setDisplayError(addError);
      } else if (approvalError) {
          setDisplayError(approvalError);
      } else {
          setDisplayError(null); // Clear if neither hook has an error
      }
  }, [approvalError, addError]);

  // --- Derived States for UI ---
  const isProcessing = isApproving || isConfirmingApproval || isAdding || isConfirmingAdd;
  const areAmountsValid = amount0 && parseFloat(amount0) > 0 && amount1 && parseFloat(amount1) > 0;

  return (
        <div className="max-w-screen-xl mx-auto py-6 px-4">
            <div className="mb-6">
                <Button variant="ghost" className="gap-2" onClick={() => router.push(`/${marketId}`)}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Market
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl mb-1">Add Liquidity</CardTitle>
                            <CardDescription>
                                Provide liquidity to earn fees. Enter the USDC amount.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Display Combined Error */}
                            {displayError && (
                                <Alert variant="destructive" className="mb-6">
                                    <AlertTitle>Transaction Error</AlertTitle>
                                    <AlertDescription>{displayError}</AlertDescription>
                                </Alert>
                            )}

                            {/* Display Confirmation Hashes/Success */}
                            {approvalTxHash && isConfirmingApproval && (
                                <Alert variant="default" className="mb-4">
                                    <AlertTitle>Approval Sent</AlertTitle>
                                    <AlertDescription>Tx: {approvalTxHash.slice(0,10)}...{approvalTxHash.slice(-6)}. Waiting for confirmation...</AlertDescription>
                                </Alert>
                            )}
                            {addLiquidityFinalTxHash && (
                                 <Alert variant="default" className="mb-4">
                                    <AlertTitle>Liquidity Added!</AlertTitle>
                                    <AlertDescription>Tx: {addLiquidityFinalTxHash.slice(0,10)}...{addLiquidityFinalTxHash.slice(-6)}.</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-4">
                                {/* Pool Selector */}
                                <div className="space-y-2">
                                    <Label>Select Pool</Label>
                                    <ToggleGroup
                                        type="single"
                                        value={selectedPool}
                                        onValueChange={(value) => {
                                            if (value) setSelectedPool(value as 'YES' | 'NO');
                                        }}
                                        className="grid grid-cols-2"
                                        disabled={marketLoading || isProcessing}
                                    >
                                        <ToggleGroupItem value="YES" aria-label="Select Yes Pool" className="data-[state=on]:bg-green-600 data-[state=on]:text-white" disabled={!yesPool}>
                                            Yes Pool
                                        </ToggleGroupItem>
                                        <ToggleGroupItem value="NO" aria-label="Select No Pool" className="data-[state=on]:bg-red-600 data-[state=on]:text-white" disabled={!noPool}>
                                            No Pool
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    {/* Amount 0 Input */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="amount0">USDC Amount</Label>
                                            <span className="text-sm text-muted-foreground">
                                                Balance: {formatBalance(usdcBalance, marketWithPools?.collateralDecimals)} USDC
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="amount0" type="text" inputMode="decimal"
                                                value={amount0}
                                                onChange={(e) => handleAmount0Change(e.target.value)} // Use handler from hook
                                                placeholder="0.0"
                                                className="pr-12"
                                                disabled={isProcessing || marketLoading}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground">USDC</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amount 1 Display (Derived) */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="amount1">{selectedPool} Token Amount (Estimated)</Label>
                                            <span className="text-sm text-muted-foreground">
                                                Balance: {formatBalance(outcomeTokenBalance, selectedPool === 'YES' ? marketWithPools?.yesTokenDecimals : marketWithPools?.noTokenDecimals)} {selectedPool}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="amount1" type="text" inputMode="decimal"
                                                value={amount1} // Display value from hook
                                                readOnly placeholder="0.0"
                                                className="pr-12 bg-muted/50" // Indicate read-only
                                                disabled={isProcessing || marketLoading}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground">{selectedPool}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Estimated LP Tokens */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="liquidityAmount">Estimated LP Tokens Received</Label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Approximate LP tokens based on current amounts and pool price. Assumes full range.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="liquidityAmount" type="text"
                                                value={estimatedLiquidity} // Display value from hook
                                                readOnly className="pr-12"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground">LP</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Price Display */}
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-muted-foreground">Current Pool Price ({selectedPool})</span>
                                            <span className="font-medium">{formatDisplayPrice(currentPoolDetails)}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Approximate rate based on current pool state.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            {/* SIMPLIFIED Button Logic: Show Approve ONLY if needsApproval is true */}
                            {needsApproval ? (
                                <Button
                                    className="w-full"
                                    onClick={approve}
                                    disabled={!areAmountsValid || isApproving || isConfirmingApproval || marketLoading}
                                >
                                    {(isApproving || isConfirmingApproval) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isConfirmingApproval ? "Confirming Approval..." : isApproving ? "Approving..." : "Approve Tokens"}
                                </Button>
                            ) : (
                                // Show Add Liquidity Button if needsApproval is false
                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        console.log("Add Liquidity button clicked! (needsApproval=false)");
                                        addLiquidity();
                                    }}
                                    disabled={!areAmountsValid || isAdding || isConfirmingAdd || marketLoading || needsApproval /* Double check needsApproval */}
                                >
                                    {(isAdding || isConfirmingAdd) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isConfirmingAdd ? "Confirming Liquidity..." : isAdding ? "Adding Liquidity..." : "Add Liquidity"}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>

                {/* Side Panel */}
                <div className="lg:col-span-1">
                    <div className="sticky top-20 space-y-6">
                        {/* Balances Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Your Balances</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">USDC:</span>
                                        <span>{formatBalance(usdcBalance, marketWithPools?.collateralDecimals)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{selectedPool} Tokens:</span>
                                        <span>{formatBalance(outcomeTokenBalance, selectedPool === 'YES' ? marketWithPools?.yesTokenDecimals : marketWithPools?.noTokenDecimals)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Info Alert */}
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Adding Liquidity</AlertTitle>
                            <AlertDescription>
                                You receive LP tokens representing your position. Ensure amounts respect the price to provide active liquidity.
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </div>
        </div>
    );
}