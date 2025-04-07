"use client";

import MarketCard from '@/components/MarketCard';
import { usePaginatedMarkets } from '@/hooks/fetchMarkets';
import { useChainId } from 'wagmi'
import React, { useEffect, useState } from 'react';
import { usePredictionMarketHookAddress } from '@/config';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react'; // Or other relevant icon

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
    <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="mr-2 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading markets...</p>
        </div>
      )}
      
      {isError && (
        <div className="flex justify-center items-center h-64">
          <Alert variant="destructive" className="max-w-md">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load markets: {errorInfo}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {marketsList.length > 0 ? (
            marketsList.map((market, index) => {
              const marketId = market?.id || `market-${index}`;
              const marketUrl = `/${market.id}`; 
                
              return (
                <MarketCard
                  key={marketId}
                  id={market.id} 
                  title={market.title || 'Untitled Market'}
                  description={market.description}
                  yesPrice={market.yesPrice}
                  noPrice={market.noPrice}
                  url={marketUrl}
                />
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No markets detected</h3>
              <p className="text-muted-foreground">
                There are currently no prediction markets available on {chainName}.
              </p>
              <p className="text-muted-foreground mt-4">
                Try refreshing the page or switching networks.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

