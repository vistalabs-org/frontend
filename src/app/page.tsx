"use client";
// import Head from 'next/head';

import MarketCard from '@/components/MarketCard';

export default function Home() {
  
  return (
    <div className="markets-container">
      <MarketCard title={'Market Title Goes Here'} url={''}></MarketCard>
      <MarketCard title={'Eth price > 2000 on Mar 25th'} url={''}></MarketCard>
      <MarketCard title={'Jesus rises in 2025'} url={''}></MarketCard>
      <MarketCard title={'We all retire'} url={''}></MarketCard>
      <MarketCard title={'Trump in jail'} url={''}></MarketCard>
      <MarketCard title={'Trump takes Kim jung un to New York Yankess in 2025'} url={''}></MarketCard>
    </div>
  );
}
