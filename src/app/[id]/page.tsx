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
          
          <PredictionMarketPage marketData={marketData} />
        </div>
      </main>
    );
  } catch (error) {
    // If market doesn't exist, return 404
    notFound();
  }
}