"use client";

import React, { useState } from 'react';
import { useMintCollateral } from '@/hooks/useMintCollateral';

interface MintCollateralButtonProps {
  collateralAddress: `0x${string}`;
}

export function MintCollateralButton({ collateralAddress }: MintCollateralButtonProps) {
  const [amount, setAmount] = useState('');
  const { mint, isMinting, isClientReady } = useMintCollateral();
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    try {
      setError(null);
      if (!isClientReady) {
        setError("Smart account client not ready. Please try again.");
        return;
      }
      
      await mint(collateralAddress, amount);
      setAmount(''); // Clear input after successful mint
    } catch (error) {
      console.error('Failed to mint:', error);
      setError(error instanceof Error ? error.message : "Failed to mint tokens");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <div className="relative rounded-md flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-secondary sm:text-sm">$</span>
          </div>
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              setError(null);
              const value = e.target.value.replace(/[^0-9.]/g, '');
              setAmount(value);
            }}
            placeholder="0.00"
            className="block w-full pl-7 pr-12 sm:text-sm border-border-color rounded-md bg-card-background text-primary"
            style={{ 
              backgroundColor: 'var(--card-background)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            disabled={isMinting}
          />
        </div>
        <button
          onClick={handleMint}
          disabled={isMinting || !amount || !isClientReady}
          className="banner-button px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          {isMinting ? 'Minting...' : 'Mint'}
        </button>
      </div>
      
      {error && (
        <p className="mt-2 text-red text-sm">{error}</p>
      )}
      
      {!isClientReady && (
        <p className="mt-2 text-secondary text-sm">
          Initializing wallet connection...
        </p>
      )}
    </div>
  );
} 