"use client";

import React from 'react';
import PredictionMarketPage from '@/components/PredictionMarketPage';
import Link from 'next/link';
import { useMarketByIndex } from '@/hooks/fetchMarkets';

export default function MarketPageClient({ id }: { id: string }) {
  // Fetch market data
  const { market, isLoading: marketLoading, isError } = useMarketByIndex(id);
  
  // Use a stable loading state that won't cause hydration mismatches
  if (marketLoading) {
    return (
      <main className="app-container">
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading market...</p>
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
        
        <PredictionMarketPage marketData={market} />
      </div>
    </main>
  );
}