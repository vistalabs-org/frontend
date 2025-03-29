"use client";

import React, { useEffect, useState } from 'react';
import PredictionMarketPage from '@/components/PredictionMarketPage';
import Link from 'next/link';
import { useMarketByIndex } from '@/hooks/fetchMarkets';
import { useMarketWithPoolData } from '@/hooks/usePoolData';
import { format } from 'date-fns';
import { MintCollateralButton } from './MintCollateralButton';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

const MarketWithPoolData = ({ marketId }: { marketId: string }) => {
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
  
  const formatEndDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  };
  
  const getYesPrice = () => {
    // Add null/undefined check
    if (yesPool?.price !== undefined) {
      return (yesPool.price * 100).toFixed(2) + '%';
    }
    return 'Loading...';
  };
  
  const handleResolveMarket = () => {
    router.push(`/market/${id}/resolve`);
  };
  
  if (!isMounted || marketLoading) {
    return (
      <main className="app-container">
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      </main>
    );
  }
  
  if (isError || !market) {
    return (
      <main className="app-container">
        <div className="main-content">
          <div className="error-container">
            <p>Market not found</p>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="app-container">
      <div className="main-content">
        {/* Breadcrumbs navigation */}
        <div className="breadcrumbs mb-4">
          <Link href="/" className="text-secondary hover:text-primary text-sm">Markets</Link>
          <span className="mx-2 text-secondary">/</span>
          <span className="text-primary text-sm">{market.title}</span>
        </div>
        
        <MarketWithPoolData marketId={id} />
        
        {/* Main market UI */}
        <PredictionMarketPage 
          marketData={marketWithPools || market}
          yesPool={yesPool}
          noPool={noPool}
          yesPrice={getYesPrice()}
          yesPercentage={yesPool?.price ? yesPool.price * 100 : 50}
          description={market.description}
          endTimestamp={market.endTimestamp}
          marketId={id}
          mintCollateralButton={
            isConnected && marketWithPools?.collateralAddress ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Mint Test Collateral</h3>
                <p className="text-sm text-secondary mb-3">
                  Need test tokens? Mint some collateral to use in this market.
                </p>
                <MintCollateralButton 
                  collateralAddress={marketWithPools.collateralAddress as `0x${string}`} 
                />
              </div>
            ) : null
          }
        />
      </div>
    </main>
  );
}