"use client";

import MarketCard from '@/components/market/MarketCard';
import { usePaginatedMarkets } from '@/hooks/fetchMarkets';
import { useChainId } from 'wagmi'
import React, { useEffect, useState } from 'react';
import { usePredictionMarketHookAddress } from '@/config';
import { Loader2, Terminal, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Add edge runtime configuration
export const runtime = 'edge';

export default function Home() {
  const chainId = useChainId();
  const hookAddress = usePredictionMarketHookAddress();
  const {markets, isLoading, error} = usePaginatedMarkets(0, 9);
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
      console.error("Market loading error details:", error);
      try {
        const message = (error as any)?.shortMessage || (error as any)?.message || JSON.stringify(error);
        setErrorInfo(message);
      } catch (e) {
        console.error("Failed to stringify market error:", e);
        setErrorInfo('An unknown error occurred while loading markets.');
      }
    }
  }, [error]);
  
  // Default empty array if markets is undefined or not an array
  const marketsList = Array.isArray(markets) ? markets : [];

  console.log("Markets for chain ID", chainId, ":", marketsList);
  console.log("Using contract address:", hookAddress);
  
  // Skeleton loader component for MarketCard
  const MarketCardSkeleton = () => (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-8 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => <MarketCardSkeleton key={i} />)}
        </div>
      )}
      
      {error && (
        <div className="flex justify-center items-center py-10">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Markets</AlertTitle>
            <AlertDescription>
              {errorInfo || "Failed to load markets. Please try refreshing the page."}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {marketsList.length > 0 ? (
            marketsList.map((market, index) => {
              const marketId = market?.id;
              if (!market || marketId === undefined || marketId === null) {
                 console.warn("Skipping market with missing data:", market, index);
                 return null;
              }
              const marketUrl = `/${marketId}`;

              return (
                <MarketCard
                  key={marketId.toString()}
                  id={marketId}
                  title={market.title || 'Untitled Market'}
                  description={market.description || 'No description available.'}
                  yesPrice={market.yesPrice}
                  noPrice={market.noPrice}
                  url={marketUrl}
                />
              );
            })
          ) : (
            <div className="col-span-full flex items-center justify-center py-10">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>No Markets Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            There are currently no prediction markets available on {chainName}.
                        </p>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Try refreshing the page or switching networks.
                        </p>
                    </CardContent>
                </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

