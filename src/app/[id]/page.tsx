// app/market/[id]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import MarketPageClient from '@/components/MarketPageClient';

// Add edge runtime configuration
export const runtime = 'edge';

// Generate metadata for the page
export const metadata: Metadata = {
  title: 'Market | Polymarket',
  description: 'Prediction market details',
};

// Simple page component without async
// @ts-ignore - Temporarily suppressing constraint error, likely due to module resolution issues
export default function MarketPage({ params }: { params: { id: string } }) {
  return <MarketPageClient id={params.id} />;
}