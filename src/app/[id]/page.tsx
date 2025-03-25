// app/market/[id]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PredictionMarketPage from '@/components/PredictionMarketPage';
import MarketChart from '@/components/MarketChart';
import { getMarketData } from '@/lib/api'
import Link from 'next/link';

// Define the interface for the params
type Params = {
  id: string;
};

interface MarketPageProps {
  params: Promise<Params>;
}

// Generate metadata for the page
export async function generateMetadata({ 
  params 
}: MarketPageProps): Promise<Metadata> {
  // In Next.js App Router, dynamic parameters MUST be awaited
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  if (!id) {
    return {
      title: 'Market Not Found | Polymarket',
      description: 'The requested prediction market could not be found.',
    };
  }
  
  try {
    const marketData = await getMarketData(id);
    
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

// Add viewport export to fix themeColor warning
export const viewport = {
  themeColor: '#000000',
}

// The main component with server-side data fetching
export default async function MarketPage({ 
  params 
}: MarketPageProps) {
  // In Next.js App Router, dynamic parameters MUST be awaited
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  if (!id) {
    notFound();
  }
  
  try {
    const marketData = await getMarketData(id);
    
    return (
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Oracle Info Banner */}
          <div className="mb-6 bg-blue-50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-800">Powered by AI Oracle</h3>
              <p className="text-sm text-blue-600">This market will be resolved using our decentralized AI oracle system</p>
            </div>
            <Link
              href="/oracle"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              See How It Works
            </Link>
          </div>
          
          <PredictionMarketPage marketData={marketData} />
        </div>
      </main>
    );
  } catch (error) {
    // If market doesn't exist, return 404
    notFound();
  }
}