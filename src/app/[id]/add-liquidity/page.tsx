"use client";

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useBalance, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useMarketWithPoolData } from '@/hooks/usePoolData';
import { formatUnits, parseUnits, encodeAbiParameters, encodePacked, parseAbiParameters } from 'viem';
import { PositionManagerABI } from '@/contracts/PositionManagerABI';
import { POSITION_MANAGER_ADDRESS } from '@/app/constants';
import JSBI from 'jsbi';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';
import { getPublicClient } from '@wagmi/core';
import { wagmiConfig } from '@/app/providers';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Loader2, ShieldAlert, BarChart, Clock, ThumbsUp, MessageSquare, Info, ArrowLeft, HelpCircle } from 'lucide-react';

// Constants from Uniswap
const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
const MAX_UINT256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

// Define Action constants (matching typical V4 examples)
const Actions = {
    MINT_POSITION: 1,
    SETTLE_PAIR: 2,
    // Add others if needed
};

// --- Helper Functions ---
const formatBalance = (balance: any, decimals = 18) => {
    if (!balance?.value) return '0.00';
    try {
        return parseFloat(formatUnits(balance.value, decimals)).toFixed(2);
    } catch {
      return '0.00';
    }
  };

const formatPrice = (pool: any) => {
    if (!pool?.price) return 'N/A';
    try {
        const priceAsNumber = Number(pool.price);
        if (isNaN(priceAsNumber)) return 'N/A';
        return `${(priceAsNumber * 100).toFixed(1)}`; // Percentage without '%' sign for calculations
    } catch {
        return 'N/A';
    }
};

// --- End Helper Functions ---

