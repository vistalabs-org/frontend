"use client"
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import SwapFunction from './SwapFunction';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'ethers';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';
import { ROUTER } from '@/app/constants';
import { useRouter } from 'next/navigation';

// --- Import Shadcn UI Components --- Ensured imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from 'lucide-react';

// First, add a TokenBalances component
const TokenBalances = ({ collateralBalance, yesBalance, noBalance }: { 
  collateralBalance?: string;
  yesBalance?: string;
  noBalance?: string;
}) => {
  return (
    <div className="mt-4 p-4 border-t border-border-color">
      <h3 className="text-sm font-medium mb-2">Your Balances</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-secondary">USDC:</span>
          <span>{collateralBalance || '0.00'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary">Yes Tokens:</span>
          <span>{yesBalance || '0.00'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary">No Tokens:</span>
          <span>{noBalance || '0.00'}</span>
        </div>
      </div>
    </div>
  );
};

// PriceDisplay Component - Use Shadcn Card components
const PriceDisplay = ({ yesPool, noPool, marketId }: { yesPool: any; noPool: any; marketId: string }) => {
  const formatPricePercent = (pool: any) => {
    if (!pool?.price) return 'N/A';
    try {
      const priceAsNumber = Number(pool.price);
      if (isNaN(priceAsNumber) || priceAsNumber === 0) return 'N/A';
      return `${(priceAsNumber * 100).toFixed(1)}%`;
    } catch (error) {
      console.error('Error formatting price:', error);
      return 'N/A';
    }
  };

  const formatLiquidity = (liquidity: any) => {
     if (liquidity === undefined || liquidity === null) return '0';
     try {
       return BigInt(liquidity).toString();
     } catch { 
       return '0';
     }
  }

  const totalLiquidity = 
    (yesPool?.liquidity ? BigInt(yesPool.liquidity) : BigInt(0)) + 
    (noPool?.liquidity ? BigInt(noPool.liquidity) : BigInt(0));

  return (
    <Card> 
      <CardHeader className="text-center pb-2">
        <CardDescription>Current Market Price</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex justify-around items-center mb-4">
          <div className="text-center flex-1 px-2">
            <div className="text-3xl font-bold text-success mb-1">{formatPricePercent(yesPool)}</div>
            <div className="text-sm text-muted-foreground">Yes</div>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="text-center flex-1 px-2">
            <div className="text-3xl font-bold text-destructive mb-1">{formatPricePercent(noPool)}</div>
            <div className="text-sm text-muted-foreground">No</div>
          </div>
        </div>
        
        <Separator className="my-4" />

        {/* Liquidity section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-muted-foreground">
              Market Liquidity
            </div>
          </div>
          <div className="flex justify-around items-center text-center">
            <div className="flex-1">
              <div className="text-lg font-medium text-foreground">
                {formatLiquidity(yesPool?.liquidity)}
              </div>
              <div className="text-xs text-muted-foreground">Yes Pool</div>
            </div>
            <div className="flex-1">
              <div className="text-lg font-medium text-foreground">
                {formatLiquidity(noPool?.liquidity)}
              </div>
              <div className="text-xs text-muted-foreground">No Pool</div>
            </div>
          </div>
          <div className="text-sm font-medium text-center text-muted-foreground mt-2">
            Total: {totalLiquidity.toString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Define the expected shape of tokenBalance from SwapFunction hook
interface SwapTokenBalances {
  collateral: string;
  yes: string;
  no: string;
}

const PredictionMarketPage = ({ 
  marketData, 
  yesPool, 
  noPool, 
  endTimestamp, 
  marketId,
  mintCollateralButton
}: any) => {
    const [selectedAction, setSelectedAction] = React.useState<'Buy' | 'Sell'>('Buy');
    const [selectedOption, setSelectedOption] = React.useState<'Yes' | 'No'>('Yes');
  const [amount, setAmount] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('Comments');
  const { isConnected } = useAccount();
  const router = useRouter();

  // Use the SwapFunction hook
  const { 
    handleSwap, 
    isSwapping, 
    expectedOutput, 
    tokenBalance,
    needsApproval,
    handleApprove,
    isApproving,
    isApproved
  }: { 
    handleSwap: () => Promise<void>;
    isSwapping: boolean;
    expectedOutput: string;
    tokenBalance: SwapTokenBalances;
    needsApproval: boolean;
    handleApprove: (params: any) => Promise<void>;
    isApproving: boolean;
    isApproved: boolean;
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

  // --- Determine which balance to display based on action/option --- 
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
    if (/^\d*\.?\d*$/.test(value)) { 
      setAmount(value);
    }
  };

  const addAmount = (value: number) => {
    const currentAmount = parseFloat(amount) || 0;
    setAmount((currentAmount + value).toString());
  };
  
  const setMaxAmount = () => {
    setAmount(displayBalance); // Use displayBalance string
  }

  // Add checks for all required properties
  const volume = marketData?.volume ? marketData.volume.toLocaleString() : '0';
  const comments = marketData?.comments || [];
  const topHolders = marketData?.topHolders || [];
  const activity = marketData?.activity || [];

  const formatEndDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  };

  // For debugging
  console.log("PredictionMarketPage - yesPool:", yesPool);
  console.log("PredictionMarketPage - noPool:", noPool);
  console.log("PredictionMarketPage - yesPool liquidity:", yesPool?.liquidity);
  console.log("PredictionMarketPage - noPool liquidity:", noPool?.liquidity);

  return (
    <div className="max-w-screen-xl mx-auto py-6 text-primary">
      <div className="flex flex-col gap-6">
        {/* AI Oracle Card */}
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">AI Oracle Resolution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Market resolved by decentralized AI agents.
            </p>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${marketId}/resolve`)}
            >
              View Details
            </Button>
          </CardContent>
        </Card>

        {/* Main content area with market price and swap box */}
        <div className="px-6 flex gap-6">
          {/* Left column - Market price */}
          <div className="flex-1">
            <div className="rounded-lg bg-card-background p-4">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="market-icon-container" style={{ width: '64px', height: '64px' }}>
                    {marketData.icon ? (
                      <Image 
                        src={marketData.icon} 
                        alt="Market icon" 
                        width={64} 
                        height={64} 
                        className="rounded-lg"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--border-light)' }}></div>
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {marketData?.title || "Loading..."}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-secondary">
                    <span>${volume} Vol.</span>
                    <div className="flex items-center gap-1">
                      <svg 
                        className="w-4 h-4" 
                        fill="currentColor"
                        viewBox="0 0 512 512"
                      >
                        <path d="M256 48C141 48 48 141.2 48 256s93 208 207.8 208c115 0 208.2-93.2 208.2-208S370.8 48 255.8 48zm.2 374.4c-91.9 0-166.4-74.5-166.4-166.4S164.1 89.6 256 89.6 422.4 164.1 422.4 256 347.9 422.4 256 422.4z"/>
                        <path d="M266.4 152h-31.2v124.8l109.2 65.5 15.6-25.6-93.6-55.5V152z"/>
                      </svg>
                      <span>{endTimestamp ? formatEndDate(Number(endTimestamp)) : "Loading..."}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <Card className="mb-6">
                <PriceDisplay yesPool={yesPool} noPool={noPool} marketId={marketId} />
              </Card>

              {/* Market Rules */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none text-secondary">
                    <p className="mb-4">{marketData?.description || "Loading..."}</p>
                    <p className="mb-4">
                      <span className="font-semibold">Resolution Date:</span>{' '}
                      {endTimestamp ? formatEndDate(Number(endTimestamp)) : "Loading..."}
                    </p>
                  </div>
                  
                  <div className="bg-card-background rounded-lg p-4 mt-4" style={{ backgroundColor: 'var(--card-background)' }}>
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 6H11V20H9zM13 8H15V20H13zM17 4H19V20H17zM5 12H7V20H5z"></path>
                        </svg>
                        <span className="font-bold">Volume</span>
                        <span>${volume}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10s10-4.486,10-10S17.514,2,12,2z M12,20c-4.411,0-8-3.589-8-8s3.589-8,8-8 s8,3.589,8,8S16.411,20,12,20z"></path>
                          <path d="M13 7L11 7 11 12.414 14.293 15.707 15.707 14.293 13 11.586z"></path>
                        </svg>
                        <span className="font-bold">End Date</span>
                        <span>{endTimestamp ? formatEndDate(Number(endTimestamp)) : "Loading..."}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments / Tabs Section - ADD Shadcn Tabs Structure */}
              <Tabs defaultValue="Comments" className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="Comments">Comments ({comments.length})</TabsTrigger>
                  <TabsTrigger value="TopHolders">Top Holders ({topHolders.length})</TabsTrigger>
                  <TabsTrigger value="Activity">Activity ({activity.length})</TabsTrigger>
                  <TabsTrigger value="Related">Related</TabsTrigger>
                </TabsList>
                
                <TabsContent value="Comments">
                  <Card>
                    <CardContent className="pt-6"> {/* Added pt-6 for spacing */} 
                      {/* Use Shadcn Input for Comment */}
                      <Input 
                        type="text" 
                        placeholder="Add a comment..."
                        className="mb-4"
                      />
                      
                      {/* Optional: Warning Box - using muted colors */} 
                      <div className="flex items-center gap-2 p-2 rounded-lg mb-4 text-sm bg-muted text-muted-foreground">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"> 
                          <path d="M20.995 6.9031C20.9789 6.73477 20.9203 6.57329 20.8246 6.43387C20.7289 6.29445 20.5993 6.18165 20.448 6.1061L12.475 2.1061C12.3363 2.03604 12.1832 1.99937 12.0278 1.99903C11.8724 1.99868 11.7191 2.03466 11.58 2.1041L3.55304 6.1041C3.25604 6.2541 3.05104 6.5411 3.00904 6.8711C2.99604 6.9681 1.86404 16.6121 11.55 21.8791C11.6989 21.9603 11.8661 22.0021 12.0357 22.0005C12.2053 21.999 12.3717 21.9541 12.519 21.8701C21.826 16.6111 21.033 7.2971 20.995 6.9031ZM12.018 19.8471C5.15804 15.8371 4.87804 9.4951 4.95504 7.6421L12.026 4.1191L19.024 7.6301C19.029 9.5001 18.543 15.8731 12.018 19.8471Z" fill="currentColor"></path> 
                        </svg>
                        <span>Beware of external links, they may be phishing attacks.</span>
                      </div>
                      
                      {/* Comments List */}
                      <div className="space-y-4">
                         {comments.length > 0 ? comments.slice(0, 5).map((comment:any, index:any) => (
                           <div key={index} className="border-b border-border pb-4 last:border-b-0 last:pb-0"> 
                              <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                  {comment.avatar ? (
                                    <Image 
                                      src={comment.avatar} 
                                      alt={comment.username} 
                                      width={40} 
                                      height={40} 
                                      className="rounded-full"
                                    />
                                  ) : (
                                     <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">?</div> // Placeholder avatar
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-foreground">{comment.username}</span>
                                      {comment.position && (
                                        <Badge 
                                           variant="outline"
                                           className={`text-xs ${comment.position.includes('Yes') 
                                             ? 'bg-success/10 text-success border-success/20' 
                                             : 'bg-destructive/10 text-destructive border-destructive/20'}`}
                                        >
                                          {comment.position}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-muted-foreground text-xs">{comment.time}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                                  {/* TODO: Add like/reply functionality */} 
                                </div>
                              </div>
                           </div>
                         )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                         )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                {/* Add TabsContent for TopHolders, Activity, Related here */}
                <TabsContent value="TopHolders">
                   <Card><CardContent><p className="text-muted-foreground p-4">Top Holders feature coming soon.</p></CardContent></Card>
                </TabsContent>
                <TabsContent value="Activity">
                    <Card><CardContent><p className="text-muted-foreground p-4">Activity feed coming soon.</p></CardContent></Card>
                </TabsContent>
                <TabsContent value="Related">
                   <Card><CardContent><p className="text-muted-foreground p-4">Related markets feature coming soon.</p></CardContent></Card>
                </TabsContent>
              </Tabs>

            </div>
          </div>

          {/* Right column - Swap box */}
          <div className="w-[400px]">
            <div className="sticky top-20 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <button 
                        className={`flex-1 py-2 font-medium ${selectedAction === 'Buy' ? 'bg-primary-color text-white' : 'bg-card-background text-secondary'}`}
                        style={{ backgroundColor: selectedAction === 'Buy' ? 'var(--primary-color)' : 'var(--card-background)' }}
                        onClick={() => setSelectedAction('Buy')}
                        >
                        Buy
                    </button>
                    <button 
                        className={`flex-1 py-2 font-medium ${selectedAction === 'Sell' ? 'bg-primary-color text-white' : 'bg-card-background text-secondary'}`}
                        style={{ backgroundColor: selectedAction === 'Sell' ? 'var(--primary-color)' : 'var(--card-background)' }}
                        onClick={() => setSelectedAction('Sell')}
                        >
                        Sell
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="mb-4">
                      <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                        <button 
                          className={`flex-1 py-3 font-medium ${selectedOption === 'Yes' ? 'bg-green text-white' : 'bg-card-background text-secondary'}`}
                          style={{ backgroundColor: selectedOption === 'Yes' ? 'var(--green)' : 'var(--card-background)' }}
                          onClick={() => setSelectedOption('Yes')}
                        >
                          <div className="flex flex-col items-center">
                            <span>Yes</span>
                          </div>
                        </button>
                        <button 
                          className={`flex-1 py-3 font-medium ${selectedOption === 'No' ? 'bg-red text-white' : 'bg-card-background text-secondary'}`}
                          style={{ backgroundColor: selectedOption === 'No' ? 'var(--red)' : 'var(--card-background)' }}
                          onClick={() => setSelectedOption('No')}
                        >
                          <div className="flex flex-col items-center">
                            <span>No</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Use Shadcn Label and Input */}
                    <div className="space-y-1">
                      <Label htmlFor="amount" >
                        Amount
                      </Label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground sm:text-sm">$</span>
                        <Input
                          type="text" 
                          id="amount"
                          className="pl-7 pr-12" // Add padding for the prefix
                          placeholder="0.00"
                          value={amount}
                          onChange={handleAmountChange}
                        />
                      </div>
                    </div>
                    
                    {/* Quick Add Buttons */} 
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => addAmount(1)}>+$1</Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => addAmount(5)}>+$5</Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => addAmount(20)}>+$20</Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => addAmount(100)}>+$100</Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={setMaxAmount}>Max</Button>
                    </div>
                    
                    {/* Add expected output display */}
                    {amount && parseFloat(amount) > 0 && (
                      <div className="mt-2 text-sm text-secondary">
                        Expected {selectedAction === 'Buy' ? 'output' : 'return'}: 
                        {selectedAction === 'Buy' 
                          ? ` ${expectedOutput} ${selectedOption} tokens` 
                          : ` $${expectedOutput}`}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {/* Action Button: Approve or Swap */}
                  {!isConnected ? (
                    <Button className="w-full" disabled>Connect Wallet</Button>
                  ) : needsApproval ? (
                    <Button 
                      className="w-full" 
                      onClick={handleApprove}
                      disabled={isApproving || amount === '' || parseFloat(amount) <= 0}
                    >
                      {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Approve {selectedAction === 'Buy' ? 'USDC' : selectedOption}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={handleSwap}
                      disabled={isSwapping || amount === '' || parseFloat(amount) <= 0}
                    >
                      {isSwapping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {selectedAction} {selectedOption}
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Mint Collateral Button */}
              {mintCollateralButton}

              {/* Display Balances */}
              {isConnected && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Your Balances</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
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
      </div>
    </div>
  );
};

export default PredictionMarketPage;