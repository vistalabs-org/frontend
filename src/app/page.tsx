"use client";

import MarketCard from '@/components/MarketCard';
import { usePaginatedMarkets } from '@/hooks/fetchMarkets';
import { useChainId } from 'wagmi'
import React, { useEffect, useState } from 'react';
import { usePredictionMarketHookAddress } from '@/config';

// Add edge runtime configuration
export const runtime = 'edge';

export default function Home() {
  const chainId = useChainId();
  const hookAddress = usePredictionMarketHookAddress();
  const {markets, isLoading, isError, error} = usePaginatedMarkets(0, 9);
  const [chainName, setChainName] = useState<string>('');
  const [errorInfo, setErrorInfo] = useState<string>('');
  
  // Set chain name based on chainId
  useEffect(() => {
    if (chainId === 130) {
      setChainName('Unichain');
    } else if (chainId === 1301) {
      setChainName('Unichain Sepolia');
    } else {
      setChainName('this network');
    }
  }, [chainId]);
  
  // Extract error information
  useEffect(() => {
    if (error) {
      console.error("Market error details:", error);
      try {
        const errorMessage = typeof error === 'object' ? 
          (error.message || JSON.stringify(error)) : 
          String(error);
        setErrorInfo(errorMessage);
      } catch (e) {
        setErrorInfo('Unknown error occurred');
      }
    }
  }, [error]);
  
  // Default empty array if markets is undefined or not an array
  const marketsList = Array.isArray(markets) ? markets : [];

  console.log("Markets for chain ID", chainId, ":", marketsList);
  console.log("Using contract address:", hookAddress);
  
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
            <p className="loading-text" style={{ color: 'var(--red)' }}>
              Error loading markets: {errorInfo}
            </p>
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
                  There are currently no prediction markets available on {chainName}.
                </p>
                <p className="text-gray-500 mt-2">
                  Contract address: {hookAddress}
                </p>
                {isError && (
                  <p className="text-red-500 mt-2">
                    Error: {errorInfo}
                  </p>
                )}
                <p className="text-gray-500 mt-4">
                  Try refreshing the page, switching networks, or create your own market!
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

