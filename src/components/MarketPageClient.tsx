"use client";

import React, { useEffect, useState } from 'react';
import PredictionMarketPage from '@/components/PredictionMarketPage';
import Link from 'next/link';
import { useMarketByIndex } from '@/hooks/fetchMarkets';
import { useMarketWithPoolData } from '@/hooks/usePoolData';
import { format } from 'date-fns';
import { MintCollateralButton } from './MintCollateralButton';
import { useAccount } from 'wagmi';

// Create a new component to use the pool data hook
const MarketWithPoolData = ({ marketId, market }: { marketId: string; market: any }) => {
  // Import and use the hook directly in a component
  const { market: marketWithPools, yesPool, noPool, isLoading: poolLoading } = useMarketWithPoolData(marketId, market);
  
  useEffect(() => {
    if (yesPool || noPool) {
      console.log('Pool data loaded:', { yesPool, noPool });
    }
  }, [yesPool, noPool]);
  
  // This component doesn't need to render anything now
  return null;
};

export default function MarketPageClient({ id }: { id: string }) {
  // State to track if we're mounted on the client
  const [isMounted, setIsMounted] = useState(false);
  
  // Add this to check if user is connected
  const { isConnected } = useAccount();
  
  // Set isMounted to true after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Fetch market data
  const { market, isLoading: marketLoading, isError } = useMarketByIndex(id);
  const { market: marketWithPools, yesPool, noPool } = useMarketWithPoolData(id);
  
  // Format the timestamp (converts from seconds to milliseconds)
  const formatEndDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  };
  
  // Get the YES pool price
  const getYesPrice = () => {
    if (yesPool?.price) {
      return (yesPool.price * 100).toFixed(2) + '%';
    }
    return 'Loading...';
  };
  
  // Render a stable loading state during SSR and initial hydration
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

        {/* Oracle Info Banner */}
        <div className="banner-item mb-6">
          <div className="banner-content">
            <div className="banner-text">
              <h3 className="banner-title">Powered by AI Oracle</h3>
              <p className="banner-description">This market will be resolved using our decentralized AI oracle system</p>
            </div>
            <Link
              href="/oracle"
              className="banner-button"
            >
              See How It Works
            </Link>
          </div>
        </div>
        
        {/* Market data and pool loader */}
        <MarketWithPoolData marketId={id} market={market} />
        
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