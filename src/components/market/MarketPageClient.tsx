"use client";

import React, { useEffect, useState } from 'react';
import PredictionMarketPage from '@/components/market/PredictionMarketPage';
import Link from 'next/link';
import { useMarketByIndex } from '@/hooks/fetchMarkets';
import { useMarketWithPoolData } from '@/hooks/usePoolData';
import { format } from 'date-fns';
import { MintCollateralButton } from '../MintCollateralButton';
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
  
  const { isConnected, chainId } = useAccount();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const { market, isLoading: marketLoading, isError } = useMarketByIndex(id);
  const { market: marketWithPools, yesPool, noPool } = useMarketWithPoolData(id);
  
  // Add this to your existing hooks
  const { data: yesLiquidity } = useLiquidity(yesPool?.id);
  const { data: noLiquidity } = useLiquidity(noPool?.id);
  
  // Log market data for debugging
  useEffect(() => {
    if (market) {
      console.log('Market data:', {
        id,
        endTimestamp: market.endTimestamp,
        endTimestampType: typeof market.endTimestamp,
        title: market.title
      });
    }
  }, [market, id]);
  
  // Format the timestamp (converts from seconds to milliseconds)
  const formatEndDate = (timestamp: bigint | number | string) => {
    try {
      // Handle different input types
      const numTimestamp = typeof timestamp === 'bigint' 
        ? Number(timestamp) 
        : typeof timestamp === 'string' 
          ? Number(timestamp) 
          : timestamp;
          
      if (isNaN(numTimestamp)) {
        console.error('Invalid timestamp:', timestamp);
        return "Invalid Date";
      }
      
      const date = new Date(numTimestamp * 1000);
      if (isNaN(date.getTime())) {
        console.error('Invalid date from timestamp:', timestamp);
        return "Invalid Date";
      }
      
      return format(date, "MMMM d, yyyy 'at' h:mm a");
    } catch (error) {
      console.error('Error formatting end date:', error);
      return "Error Loading Date";
    }
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
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-red-500">
          Error loading market data
        </div>
      </main>
    );
  }
  
  return (
    // Use padding/max-width for main content layout
    <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
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
        yesPool={yesPool ? {...yesPool, liquidity: yesLiquidity ?? yesPool.liquidity } : undefined}
        noPool={noPool ? {...noPool, liquidity: noLiquidity ?? noPool.liquidity } : undefined}
        endTimestamp={market.endTimestamp}
        marketId={id}
        chainId={chainId}
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