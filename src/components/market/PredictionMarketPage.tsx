"use client"
import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import SwapFunction from '@/components/SwapFunction';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Token0AmountChart, { CombinedChartDataPoint } from '@/components/charts/LiquidityChart';
import { usePoolsTvlAmounts } from '@/hooks/usePoolLiquidityHistory';
import { usePoolSwapHistory, SwapDeltaDataPoint } from '@/hooks/usePoolSwapHistory';

// --- Import Shadcn UI Components ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldAlert, BarChart, Clock, ThumbsUp, MessageSquare, Info } from 'lucide-react';

// TokenBalances Component using Shadcn structure
const TokenBalances = ({ collateralBalance, yesBalance, noBalance }: {
  collateralBalance?: string;
  yesBalance?: string;
  noBalance?: string;
}) => {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">USDC:</span>
        <span>{collateralBalance || '0.00'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Yes Tokens:</span>
        <span>{yesBalance || '0.00'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">No Tokens:</span>
        <span>{noBalance || '0.00'}</span>
      </div>
    </div>
  );
};

// Helper to format potentially large numbers
const formatTvlAmount = (value: number | undefined | null) => {
  if (value === null || value === undefined) return '0.00';
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
};

// PriceDisplay Component using Shadcn structure
const PriceDisplay = ({ 
  yesPool, 
  noPool, 
  marketId, 
  poolsTvlData, 
  isLoadingPoolsTvl, 
  isErrorPoolsTvl 
}: {
  yesPool: any;
  noPool: any;
  marketId: string;
  poolsTvlData: { yes?: { tvlToken0: number; tvlToken1: number; }, no?: { tvlToken0: number; tvlToken1: number; } } | null | undefined;
  isLoadingPoolsTvl: boolean;
  isErrorPoolsTvl: boolean;
}) => {
  const formatPricePercent = (pool: any) => {
    if (pool?.price === undefined || pool?.price === null) return 'N/A';
    try {
      const priceAsNumber = Number(pool.price);
      if (isNaN(priceAsNumber)) return 'N/A';
      return `${(priceAsNumber * 100).toFixed(1)}%`;
    } catch (error) {
      console.error('Error formatting price:', error);
      return 'N/A';
    }
  };

  const formatLiquidity = (liquidity: any) => {
     if (liquidity === undefined || liquidity === null) return '0';
     try {
       // Format BigInt liquidity - adjust as needed (e.g., using formatUnits)
       return BigInt(liquidity).toLocaleString(); 
     } catch {
       return '0';
     }
  }

  let totalLiquidity = BigInt(0);
  try {
     const yesLiq = yesPool?.liquidity ? BigInt(yesPool.liquidity) : BigInt(0);
     const noLiq = noPool?.liquidity ? BigInt(noPool.liquidity) : BigInt(0);
     totalLiquidity = yesLiq + noLiq;
  } catch {}

  const yesPriceFormatted = formatPricePercent(yesPool);
  const noPriceFormatted = formatPricePercent(noPool);

  // Helper to display loading/error/data for TVL
  const renderTvlInfo = (poolTvlData: { tvlToken0: number; tvlToken1: number; } | undefined) => {
    if (isLoadingPoolsTvl) {
      return <div className="text-xs text-muted-foreground mt-1">Loading amounts...</div>;
    }
    if (isErrorPoolsTvl) {
      return <div className="text-xs text-red-500 mt-1">Error</div>;
    }
    if (poolTvlData) {
      return (
        <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
          <div>T0: <span className="font-medium text-foreground">{formatTvlAmount(poolTvlData.tvlToken0)}</span></div>
          <div>T1: <span className="font-medium text-foreground">{formatTvlAmount(poolTvlData.tvlToken1)}</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex justify-around items-center mb-4">
        <div className="text-center flex-1 px-2">
          <div className={`text-3xl font-bold ${yesPriceFormatted !== 'N/A' ? 'text-green-600' : 'text-muted-foreground'} mb-1`}>
            {yesPriceFormatted}
          </div>
          <div className="text-sm text-muted-foreground">Yes</div>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <div className="text-center flex-1 px-2">
          <div className={`text-3xl font-bold ${noPriceFormatted !== 'N/A' ? 'text-red-600' : 'text-muted-foreground'} mb-1`}>
            {noPriceFormatted}
          </div>
          <div className="text-sm text-muted-foreground">No</div>
        </div>
      </div>

      <Separator className="my-4" />

      <div>
        <div className="mb-2 flex justify-center items-center gap-2">
          <h4 className="text-sm font-medium text-center text-muted-foreground">Pool Liquidity & Token Amounts</h4>
          <Link href={`${marketId}/add-liquidity`} className="text-xs text-primary hover:underline">
            + Add Liquidity
          </Link>
        </div>
        <div className="flex justify-around items-start text-center">
          <div className="flex-1">
            <div className="text-lg font-medium text-foreground">
              {formatLiquidity(yesPool?.liquidity)}
            </div>
            <div className="text-xs text-muted-foreground">Yes Pool Liquidity</div>
            {renderTvlInfo(poolsTvlData?.yes)}
          </div>
          <div className="flex-1">
            <div className="text-lg font-medium text-foreground">
              {formatLiquidity(noPool?.liquidity)}
            </div>
            <div className="text-xs text-muted-foreground">No Pool Liquidity</div>
            {renderTvlInfo(poolsTvlData?.no)}
          </div>
        </div>
      </div>
    </>
  );
};

// Define the expected shape of tokenBalance from SwapFunction hook
interface SwapTokenBalances {
  collateral: string;
  yes: string;
  no: string;
}

// Define structure for comment data for clarity
interface CommentData {
  username: string;
  avatar?: string;
  position?: string; // e.g., "Yes $100"
  time: string;
  content: string;
}

// Define props including chainId
interface PredictionMarketPageProps {
  marketData: any;
  yesPool: any;
  noPool: any;
  endTimestamp: any;
  marketId: string;
  chainId?: number; // Add chainId prop
  mintCollateralButton: React.ReactNode;
}

// --- Helper function to calculate history from deltas ---
const calculateHistory = (
  currentTvl: number | undefined,
  deltas: SwapDeltaDataPoint[] | undefined
): { timestamp: number; total: number }[] => {
  if (currentTvl === undefined || !deltas) {
    return [];
  }
  const history: { timestamp: number; total: number }[] = [];
  let runningTotal = currentTvl;
  history.push({ timestamp: Date.now(), total: runningTotal });
  for (let i = deltas.length - 1; i >= 0; i--) {
    const swap = deltas[i];
    runningTotal -= swap.amount0Delta;
    history.push({ timestamp: swap.timestamp, total: runningTotal });
  }
  return history.reverse();
};
// --- End Helper function ---

const PredictionMarketPage = ({ 
  marketData, 
  yesPool, 
  noPool, 
  endTimestamp, 
  marketId,
  chainId, // Destructure chainId
  mintCollateralButton
}: PredictionMarketPageProps) => { // Use typed props
  const [selectedAction, setSelectedAction] = React.useState<'Buy' | 'Sell'>('Buy');
  const [selectedOption, setSelectedOption] = React.useState<'Yes' | 'No'>('Yes');
  const [amount, setAmount] = React.useState('');
  const { isConnected } = useAccount();
  const router = useRouter();

  // --- Construct Prefixed Pool IDs ---
  const prefixedYesPoolId = React.useMemo(() => {
    console.log(`[PredictionMarketPage useMemo - Yes] Running with chainId: ${chainId}, yesPool?.id: ${yesPool?.id}`); // Log inside memo
    if (chainId && yesPool?.id) {
      const id = `${chainId}_${yesPool.id}`;
      console.log(`[PredictionMarketPage useMemo - Yes] Calculated ID: ${id}`);
      return id;
    }
    console.log(`[PredictionMarketPage useMemo - Yes] Returning undefined`);
    return undefined;
  }, [chainId, yesPool]); // Depend on chainId and the whole yesPool object

  const prefixedNoPoolId = React.useMemo(() => {
    console.log(`[PredictionMarketPage useMemo - No] Running with chainId: ${chainId}, noPool?.id: ${noPool?.id}`); // Log inside memo
    if (chainId && noPool?.id) {
      const id = `${chainId}_${noPool.id}`;
      console.log(`[PredictionMarketPage useMemo - No] Calculated ID: ${id}`);
      return id;
    }
    console.log(`[PredictionMarketPage useMemo - No] Returning undefined`);
    return undefined;
  }, [chainId, noPool]); // Depend on chainId and the whole noPool object
  
  console.log(`[PredictionMarketPage RENDER] Prefixed IDs - Yes: ${prefixedYesPoolId}, No: ${prefixedNoPoolId}`);
  // --- End Construct Prefixed Pool IDs ---

  // --- Fetch Pools TVL Amounts (for current state) ---
  const { 
    data: poolsTvlData,
    isLoading: isLoadingPoolsTvl,
    isError: isErrorPoolsTvl
  } = usePoolsTvlAmounts(prefixedYesPoolId, prefixedNoPoolId); 
  console.log("[PredictionMarketPage] poolsTvlData:", { data: poolsTvlData, isLoading: isLoadingPoolsTvl, isError: isErrorPoolsTvl }); // Log TVL hook output
  // --- End Fetch Pools TVL Amounts ---

  // --- Fetch Swap History Deltas (for BOTH pools) ---
  const { 
    data: swapDeltasByPool,
    isLoading: isLoadingSwapDeltas, 
    isError: isErrorSwapDeltas
  } = usePoolSwapHistory(prefixedYesPoolId, prefixedNoPoolId); 
  console.log("[PredictionMarketPage] swapDeltasByPool:", { data: swapDeltasByPool, isLoading: isLoadingSwapDeltas, isError: isErrorSwapDeltas }); // Log Swap hook output
  // --- End Fetch Swap History Deltas ---

  // --- Calculate Token0 History for BOTH pools ---
  const yesToken0History = React.useMemo(() => {
    return calculateHistory(poolsTvlData?.yes?.tvlToken0, swapDeltasByPool?.yes);
  }, [poolsTvlData, swapDeltasByPool]);

  const noToken0History = React.useMemo(() => {
    // Assuming token0 is collateral (tUSDC) for NO pool too
    return calculateHistory(poolsTvlData?.no?.tvlToken0, swapDeltasByPool?.no);
  }, [poolsTvlData, swapDeltasByPool]);
  // --- End Calculate Token0 History ---

  // --- Merge Data for Chart ---
  const chartData = React.useMemo(() => {
    const merged: { [key: number]: CombinedChartDataPoint } = {};
    const allPoints = [...yesToken0History, ...noToken0History];

    // Collect all unique timestamps
    const allTimestamps = Array.from(new Set(allPoints.map(p => p.timestamp))).sort((a, b) => a - b);

    // Initialize merged data with nulls
    allTimestamps.forEach(ts => {
      merged[ts] = { timestamp: ts, yesAmount: null, noAmount: null };
    });

    // Fill in Yes amounts
    yesToken0History.forEach(p => {
      if (merged[p.timestamp]) {
        merged[p.timestamp].yesAmount = p.total;
      }
    });

    // Fill in No amounts
    noToken0History.forEach(p => {
      if (merged[p.timestamp]) {
        merged[p.timestamp].noAmount = p.total;
      }
    });

    // Forward fill null values for smoother chart lines
    let lastYes: number | null = null;
    let lastNo: number | null = null;
    allTimestamps.forEach(ts => {
        if (merged[ts].yesAmount === null) merged[ts].yesAmount = lastYes;
        else lastYes = merged[ts].yesAmount;
        
        if (merged[ts].noAmount === null) merged[ts].noAmount = lastNo;
        else lastNo = merged[ts].noAmount;
    });

    const result = Object.values(merged);
    console.log("[PredictionMarketPage] Final chartData:", result); // Log merged chart data
    return result;
  }, [yesToken0History, noToken0History]);
  // --- End Merge Data ---

  // Combined loading/error states for the chart
  const isLoadingChart = isLoadingPoolsTvl || isLoadingSwapDeltas;
  const isErrorChart = isErrorPoolsTvl || isErrorSwapDeltas;

  // --- Calculate Total Liquidity ---
  let totalLiquidity = BigInt(0);
  try {
     const yesLiq = yesPool?.liquidity ? BigInt(yesPool.liquidity) : BigInt(0);
     const noLiq = noPool?.liquidity ? BigInt(noPool.liquidity) : BigInt(0);
     totalLiquidity = yesLiq + noLiq;
  } catch {}
  const hasLiquidity = totalLiquidity > BigInt(0);
  // --- End Calculate Total Liquidity ---

  // --- Format End Date ---
  const formattedEndDate = React.useMemo(() => {
    if (!endTimestamp) return "Loading...";
    
    try {
      // Handle both string and BigInt inputs
      const timestamp = typeof endTimestamp === 'string' 
        ? BigInt(endTimestamp) 
        : endTimestamp;
      
      // Convert BigInt to number for Date constructor
      const date = new Date(Number(timestamp) * 1000);
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.error('Invalid date from timestamp:', endTimestamp);
        return "Invalid Date";
      }
      
      return format(date, "MMMM d, yyyy 'at' h:mm a");
    } catch (error) {
      console.error('Error formatting end date:', error);
      return "Error Loading Date";
    }
  }, [endTimestamp]);

  const { 
    handleSwap, 
    isSwapping, 
    expectedOutput, 
    tokenBalance,
    needsApproval,
    handleApprove,
    isApproving,
  }: {
    handleSwap: () => Promise<void>;
    isSwapping: boolean;
    expectedOutput: string;
    tokenBalance: SwapTokenBalances;
    needsApproval: boolean;
    handleApprove: (params?: any) => Promise<void>;
    isApproving: boolean;
  } = SwapFunction({
    marketId,
    yesPool,
    noPool,
    market: marketData,
    selectedAction,
    selectedOption,
    amount,
    setAmount
  });

  let displayBalance = '0.00';
  if (isConnected && tokenBalance) {
    if (selectedAction === 'Buy') {
      displayBalance = tokenBalance.collateral || '0.00';
    } else {
      displayBalance = selectedOption === 'Yes' ? (tokenBalance.yes || '0.00') : (tokenBalance.no || '0.00');
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const addAmount = (value: number) => {
    const currentAmount = parseFloat(amount || '0');
    setAmount((currentAmount + value).toString());
  };

  const setMaxAmount = () => {
    const max = parseFloat(displayBalance) || 0;
    setAmount(max > 0 ? displayBalance : '0');
  };

  const volume = marketData?.volume ? marketData.volume.toLocaleString() : '0';
  const comments: CommentData[] = Array.isArray(marketData?.comments) ? marketData.comments : [];
  const topHolders = marketData?.topHolders || [];
  const activity = marketData?.activity || [];

  const isAmountInvalid = amount === '' || parseFloat(amount) <= 0;
  const isTradingDisabled = !hasLiquidity || !isConnected; // Disable if no liquidity or not connected

  return (
    <div className="max-w-screen-xl mx-auto py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="w-16 h-16 border rounded-lg">
              {marketData.icon ? (
                 <AvatarImage src={marketData.icon} alt="Market icon" />
              ) : null }
              <AvatarFallback className="rounded-lg bg-muted">?</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-1">{marketData?.title || "Loading..."}</CardTitle>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                   <BarChart className="w-4 h-4" />
                  <span>${volume} Vol.</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formattedEndDate}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle>Market Details</CardTitle>
             <CardDescription>Current probability, pool amounts, and tUSDC amount chart.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-center text-muted-foreground mb-3">tUSDC Amount in Pools</h4>
                 <Token0AmountChart 
                     data={chartData} // Pass merged data
                     isLoading={isLoadingChart} 
                     isError={isErrorChart}
                   />
             </div>
             <Separator className="my-4" />
             <PriceDisplay 
                yesPool={yesPool} 
                noPool={noPool} 
                marketId={marketId} 
                poolsTvlData={poolsTvlData}
                isLoadingPoolsTvl={isLoadingPoolsTvl}
                isErrorPoolsTvl={isErrorPoolsTvl}
             />             
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details & Rules</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
              <p>{marketData?.description || "Loading..."}</p>
              <p>
                <strong>Resolution Date:</strong> {formattedEndDate}
              </p>
             </div>
          </CardContent>
        </Card>

        <Card>
           <Tabs defaultValue="Comments" className="w-full">
             <TabsList className="grid w-full grid-cols-4 mb-4">
               <TabsTrigger value="Comments"><MessageSquare className="w-4 h-4 mr-1"/> Comments ({comments.length})</TabsTrigger>
               <TabsTrigger value="TopHolders" disabled>Top Holders</TabsTrigger>
               <TabsTrigger value="Activity" disabled>Activity</TabsTrigger>
               <TabsTrigger value="Related" disabled>Related</TabsTrigger>
             </TabsList>

             <TabsContent value="Comments">
                <CardHeader>
                   <CardTitle>Comments</CardTitle>
                </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add a comment..."
                    />
                     <Button disabled>Post</Button>
                 </div>
                  <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                     <ShieldAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertTitle className="text-yellow-800 dark:text-yellow-300">Security Notice</AlertTitle>
                    <AlertDescription>
                      Beware of external links, they may be phishing attacks. Do not share private keys.
                    </AlertDescription>
                  </Alert>

                 <div className="space-y-4">
                   {comments.length > 0 ? comments.map((comment: CommentData, index: number) => {
                     const positionText = comment.position || '';
                     let badgeVariant: "default" | "destructive" | "outline" = "outline";
                     let badgeClass = '';
                     if (positionText.toLowerCase().includes('yes')) {
                        badgeVariant = 'default';
                        badgeClass = 'border-green-500/50 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400';
                     } else if (positionText.toLowerCase().includes('no')) {
                        badgeVariant = 'destructive';
                     }

                     return (
                       <div key={index} className="flex gap-3 border-b pb-4 last:border-b-0 last:pb-0">
                         <Avatar className="w-10 h-10">
                           <AvatarImage src={comment.avatar} alt={comment.username} />
                           <AvatarFallback>{comment.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                         </Avatar>
                         <div className="flex-grow">
                           <div className="flex justify-between items-center mb-1">
                             <div className="flex items-center gap-2">
                               <span className="font-semibold text-foreground">{comment.username}</span>
                               {comment.position && (
                                 <Badge
                                    variant={badgeVariant}
                                    className={`text-xs ${badgeClass}`}
                                 >
                                   {comment.position}
                                 </Badge>
                               )}
                             </div>
                             <span className="text-muted-foreground text-xs">{comment.time}</span>
                           </div>
                           <p className="text-sm text-muted-foreground break-words">{comment.content}</p>
                           <div className="flex gap-2 mt-2">
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                 <ThumbsUp className="w-4 h-4 mr-1"/> Like
                              </Button>
                           </div> 
                         </div>
                       </div>
                     );
                   }) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                   )}
                 </div>
               </CardContent>
             </TabsContent>
              <TabsContent value="TopHolders">
                  <CardContent><p className="text-muted-foreground p-4 text-center">Top Holders feature coming soon.</p></CardContent>
              </TabsContent>
              <TabsContent value="Activity">
                  <CardContent><p className="text-muted-foreground p-4 text-center">Activity feed coming soon.</p></CardContent>
              </TabsContent>
              <TabsContent value="Related">
                 <CardContent><p className="text-muted-foreground p-4 text-center">Related markets feature coming soon.</p></CardContent>
              </TabsContent>
           </Tabs>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-20 space-y-6">
          <Card>
            <CardHeader>
               <ToggleGroup
                type="single"
                value={selectedAction}
                onValueChange={(value) => { if (value) setSelectedAction(value as 'Buy' | 'Sell'); }}
                className="grid grid-cols-2"
                disabled={!hasLiquidity}
              >
                <ToggleGroupItem value="Buy" aria-label="Select Buy" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Buy
                </ToggleGroupItem>
                <ToggleGroupItem value="Sell" aria-label="Select Sell" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Sell
                </ToggleGroupItem>
              </ToggleGroup>
            </CardHeader>
            <CardContent className="space-y-4">
               <ToggleGroup
                 type="single"
                 value={selectedOption}
                 onValueChange={(value) => { if (value) setSelectedOption(value as 'Yes' | 'No'); }}
                 className="grid grid-cols-2"
                 disabled={!hasLiquidity}
               >
                 <ToggleGroupItem value="Yes" aria-label="Select Yes" className="data-[state=on]:bg-green-600 data-[state=on]:text-white">
                   Yes
                 </ToggleGroupItem>
                 <ToggleGroupItem value="No" aria-label="Select No" className="data-[state=on]:bg-red-600 data-[state=on]:text-white">
                   No
                 </ToggleGroupItem>
               </ToggleGroup>

              {!hasLiquidity && isConnected && (
                 <Alert variant="default" className="border-blue-500/50 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                   <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                   <AlertTitle className="text-blue-800 dark:text-blue-300">Add Liquidity Required</AlertTitle>
                   <AlertDescription>
                     This market needs liquidity before trading can begin.
                     <Link href={`${marketId}/add-liquidity`} className="ml-1 font-medium text-blue-700 dark:text-blue-300 hover:underline">
                         Add Liquidity
                     </Link>
                   </AlertDescription>
                 </Alert>
              )}

              <div className="space-y-1">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground sm:text-sm">$</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    id="amount"
                    className="pl-7 pr-12"
                    placeholder="0.00"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={isTradingDisabled}
                  />
                </div>
                <div className="text-xs text-muted-foreground pt-1">
                   Balance: {displayBalance} {selectedAction === 'Buy' ? 'USDC' : selectedOption + ' Tokens'}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-1">
                 <Button variant="outline" size="sm" onClick={() => addAmount(1)} disabled={isTradingDisabled}>+$1</Button>
                 <Button variant="outline" size="sm" onClick={() => addAmount(5)} disabled={isTradingDisabled}>+$5</Button>
                 <Button variant="outline" size="sm" onClick={() => addAmount(20)} disabled={isTradingDisabled}>+$20</Button>
                 <Button variant="outline" size="sm" onClick={() => addAmount(100)} disabled={isTradingDisabled}>+$100</Button>
                <Button variant="outline" size="sm" onClick={setMaxAmount} disabled={isTradingDisabled}>Max</Button>
              </div>

              {amount && parseFloat(amount) > 0 && expectedOutput && hasLiquidity && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Expected {selectedAction === 'Buy' ? 'output' : 'return'}: 
                  <span className="font-medium text-foreground">
                      {selectedAction === 'Buy'
                        ? ` ${expectedOutput} ${selectedOption} tokens`
                        : ` $${expectedOutput}`}
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {!isConnected ? (
                <Button className="w-full" disabled>Connect Wallet</Button>
              ) : !hasLiquidity ? (
                 <Button className="w-full" disabled>Add Liquidity to Trade</Button>
              ) : needsApproval ? (
                <Button
                  className="w-full"
                  onClick={() => handleApprove()}
                  disabled={isApproving || isAmountInvalid || isTradingDisabled}
                >
                  {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Approve {selectedAction === 'Buy' ? 'USDC' : selectedOption + ' Tokens'}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleSwap}
                  disabled={isSwapping || isAmountInvalid || isTradingDisabled}
                >
                  {isSwapping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {selectedAction} {selectedOption}
                </Button>
              )}
            </CardFooter>
          </Card>

          {mintCollateralButton}

          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Your Balances</CardTitle>
              </CardHeader>
              <CardContent>
                <TokenBalances
                  collateralBalance={tokenBalance?.collateral || '0.00'}
                  yesBalance={tokenBalance?.yes || '0.00'}
                  noBalance={tokenBalance?.no || '0.00'}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionMarketPage;