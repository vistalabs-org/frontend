"use client";

import React, { useEffect, useState } from 'react';
import PredictionMarketPage from '@/components/PredictionMarketPage';
import Link from 'next/link';
import { useMarketByIndex } from '@/hooks/fetchMarkets';
import { useMarketWithPoolData } from '@/hooks/usePoolData';
import { format } from 'date-fns';
import { MintCollateralButton } from './MintCollateralButton';
import { useAccount } from 'wagmi';
import { useLiquidity } from '@/hooks/useStateView';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

// Create a new component to use the pool data hook
const MarketWithPoolData = ({ marketId, market }: { marketId: string; market: any }) => {
  // Import and use the hook directly in a component
  const { market: marketWithPools, yesPool, noPool, isLoading: poolLoading } = useMarketWithPoolData(marketId);
  
  useEffect(() => {
    if (yesPool || noPool) {
      console.log('Pool data loaded:', { yesPool, noPool });
    }
  }, [yesPool, noPool]);
  
  return null;
};

export default function MarketPageClient({ id }: { id: string }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  const { isConnected } = useAccount();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const { market, isLoading: marketLoading, isError } = useMarketByIndex(id);
  const { market: marketWithPools, yesPool, noPool } = useMarketWithPoolData(id);
  
  // Add this to your existing hooks
  const { data: yesLiquidity } = useLiquidity(yesPool?.poolId);
  const { data: noLiquidity } = useLiquidity(noPool?.poolId);
  
  // Format the timestamp (converts from seconds to milliseconds)
  const formatEndDate = (timestamp: bigint | number) => {
    // Convert BigInt to number for Date constructor
    const numTimestamp = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    if (isNaN(numTimestamp)) return "Invalid Date"; // Handle potential NaN
    const date = new Date(numTimestamp * 1000);
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  };
  
  const getYesPrice = () => {
    // Add null/undefined check
    if (yesPool?.price !== undefined && yesPool?.price !== null) {
      return (yesPool.price * 100).toFixed(2) + '%';
    }
    return 'N/A'; // Return N/A instead of Loading
  };
  
  if (!isMounted || marketLoading) {
    // Use Shadcn/Tailwind styling for loading state
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <p>Loading Market...</p>
        </div>
      </main>
    );
  }
  
  if (isError || !market) {
    // Use Shadcn/Tailwind styling for error state
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive mb-2">Market Not Found</p>
          <p className="text-muted-foreground mb-4">Could not load data for market ID: {id}</p>
          <Link href="/" passHref>
             <Button variant="outline">Back to Markets</Button> 
          </Link>
        </div>
      </main>
    );
  }
  
  return (
    // Use padding/max-width for main content layout
    <main className="max-w-screen-lg mx-auto p-4 sm:p-6 lg:p-8">
      {/* Breadcrumbs navigation */}
      <div className="breadcrumbs mb-6 flex justify-between items-center">
        <div> 
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">Markets</Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm font-medium text-primary">{market.title || `Market #${id}`}</span>
        </div>
        <Link href={`/${id}/resolve`} passHref>
          <Button variant="outline" size="sm">Resolve Market</Button> 
        </Link>
      </div>
      
      <MarketWithPoolData marketId={id} market={market} />
      
      {/* Main market UI */}
      <PredictionMarketPage 
        marketData={marketWithPools || market}
        yesPool={yesPool ? {...yesPool, liquidity: yesLiquidity} : undefined}
        noPool={noPool ? {...noPool, liquidity: noLiquidity} : undefined}
        yesPrice={getYesPrice()}
        yesPercentage={yesPool?.price ? yesPool.price * 100 : 50}
        description={market.description}
        endDateString={formatEndDate(market.endTimestamp)}
        marketId={id}
        mintCollateralButton={
          isConnected && marketWithPools?.collateralAddress ? (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-base font-semibold mb-2">Mint Test Collateral</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Need test tokens? Mint some collateral to use in this market.
              </p>
              <MintCollateralButton 
                collateralAddress={marketWithPools.collateralAddress as `0x${string}`} 
              />
            </div>
          ) : null
        }
      />
    </main>
  );
}