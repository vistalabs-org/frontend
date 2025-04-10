"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useCreateMarket } from '@/hooks/useCreateMarket';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react'; // Import icon for error alert

export default function KpiMarketForm() {
  const router = useRouter();
  const { address, chain } = useAccount();
  const { isReady } = useCreateMarket();
  
  // Initialize with proper form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '7', // Keep as string to match select value
    collateralAmount: '10',
    collateralAddress: '0xA5a2250b0170bdb9bd0904C0440717f00A506023', // test usdc unichain sepolia
    curveId: 0
  });

  
  const [error, setError] = useState<string | null>(null);
  const [hasEnoughBalance, setHasEnoughBalance] = useState<boolean | null>(null);

  // Form handling logic
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler specifically for ShadCN Select component
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      duration: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    
    try {
      // Validate required fields (though HTML 'required' helps)
      if (!formData.title || !formData.description || !formData.collateralAmount) {
        setError("Please fill in all required fields.");
        return;
      }
      localStorage.setItem('marketFormData', JSON.stringify(formData));
      console.log('Form data saved to localStorage');
      
      // Use direct navigation instead of router
      console.log('Redirecting to deploy page');
      window.location.href = '/create-proposal/deploy';
    } catch (error) {
      console.error('Error during form submission:', error);
      const message = error instanceof Error ? error.message : 'Failed to save form data. Please try again.';
      setError(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create KPI Market</CardTitle>
          <CardDescription>
            Define the details for your Key Performance Indicator market.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Market Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Will Protocol X reach 1M TVL by EOY?"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Market Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Provide details about this market, including resolution criteria..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Select name="duration" value={formData.duration} onValueChange={handleSelectChange}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collateralAmount">Collateral Amount (USDC)</Label>
              <Input
                type="number"
                id="collateralAmount"
                name="collateralAmount"
                value={formData.collateralAmount}
                onChange={handleChange}
                min="1"
                required
              />
              <p className="text-sm text-muted-foreground">
                This amount provides initial liquidity and collateral for the market.
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 pt-6">
          <Button
            type="submit"
            form="kpi-market-form" // Associate button with form via id
            disabled={!isReady} // Disable if wallet not ready/connected
            className="w-full"
          >
            Continue to Next Step
          </Button>
          
          {!isReady && (
            <p className="text-sm text-destructive text-center">
              Please connect your wallet to continue.
            </p>
          )}
        </CardFooter>
      </Card>
      <form id="kpi-market-form" onSubmit={handleSubmit}></form>
    </div>
  );
}