export default function AddLiquidityPage() {
    const params = useParams();
    const router = useRouter();
    const marketId = params.id as string;
    const { address: userAddress } = useAccount();
    
    // Add back missing state variables
    const [selectedPool, setSelectedPool] = useState<'YES' | 'NO'>('YES');
    const [amount0, setAmount0] = useState<string>('');
    const [amount1, setAmount1] = useState<string>('');
    const [liquidityAmount, setLiquidityAmount] = useState<string>('0');
    const [needsApproval, setNeedsApproval] = useState<boolean>(false);
    const [isApproving, setIsApproving] = useState<boolean>(false);
    const [isAddingLiquidity, setIsAddingLiquidity] = useState<boolean>(false);
    const [txError, setTxError] = useState<string | null>(null);

    // Fetch market data including pool info
    const { market: marketWithPools, yesPool, noPool, isLoading: marketLoading } = useMarketWithPoolData(marketId);

    // Get token addresses
    const usdcAddress = marketWithPools?.collateralAddress as `0x${string}` | undefined;
    const outcomeTokenAddress = selectedPool === 'YES'
        ? marketWithPools?.yesToken as `0x${string}` | undefined
        : marketWithPools?.noToken as `0x${string}` | undefined;

    // Get USDC balance
    const usdcBalance = useBalance({
        address: userAddress,
        token: usdcAddress,
    });

    // Get YES/NO token balance
    const outcomeTokenBalance = useBalance({
        address: userAddress,
        token: outcomeTokenAddress,
    });

    // --- Allowance Hooks with Refetch ---
    const { data: usdcAllowance, refetch: refetchUsdcAllowance } = useReadContract({
        address: usdcAddress,
        abi: MockERC20Abi,
        functionName: 'allowance',
        args: userAddress && POSITION_MANAGER_ADDRESS ? [userAddress, POSITION_MANAGER_ADDRESS] : undefined,
        query: {
            enabled: !!userAddress && !!usdcAddress && !!POSITION_MANAGER_ADDRESS,
        }
    });

    const { data: outcomeTokenAllowance, refetch: refetchOutcomeTokenAllowance } = useReadContract({
        address: outcomeTokenAddress,
        abi: MockERC20Abi,
        functionName: 'allowance',
        args: userAddress && POSITION_MANAGER_ADDRESS ? [userAddress, POSITION_MANAGER_ADDRESS] : undefined,
        query: {
            enabled: !!userAddress && !!outcomeTokenAddress && !!POSITION_MANAGER_ADDRESS,
        }
    });
    // --- End Allowance Hooks ---

    // --- Write Contract Hooks ---
    const { data: approveTxHash, writeContract: approveWriteContract } = useWriteContract();
    const { data: addLiquidityTxHash, writeContract: addLiquidityWriteContract } = useWriteContract();
    // --- End Write Contract Hooks ---

    // --- Approval Transaction Waiting Hook ---
    const { isLoading: isConfirmingApproval, isSuccess: isApprovalConfirmed } = 
        useWaitForTransactionReceipt({ hash: approveTxHash });

    // Refetch allowances after approval is confirmed
  useEffect(() => {
        if (isApprovalConfirmed) {
            console.log('Approval confirmed, refetching allowances...');
    refetchUsdcAllowance();
    refetchOutcomeTokenAllowance();
            setIsApproving(false); // Reset approving state
        }
    }, [isApprovalConfirmed, refetchUsdcAllowance, refetchOutcomeTokenAllowance]);
    // --- End Approval Transaction Waiting Hook ---

    // --- Liquidity Transaction Waiting Hook ---
    const { isLoading: isConfirmingAddLiquidity, isSuccess: isAddLiquidityConfirmed } = 
        useWaitForTransactionReceipt({ hash: addLiquidityTxHash });

    useEffect(() => {
        if (isConfirmingAddLiquidity) {
            console.log('Waiting for add liquidity transaction confirmation...');
        }
        if (isAddLiquidityConfirmed) {
            console.log('Add liquidity transaction confirmed!');
            // Optionally refetch balances or navigate user
            setAmount0(''); // Clear inputs on success
            setAmount1('');
            setLiquidityAmount('0');
            usdcBalance.refetch(); // Refetch balances
            outcomeTokenBalance.refetch();
            setIsAddingLiquidity(false); // Reset adding state
        }
    }, [isConfirmingAddLiquidity, isAddLiquidityConfirmed, usdcBalance, outcomeTokenBalance]);
    // --- End Liquidity Transaction Waiting Hook ---

    // Determine if approval is needed
    useEffect(() => {
        const checkApproval = () => {
            // Assume 6 decimals for USDC, 18 for outcome tokens (adjust if different)
            const usdcDecimals = 6; 
            const outcomeDecimals = 18; 

            if (!usdcAddress || !outcomeTokenAddress || (!amount0 && !amount1)) {
      setNeedsApproval(false);
      return;
    }

            let usdcNeeded = BigInt(0);
            try {
                if (amount0) usdcNeeded = parseUnits(amount0, usdcDecimals);
            } catch { /* ignore parsing errors */ }

            let outcomeNeeded = BigInt(0);
            try {
                if (amount1) outcomeNeeded = parseUnits(amount1, outcomeDecimals);
            } catch { /* ignore parsing errors */ }


            const usdcApproved = usdcAllowance ? BigInt(usdcAllowance.toString()) : BigInt(0);
            const outcomeApproved = outcomeTokenAllowance ? BigInt(outcomeTokenAllowance.toString()) : BigInt(0);

            const requiresUsdcApproval = usdcNeeded > 0 && usdcApproved < usdcNeeded;
            const requiresOutcomeApproval = outcomeNeeded > 0 && outcomeApproved < outcomeNeeded;

            console.log('Approval Check:', { requiresUsdcApproval, requiresOutcomeApproval, usdcApproved, outcomeApproved, usdcNeeded, outcomeNeeded });
            setNeedsApproval(requiresUsdcApproval || requiresOutcomeApproval);
        };

        checkApproval();
    }, [amount0, amount1, usdcAllowance, outcomeTokenAllowance, usdcAddress, outcomeTokenAddress]); // Added dependencies

    // --- NEW useEffect for Strategy A --- 
    // Auto-calculate amount1 when amount0 changes
    useEffect(() => {
        const pool = selectedPool === 'YES' ? yesPool : noPool;
        // Only calculate if amount0 is valid and pool data exists
        if (amount0 && parseFloat(amount0) > 0 && pool?.sqrtPriceX96) {
            const calculatedAmount1 = calculateAmount1(amount0, pool.sqrtPriceX96);
            setAmount1(calculatedAmount1);
            // Also recalculate estimated liquidity if both amounts are now present
            if (calculatedAmount1) {
                const liquidity = calculateLiquidity(amount0, calculatedAmount1);
                setLiquidityAmount(liquidity);
            }
        } else if (!amount0) {
            // Clear amount1 and liquidity if amount0 is cleared
            setAmount1('');
            setLiquidityAmount('0');
        }
    }, [amount0, selectedPool, yesPool, noPool]); // Dependencies: recalculate if amount0 or selected pool changes
    // --- End NEW useEffect --- 

    // Handle Approve
  const handleApprove = async () => {
    setIsApproving(true);
    setTxError(null);
        try {
            const usdcDecimals = 6;
            const outcomeDecimals = 18;
            const usdcNeeded = amount0 ? parseUnits(amount0, usdcDecimals) : BigInt(0);
            const outcomeNeeded = amount1 ? parseUnits(amount1, outcomeDecimals) : BigInt(0);
            const usdcApproved = usdcAllowance ? BigInt(usdcAllowance.toString()) : BigInt(0);
            const outcomeApproved = outcomeTokenAllowance ? BigInt(outcomeTokenAllowance.toString()) : BigInt(0);

            let tokenToApprove: `0x${string}` | undefined;
            let tokenName: string = '';

            if (usdcNeeded > 0 && usdcApproved < usdcNeeded) {
                tokenToApprove = usdcAddress;
                tokenName = 'USDC';
            } else if (outcomeNeeded > 0 && outcomeApproved < outcomeNeeded) {
                tokenToApprove = outcomeTokenAddress;
                tokenName = `${selectedPool} Token`;
            }

            if (tokenToApprove) {
                console.log(`Approving ${tokenName} (${tokenToApprove})...`);
                approveWriteContract({
                    address: tokenToApprove,
          abi: MockERC20Abi,
          functionName: 'approve',
                    args: [POSITION_MANAGER_ADDRESS, MAX_UINT256]
                });
            } else {
                console.log("No approval needed or already approved.");
                setIsApproving(false); // Should not happen if button is shown, but good fallback
            }
            // Resetting isApproving happens in the useEffect hook for isApprovalConfirmed

    } catch (error) {
            console.error('Error initiating approval:', error);
      setIsApproving(false);
            setTxError(`Failed to initiate approval: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

    // Handle adding liquidity (using addLiquidityWriteContract)
  const handleAddLiquidity = async () => {
        if (!marketWithPools || !userAddress || marketLoading) {
            setTxError('Market data not available or still loading');
      return;
    }
    
    setIsAddingLiquidity(true);
    setTxError(null);
    
    try {
            const poolKeyData = selectedPool === 'YES' 
        ? marketWithPools.yesPoolKey 
        : marketWithPools.noPoolKey;
      
            if (!poolKeyData || !poolKeyData.currency0 || !poolKeyData.currency1 || !poolKeyData.hooks) {
                setTxError(`${selectedPool} pool key data incomplete`);
        setIsAddingLiquidity(false);
        return;
      }
      
            const abiCompatiblePoolKey = {
                currency0: poolKeyData.currency0 as `0x${string}`,
                currency1: poolKeyData.currency1 as `0x${string}`,
                fee: poolKeyData.fee ?? 500,
                tickSpacing: poolKeyData.tickSpacing ?? 10,
                hooks: poolKeyData.hooks as `0x${string}`
            };

            console.log("Using pool key:", abiCompatiblePoolKey);

            const tickLower = -207000;
            const tickUpper = 207000;
            
            let liquidityDeltaBigInt: bigint;
            try {
                liquidityDeltaBigInt = amount0 ? parseUnits(amount0, 18) : BigInt(0);
                if (liquidityDeltaBigInt <= 0) throw new Error("Liquidity must be positive");
            } catch(e) {
                setTxError(`Invalid liquidity amount calculation: ${e instanceof Error ? e.message : String(e)}`);
                setIsAddingLiquidity(false);
                return;
            }
            
            const actions = encodePacked(['uint8', 'uint8'], [Actions.MINT_POSITION, Actions.SETTLE_PAIR]);
            
            const mintParams = encodeAbiParameters(
                [
                    { name: 'mintCallParams', type: 'tuple', components: [
                        { name: 'poolKey', type: 'tuple', components: [
                            { name: 'currency0', type: 'address' }, { name: 'currency1', type: 'address' },
                            { name: 'fee', type: 'uint24' }, { name: 'tickSpacing', type: 'int24' },
                            { name: 'hooks', type: 'address' }]},
                        { name: 'tickLower', type: 'int24' }, { name: 'tickUpper', type: 'int24' },
                        { name: 'liquidity', type: 'uint128' }, { name: 'amount0Max', type: 'uint256' },
                        { name: 'amount1Max', type: 'uint256' }, { name: 'recipient', type: 'address' },
                        { name: 'hookData', type: 'bytes' } ]}
                ] as const,
                [{
                    poolKey: abiCompatiblePoolKey, tickLower: tickLower, tickUpper: tickUpper,
                    liquidity: liquidityDeltaBigInt,
                    amount0Max: BigInt(MAX_UINT256),
                    amount1Max: BigInt(MAX_UINT256),
                    recipient: userAddress,
                    hookData: '0x'
                }]
            );

            const settleParams = encodeAbiParameters(
                parseAbiParameters('address currency0, address currency1'),
                [abiCompatiblePoolKey.currency0, abiCompatiblePoolKey.currency1]
            );
            
            const encodedUnlockData = encodeAbiParameters(
                parseAbiParameters('bytes actions, bytes[] params'),
                [actions, [mintParams, settleParams]]
            );

            const deadline = BigInt(Math.floor(Date.now() / 1000) + 60);

            console.log('Simulating modifyLiquidities with:', { encodedUnlockData, deadline });
            console.log('>>> TARGET ADDRESS FOR SIMULATION:', POSITION_MANAGER_ADDRESS);

            const { request } = await getPublicClient(wagmiConfig).simulateContract({
                account: userAddress,
                address: POSITION_MANAGER_ADDRESS,
                abi: PositionManagerABI,
                functionName: 'modifyLiquidities',
                args: [ encodedUnlockData, deadline ],
            });
            
            console.log('Simulation successful, sending transaction');
            addLiquidityWriteContract(request);
    } catch (error) {
      console.error('Error adding liquidity:', error);
      setIsAddingLiquidity(false);
            const message = error instanceof Error ? error.message : String(error);
            const revertReasonMatch = message.match(/execution reverted(?: with reason)?:?\s*\"(.*?)\"|execution reverted/i);
            const rawErrorMatch = message.match(/Raw error: (.*?)\"/i);
            const shortMessage = revertReasonMatch ? revertReasonMatch[1] : (rawErrorMatch ? rawErrorMatch[1] : 'Transaction failed. Check console.');
            setTxError(`Failed to add liquidity: ${shortMessage || 'Unknown error'}`);
        }
    };

    // Update liquidity amount when inputs change
    useEffect(() => {
        if (amount0 && amount1) {
            const liquidity = calculateLiquidity(amount0, amount1);
            setLiquidityAmount(liquidity);
        }
    }, [amount0, amount1, yesPool]);

    // Input Handlers
    const handleAmount0Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount0(value);
        }
    };

    const handleAmount1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        // This handler might not be needed anymore if input is readOnly, 
        // but keep it for now in case we revert.
        const value = e.target.value.replace(/[^0-9.]/g, '');
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            // setAmount1(value); // Don't set state directly if readOnly
            // setAmount0(''); // Remove the line clearing amount0
            // setLiquidityAmount('0'); 
        }
    };

    // --- Calculation Helpers (Moved Inside Component Scope) ---
    const calculateAmount1 = (inputAmount0: string, sqrtPriceX96: bigint | undefined): string => {
        if (!inputAmount0 || !sqrtPriceX96 || sqrtPriceX96 === BigInt(0)) return '';
        try {
            const amount0Num = parseFloat(inputAmount0);
            if (isNaN(amount0Num) || amount0Num <= 0) return '';

            // Calculate price of token1 (Outcome) in terms of token0 (USDC)
            const sqrtPriceNum = Number(sqrtPriceX96) / (2**96);
            const priceOfToken1InToken0 = sqrtPriceNum * sqrtPriceNum;

            if (isNaN(priceOfToken1InToken0) || priceOfToken1InToken0 <= 0) return '';

            // amount1 = amount0 * price
            const estimatedAmount1 = amount0Num * priceOfToken1InToken0;

            return estimatedAmount1 > 0 ? estimatedAmount1.toFixed(4) : '0.00'; // Adjust precision as needed
        } catch (error) {
            console.error("Error calculating amount1:", error);
            return '';
        }
    };

    function maxLiquidityForAmount0Precise(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, amount0: string): JSBI {
        if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }
        
        const numerator = JSBI.multiply(
            JSBI.multiply(JSBI.BigInt(amount0), sqrtRatioAX96), 
            sqrtRatioBX96
        );
        const denominator = JSBI.multiply(Q96, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96));
        
        return JSBI.divide(numerator, denominator);
    }
    
    function maxLiquidityForAmount1(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, amount1: string): JSBI {
        if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }
        
        return JSBI.divide(
            JSBI.multiply(JSBI.BigInt(amount1), Q96), 
            JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)
        );
    }
    
    function maxLiquidityForAmounts(
        sqrtRatioCurrentX96: JSBI,
        sqrtRatioAX96: JSBI,
        sqrtRatioBX96: JSBI,
        amount0Str: string,
        amount1Str: string
    ): JSBI {
        if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }
        
        if (JSBI.lessThanOrEqual(sqrtRatioCurrentX96, sqrtRatioAX96)) {
            return maxLiquidityForAmount0Precise(sqrtRatioAX96, sqrtRatioBX96, amount0Str);
        } else if (JSBI.lessThan(sqrtRatioCurrentX96, sqrtRatioBX96)) {
            const liquidity0 = maxLiquidityForAmount0Precise(sqrtRatioCurrentX96, sqrtRatioBX96, amount0Str);
            const liquidity1 = maxLiquidityForAmount1(sqrtRatioAX96, sqrtRatioCurrentX96, amount1Str);
            return JSBI.lessThan(liquidity0, liquidity1) ? liquidity0 : liquidity1;
        } else {
            return maxLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1Str);
        }
    }

    const calculateLiquidity = (inputAmount0: string, inputAmount1: string): string => {
        if (!inputAmount0 || !inputAmount1) return '0';
        
        try {
            // For full range (min to max ticks), we use the minimum and maximum sqrt prices
            // Min tick corresponds to price of 0, max tick to price of infinity
            // In practice, we use very small and very large numbers
            const minSqrtPrice = JSBI.BigInt(1); // Close to 0
            const maxSqrtPrice = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)); // Very large
            
            // Current price in sqrt Q96 format
            const price = getCurrentPriceAsNumber();
            if (price <= 0) return '0';
            
            // Convert price to sqrt price in Q96 format
            const sqrtPrice = JSBI.BigInt(Math.floor(Math.sqrt(price) * 2**96));
            
            // Convert amounts to BigInt (assuming 18 decimals for simplicity)
            // In a real implementation, you'd use the actual token decimals
            const amt0 = parseFloat(inputAmount0) * 10**18;
            const amt1 = parseFloat(inputAmount1) * 10**18;
            
            // Calculate liquidity
            const liquidity = maxLiquidityForAmounts(
                sqrtPrice,
                minSqrtPrice,
                maxSqrtPrice,
                amt0.toString(),
                amt1.toString()
            );
            
            // Convert back to a readable format
            return (Number(liquidity.toString()) / 10**18).toFixed(6);
        } catch (error) {
            console.error('Error calculating liquidity:', error);
            return '0';
        }
    };

    const getCurrentPrice = () => {
        const pool = selectedPool === 'YES' ? yesPool : noPool;
        return formatPrice(pool);
    };

    const getCurrentPriceAsNumber = (): number => {
        const pool = selectedPool === 'YES' ? yesPool : noPool;
        if (!pool?.price) return 0;
        try {
            const priceAsNumber = Number(pool.price);
            const token0Price = 1 / priceAsNumber;
            return token0Price;
        } catch (error) {
            console.error('Error getting price as number:', error);
            return 0;
        }
    };
    // --- End Calculation Helpers ---

    // --- Button Logic ---
    const getButtonState = () => {
        if (!userAddress) return { text: "Connect Wallet", onClick: () => {}, disabled: true };
        
        // Check if amounts are valid numbers > 0
        const isValidAmount0 = amount0 && parseFloat(amount0) > 0;
        const isValidAmount1 = amount1 && parseFloat(amount1) > 0;
        const areAmountsValid = isValidAmount0 && isValidAmount1; // Require both for now

    if (needsApproval) {
      return {
                text: isApproving ? (isConfirmingApproval ? "Confirming Approval..." : "Approving...") : "Approve Tokens",
                onClick: handleApprove,
                // Disable approve if amounts are invalid, or if already approving/confirming
                disabled: !areAmountsValid || isApproving || isConfirmingApproval 
            };
        }
        
    return {
            text: isAddingLiquidity ? (isConfirmingAddLiquidity ? "Confirming Liquidity..." : "Adding Liquidity...") : "Add Liquidity",
            onClick: handleAddLiquidity,
            // Disable add if amounts are invalid, or if adding/confirming
            disabled: !areAmountsValid || isAddingLiquidity || isConfirmingAddLiquidity 
        };
    };
  const buttonState = getButtonState();
    // --- End Button Logic ---

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
                        <CardHeader className="flex flex-row items-start gap-4">
                            <div className="flex-1">
                                <CardTitle className="text-2xl mb-1">Add Liquidity</CardTitle>
                                <CardDescription>
                                    Provide liquidity to earn fees. Enter amounts for both tokens.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
        {txError && (
                                <Alert variant="destructive" className="mb-6">
                                    <AlertTitle>Transaction Error</AlertTitle>
                                    <AlertDescription>{txError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Select Pool</Label>
                                    <ToggleGroup
                                        type="single"
                                        value={selectedPool}
                                        onValueChange={(value) => { if (value) setSelectedPool(value as 'YES' | 'NO'); }}
                                        className="grid grid-cols-2"
                                        disabled={marketLoading} // Disable if market is loading
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
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="amount0">USDC Amount</Label>
                                            <span className="text-sm text-muted-foreground">
                                                Balance: {formatBalance(usdcBalance, 6)} USDC
                                            </span>
              </div>
                                        <div className="relative">
                                            <Input
                                                id="amount0"
                                                type="text"
                                                inputMode="decimal"
                value={amount0}
                onChange={handleAmount0Change}
                                                placeholder="0.0"
                                                className="pr-12"
                                                disabled={isApproving || isConfirmingApproval || isAddingLiquidity || isConfirmingAddLiquidity}
              />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground">USDC</span>
              </div>
            </div>
          </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="amount1">{selectedPool} Token Amount</Label>
                                            <span className="text-sm text-muted-foreground">
                                                Balance: {formatBalance(outcomeTokenBalance, 18)} {selectedPool}
                                            </span>
              </div>
                                        <div className="relative">
                                            <Input
                                                id="amount1"
                                                type="text"
                                                inputMode="decimal"
                value={amount1}
                readOnly
                placeholder="0.0"
                className="pr-12 bg-muted/50"
                disabled={isApproving || isConfirmingApproval || isAddingLiquidity || isConfirmingAddLiquidity}
              />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground">{selectedPool}</span>
              </div>
            </div>
          </div>
          
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="liquidityAmount">Estimated LP Tokens Received</Label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Placeholder value. Actual LP tokens depend on amounts, price, and range.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="liquidityAmount"
                                                type="text"
                                                value={liquidityAmount}
                                                readOnly
                                                className="pr-12"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground">LP</span>
            </div>
            </div>
          </div>
          
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-muted-foreground">Current Pool Price ({selectedPool})</span>
                                            <span className="font-medium">{getCurrentPrice()}%</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Approximate rate based on current pool state.
            </div>
            </div>
          </div>
        </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={buttonState.onClick}
          disabled={buttonState.disabled}
        >
                                {(isApproving || isConfirmingApproval || isAddingLiquidity || isConfirmingAddLiquidity) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
          {buttonState.text}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-20 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Your Balances</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">USDC:</span>
                                        <span>{formatBalance(usdcBalance, 6)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{selectedPool} Tokens:</span>
                                        <span>{formatBalance(outcomeTokenBalance, 18)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Adding Liquidity</AlertTitle>
                            <AlertDescription>
                                You will receive LP (ERC721) tokens representing your position. Ensure your entered amounts respect the current pool price to avoid providing liquidity out of range.
                            </AlertDescription>
                        </Alert>
                    </div>
        </div>
      </div>
    </div>
  );
}