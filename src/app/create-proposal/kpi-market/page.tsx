"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useCreateMarket } from '@/hooks/useCreateMarket';

export default function KpiMarketForm() {
  const router = useRouter();
  const { address, chain } = useAccount();
  const { checkBalance, isReady } = useCreateMarket();
  
  // Initialize with proper form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 7, // Default 7 days
    collateralAmount: '10',
    collateralAddress: '0x77a4d2324d8330a04a0187a36d35fa4b542d17eb', // test usdc unichain sepolia
    curveId: 0
  });
  
  const [error, setError] = useState<string | null>(null);
  const [hasEnoughBalance, setHasEnoughBalance] = useState<boolean | null>(null);

  // Form handling logic
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    
    try {
      // Store form data in localStorage
      localStorage.setItem('marketFormData', JSON.stringify(formData));
      console.log('Form data saved to localStorage');
      
      // Use direct navigation instead of router
      console.log('Redirecting to deploy page');
      window.location.href = '/create-proposal/deploy';
    } catch (error) {
      console.error('Error during form submission:', error);
      setError('Failed to save form data. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create KPI Market</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
            Market Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Will Protocol X reach 1M TVL by EOY?"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
            Market Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Provide details about this market, including resolution criteria..."
            required
          />
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-gray-700 font-medium mb-2">
            Duration (days)
          </label>
          <select
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value={1}>1 day</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="collateralAmount" className="block text-gray-700 font-medium mb-2">
            Collateral Amount (USDC)
          </label>
          <input
            type="number"
            id="collateralAmount"
            name="collateralAmount"
            value={formData.collateralAmount}
            onChange={handleChange}
            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            min="1"
            required
          />
          <p className="mt-2 text-sm text-gray-600">
            This amount will be used as collateral for the market.
          </p>
        </div>
        
        <div className="pt-6">
          <button
            type="submit"
            disabled={!isReady}
            className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Continue to Next Step
          </button>
          
          {!isReady && (
            <p className="mt-2 text-red-600 text-sm text-center">
              Please connect your wallet to create a market
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
