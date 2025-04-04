"use client";

import MarketCard from '@/components/MarketCard';
import { usePaginatedMarkets } from '@/hooks/fetchMarkets';
import { useChainId } from 'wagmi'
import React from 'react';

// Add edge runtime configuration
export const runtime = 'edge';

export default function Home() {
  const {markets, isLoading, isError} = usePaginatedMarkets(0, 9);
  
  // Default empty array if markets is undefined or not an array
  const marketsList = Array.isArray(markets) ? markets : [];

  console.log(marketsList);
  
  return (
    <div className="app-container">
      <div className="main-content">
        
      
        {isLoading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading markets...</p>
          </div>
        )}
        
        {isError && (
          <div className="loading-container">
            <p className="loading-text" style={{ color: 'var(--red)' }}>Error loading markets. Using example markets instead.</p>
          </div>
        )}
        
        <div className="markets-container">
          {marketsList.length > 0 ? (
            marketsList.map((market, index) => {
              const marketId = market?.id || index.toString();
              console.log(`Creating market card for: ${market.title} with ID: ${marketId}`);
              
              return (
                <MarketCard
                  key={`fetched-${index}`}
                  title={market.title || 'Untitled Market'}
                  description={market.description}
                  yesPrice={market.yesPrice}
                  noPrice={market.noPrice}
                  url={`/${marketId}`}
                />
              );
            })
          ) : (
            // Fallback static markets (these will show when API fails or returns empty)
            <>
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">No markets detected</h3>
                <p className="text-gray-500">
                  There are currently no prediction markets available or there was an error loading the markets.
                </p>
                <p className="text-gray-500 mt-4">
                  Try refreshing the page or check back later. Or create your own market!
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

