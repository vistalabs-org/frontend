"use client";

import MarketCard, { MarketCardProps } from '@/components/MarketCard';
import { useAllMarkets, useMarketCount, usePaginatedMarkets } from '@/hooks/fetchMarkets';
import { useChainId } from 'wagmi'
import Link from 'next/link';
import React from 'react';

export default function Home() {
  const {markets, isLoading, isError} = usePaginatedMarkets(0, 9);
  
  // Default empty array if markets is undefined or not an array
  const marketsList = Array.isArray(markets) ? markets : [];
  
  return (
    <div className="app-container">
      <div className="main-content">
        {/* Banner for Oracle information */}
        <div className="featured-banners">
          <div className="banner-item">
            <div className="banner-content">
              <div className="banner-text">
                <h2 className="banner-title">How Our Markets Are Resolved</h2>
                <p className="banner-description">Learn about our advanced AI Oracle system that enables fair and transparent market resolutions.</p>
                <Link href="/oracle" className="banner-button">Learn More</Link>
              </div>
              <div className="banner-image-container">
                {/* Image would go here */}
              </div>
            </div>
          </div>
        </div>
        
        {/* Market Tabs */}
        <div className="market-tabs-container">
          <div className="market-tabs">
            <button className="tab-button active">All Markets</button>
            <button className="tab-button">Trending</button>
            <button className="tab-button">Politics</button>
            <button className="tab-button">Crypto</button>
          </div>
        </div>
      
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
          {/* Only try to map over markets when it's definitely an array */}
          {marketsList.length > 0 ? (
            // Use React.createElement approach to avoid key prop TypeScript issues
            marketsList.map((market, index) => {
              // Check if market has an id property, otherwise fall back to index
              const marketId = market.id || index.toString();
              console.log(`Creating market card for: ${market.title} with ID: ${marketId}`);
              
              return React.createElement(
                MarketCard, 
                { 
                  key: `fetched-${index}`,
                  title: market.title || 'Untitled Market',
                  url: `/${marketId}`
                }
              );
            })
          ) : (
            // Fallback static markets (these will show when API fails or returns empty)
            <>
              <MarketCard title={'Market Title Goes Here'} url={'/0'} />
              <MarketCard title={'Eth price > 2000 on Mar 25th'} url={'/1'} />
              <MarketCard title={'Jesus rises in 2025'} url={'/2'} />
              <MarketCard title={'We all retire'} url={'/3'} />
              <MarketCard title={'Trump in jail'} url={'/4'} />
              <MarketCard title={'Trump takes Kim jung un to New York Yankees in 2025'} url={'/5'} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
