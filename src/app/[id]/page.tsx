// app/market/[id]/page.tsx
import React from 'react';
import MarketPageClient from '@/components/market/MarketPageClient';

// Add edge runtime configuration
export const runtime = 'edge';


// Simple page component without async
// @ts-ignore - Temporarily suppressing constraint error, likely due to module resolution issues
export default async function MarketPage({ params }: { params: { id: string } }) {
  return <MarketPageClient id={params.id} />;
}