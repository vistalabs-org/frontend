// app/market/[id]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PredictionMarketPage from '@/components/PredictionMarketPage';
import MarketChart from '@/components/MarketChart';
import { getMarketData } from '@/lib/api'

// Define the interface for the params
interface MarketPageParams {
  params: {
    id: string;
  };
}

// Generate metadata for the page
export async function generateMetadata({ params }: MarketPageParams): Promise<Metadata> {
  try {
    const marketData = await getMarketData(params.id);
    
    return {
      title: `${marketData.title} | Polymarket`,
      description: `Trade on the outcome: ${marketData.title}`,
      openGraph: {
        title: `${marketData.title} | Polymarket`,
        description: `Current probability: ${marketData.currentYesPrice}%. Trade now on Polymarket.`,
        images: [marketData.icon],
      },
    };
  } catch (error) {
    return {
      title: 'Market Not Found | Polymarket',
      description: 'The requested prediction market could not be found.',
    };
  }
}

// The main component with server-side data fetching
export default async function MarketPage({ params }: MarketPageParams) {
  try {
    const marketData = await getMarketData(params.id);
    
    return (
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PredictionMarketPage marketData={marketData} />
        </div>
      </main>
    );
  } catch (error) {
    // If market doesn't exist, return 404
    notFound();
  }
}