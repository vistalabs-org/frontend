"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoomVideoExplanation } from '@/components/LoomVideoExplanation';

export default function CreateProposalSelection() {
  const router = useRouter();

  const handleMarketTypeSelect = (type: 'token-price' | 'protocol-kpi') => {
    console.log('Selected market type:', type);
    
    if (type === 'protocol-kpi') {
      console.log('Navigating to KPI market page');
      // Use a more direct approach to navigation
      window.location.href = '/create-proposal/kpi-market';
    } else {
      alert('Token price markets are coming soon!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-6">Create New Prediction Market</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Token Price Market Card */}
            <div 
              className="border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={() => handleMarketTypeSelect('token-price')}
            >
              <div className="flex items-center justify-center mb-4 text-blue-400">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center mb-2">Proposal based on token price</h3>
              <p className="text-sm text-gray-400 text-center">
                Decide based on the expected impact of the proposal on the token price
              </p>
              <div className="mt-4 text-xs text-center text-gray-500">Coming soon</div>
            </div>
            
            {/* Protocol KPI Market Card */}
            <div 
              className="border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={() => handleMarketTypeSelect('protocol-kpi')}
            >
              <div className="flex items-center justify-center mb-4 text-green-400">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                  <path d="M7 12h2v5H7zm4-7h2v12h-2zm4 4h2v8h-2z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center mb-2">Proposal based on KPIs</h3>
              <p className="text-sm text-gray-400 text-center">
                Decide based on the expected impact of the proposal on the KPIs (e.g. TVL, volume, liquidity, etc.)
              </p>
            </div>
          </div>
        </div>
        
        {/* Video explanation */}
        <div className="border-t border-gray-700 pt-8">
          <LoomVideoExplanation />
        </div>
      </div>
    </div>
  );
}