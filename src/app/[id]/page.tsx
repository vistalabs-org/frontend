// app/market/[id]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import MarketPageClient from '@/components/MarketPageClient';

// Generate metadata for the page
export const metadata: Metadata = {
  title: 'Market | Polymarket',
  description: 'Prediction market details',
};

// Simple page component without async
export default function MarketPage({ params }: { params: { id: string } }) {
  return <MarketPageClient id={params.id} />;
}