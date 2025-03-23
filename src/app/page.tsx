"use client";

import MarketCard from '@/components/MarketCard';
import { useAllMarkets, useMarketCount } from '@/hooks/fetchMarkets';
import { useChainId } from 'wagmi'

export default function Home() {

  const { markets, isLoading, isError } = useAllMarkets()
  
  const stuff = useMarketCount()
  console.log(stuff)
  console.log("yo", markets)

  const chainId = useChainId()
  
  return (
    <div className="markets-container">
        {markets && markets.map((market, index) => (
          <MarketCard key={index} title={market.title} url={`/${index}`} />
        ))}
      <MarketCard title={'Market Title Goes Here'} url={'/1'}></MarketCard>
      <MarketCard title={'Eth price > 2000 on Mar 25th'} url={''}></MarketCard>
      <MarketCard title={'Jesus rises in 2025'} url={''}></MarketCard>
      <MarketCard title={'We all retire'} url={''}></MarketCard>
      <MarketCard title={'Trump in jail'} url={''}></MarketCard>
      <MarketCard title={'Trump takes Kim jung un to New York Yankess in 2025'} url={''}></MarketCard>
    </div>
  );
}
