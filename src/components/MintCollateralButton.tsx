"use client";

import React, { useState } from 'react';
import { useMintCollateral } from '@/hooks/useMintCollateral';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';

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
        <Input
          type="number"
          value={amount}
          onChange={(e) => {
            setError(null);
            const value = e.target.value.replace(/[^0-9.]/g, '');
            if (/^\d*\.?\d*$/.test(value)) {
              setAmount(value);
            }
          }}
          placeholder="Amount to mint"
          className="flex-1"
          disabled={isMinting}
        />
        <Button
          onClick={handleMint}
          disabled={isMinting || !amount || !isClientReady}
        >
          {isMinting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Minting...</>
          ) : (
            'Mint'
          )}
        </Button>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
      
      {!isClientReady && (
        <p className="mt-2 text-sm text-muted-foreground">
          Initializing wallet connection...
        </p>
      )}
    </div>
  );
} 