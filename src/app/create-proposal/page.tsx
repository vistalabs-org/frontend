"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoomVideoExplanation } from '@/components/LoomVideoExplanation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChartHorizontal } from 'lucide-react';
import { toast } from "sonner";

export default function CreateProposalSelection() {
  const router = useRouter();

  const handleMarketTypeSelect = (type: 'token-price' | 'protocol-kpi') => {
    console.log('Selected market type:', type);
    
    if (type === 'protocol-kpi') {
      console.log('Navigating to KPI market page');
      router.push('/create-proposal/kpi-market');
    } else {
      toast("Coming Soon", {
        description: "Token price markets are currently under development.",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create New Prediction Market</CardTitle>
            <CardDescription className="text-center">
              Choose the type of market you want to create based on your proposal.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Token Price Market Card */}
            <Card
              className="cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center text-center p-6 group"
              onClick={() => handleMarketTypeSelect('token-price')}
            >
              <TrendingUp className="w-12 h-12 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                Token Price Market
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Predict the future price of a specific token.
              </p>
              <span className="text-xs text-muted-foreground font-medium px-2 py-1 rounded bg-muted">
                Coming soon
              </span>
            </Card>
            
            {/* Protocol KPI Market Card */}
            <Card
              className="cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center text-center p-6 group"
              onClick={() => handleMarketTypeSelect('protocol-kpi')}
            >
              <BarChartHorizontal className="w-12 h-12 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                KPI-Based Market
              </h3>
              <p className="text-sm text-muted-foreground">
                Predict the outcome based on specific protocol Key Performance Indicators (e.g., TVL, Volume).
              </p>
            </Card>
          </CardContent>
        </Card>
        
        {/* Video explanation in its own card */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Watch this short video to understand the process.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoomVideoExplanation />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}