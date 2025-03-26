"use client";

import { useEffect, useState } from 'react';
import { useMarketWithPoolData } from '@/hooks/usePoolData';

export default function DebugPoolData({ id }: { id: string }) {
  // Use state to track if we're on the client
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Only run the hook on the client side
  useEffect(() => {
    if (isClient) {
      // Fetch pool data
      const { market, yesPool, noPool, isLoading, isError } = useMarketWithPoolData(id);
      
      // Log the data
      console.log('Debug - Market:', market);
      console.log('Debug - Yes Pool:', yesPool);
      console.log('Debug - No Pool:', noPool);
      console.log('Debug - Loading:', isLoading);
      console.log('Debug - Error:', isError);
    }
  }, [id, isClient]);
  
  // This component doesn't render anything visible
  return null;
} 