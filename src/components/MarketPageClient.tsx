"use client";

import React, { useEffect, useState } from 'react';
import PredictionMarketPage from '@/components/PredictionMarketPage';
import Link from 'next/link';
import { useMarketByIndex } from '@/hooks/fetchMarkets';
import { useMarketWithPoolData } from '@/hooks/usePoolData';

// Create a new component to use the pool data hook
const MarketWithPoolData = ({ marketId, market }: { marketId: string; market: any }) => {
  // Import and use the hook directly in a component
  const { market: marketWithPools, yesPool, noPool, isLoading: poolLoading } = useMarketWithPoolData(marketId, market);
  
  useEffect(() => {
    if (yesPool || noPool) {
      console.log('Pool data loaded:', { yesPool, noPool });
    }
  }, [yesPool, noPool]);
  
  // This component can either render something with the pool data
  // or just be used for data fetching
  return null; // or return some UI that uses poolData
};

export default function MarketPageClient({ id }: { id: string }) {
  // State to track if we're mounted on the client
  const [isMounted, setIsMounted] = useState(false);
  
  // Set isMounted to true after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Fetch market data
  const { market, isLoading: marketLoading, isError } = useMarketByIndex(id);
  
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
        
        {isMounted && <PredictionMarketPage marketData={market} />}
        
        {/* Add the new component that uses the pool data hook */}
        {isMounted && market && <MarketWithPoolData marketId={id} market={market} />}
      </div>
    </main>
  );
}