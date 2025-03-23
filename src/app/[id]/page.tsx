"use client";

// app/[id]/page.tsx
import { useMarketByIndex } from '@/hooks/fetchMarkets';
import { notFound } from 'next/navigation';
import React from 'react';

// Define the props type for the page
type PageProps = {
  params: {
    id: string;
  };
};

// Mock data for demonstration
const mockData: Record<string, { id: string; title: string; description: string }> = {
  '1': { id: '1', title: 'Item One', description: 'Description for item 1' },
  '2': { id: '2', title: 'Item Two', description: 'Description for item 2' },
  '3': { id: '3', title: 'Item Three', description: 'Description for item 3' },
};

// Async function to fetch data based on the ID
async function getData(id: string) {
  // In a real app, this would be an API call
  // const res = await fetch(`https://api.example.com/items/${id}`);
  // if (!res.ok) return null;
  // return res.json();
  
  return mockData[id] || null;
}

// Generate static params for static generation
// export async function generateStaticParams() {
//   // Return an array of params to statically generate
//   return Object.keys(mockData).map(id => ({ id }));
// }

// Dynamic page component
export default function DynamicPage({ params }: PageProps) {
  const { id } = params;
//   const data = await getData(id);
    const { market, isLoading, isError } = useMarketByIndex(id);
  
  
  // Handle case when data is not found
  if (!market) {
    notFound();
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Item Details: {market.title}</h1>
      <div className="bg-white shadow-md rounded p-6">
        <p className="text-gray-700">ID: {id}</p>
        <p className="text-gray-700 mt-2">{market.description}</p>
        {/* Add more item details here */}
      </div>
    </div>
  );
}