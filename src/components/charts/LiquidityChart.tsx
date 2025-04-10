"use client";

import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';

// Define the structure for the MERGED data points
export interface CombinedChartDataPoint { 
  timestamp: number; // Unix timestamp (in milliseconds)
  yesAmount: number | null; // Amount for YES pool
  noAmount: number | null;  // Amount for NO pool
}

// Update props to accept the new merged data structure
interface Token0AmountChartProps { 
  data: CombinedChartDataPoint[]; // Use new data point type
  isLoading: boolean;
  isError: boolean;
}

// Helper to format the timestamp for the X-axis (no change)
const formatXAxis = (tickItem: number) => {
  try {
    return format(new Date(tickItem), 'MMM d, HH:mm'); // Assuming timestamp is already ms
  } catch (e) {
    return '';
  }
};

// Helper to format the tooltip label (no change)
const formatTooltipLabel = (label: number) => {
   try {
    return format(new Date(label), 'MMM d, yyyy HH:mm:ss'); // Assuming timestamp is already ms
   } catch (e) {
     return '';
   }
};

// Helper to format the Token0 amount value for the Y-axis (no change)
const formatToken0Amount = (value: number | null | undefined) => {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) return '0.00';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
};

// Renamed component accepts new props
export default function Token0AmountChart({ data, isLoading, isError }: Token0AmountChartProps) {
  if (isLoading) {
    return <div className="text-center text-sm text-muted-foreground py-4">Loading chart data...</div>;
  }

  if (isError) {
    return <div className="text-center text-sm text-red-500 py-4">Error loading chart data.</div>;
  }

  // Check if data is empty or contains only null values (after potential forward fill)
  const hasValidData = data && data.some(d => d.yesAmount !== null || d.noAmount !== null);
  if (!hasValidData) {
    return <div className="text-center text-sm text-muted-foreground py-4">No historical data available for this period.</div>;
  }

  // Custom formatter for Tooltip to show both values
  // Adjusted type signature for compatibility with recharts Formatter
  const tooltipFormatter = (value: number | string | Array<number | string>, name: string, entry: any, index: number): [React.ReactNode, string] => {
    // Value might be null/undefined if connectNulls is used, or not a number
    const numericValue = typeof value === 'number' ? value : null;
    const formattedValue = formatToken0Amount(numericValue);
    
    // Customize name based on dataKey (which is available in entry.payload[name])
    const displayName = name === 'yesAmount' ? 'Yes Pool tUSDC' : name === 'noAmount' ? 'No Pool tUSDC' : name;
    
    // Return format expected by recharts [value, name]
    return [formattedValue, displayName];
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={formatXAxis} 
          minTickGap={30}
          type="number"
          domain={['dataMin', 'dataMax']}
          scale="time"
        />
        <YAxis 
          tickFormatter={formatToken0Amount}
          domain={['auto', 'auto']} 
        />
        <Tooltip 
          labelFormatter={formatTooltipLabel}
          formatter={tooltipFormatter} // Use custom formatter
        />
        <Legend />
        <defs>
          {/* Define solid fills for shadows */}
          <linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/> 
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.8}/> {/* Make solid */} 
          </linearGradient>
          <linearGradient id="colorNo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/> 
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8}/> {/* Make solid */} 
          </linearGradient>
        </defs>
        {/* Area for YES Pool */}
        <Area 
          type="monotone" 
          dataKey="yesAmount" // Data key for Yes pool
          stroke="#10b981" 
          fillOpacity={1}
          fill="url(#colorYes)" 
          activeDot={{ r: 6 }}
          name="Yes Pool tUSDC" // Legend name
          connectNulls // Connect lines across null values (due to forward fill)
        />
        {/* Area for NO Pool */}
        <Area 
          type="monotone" 
          dataKey="noAmount" // Data key for No pool
          stroke="#ef4444" 
          fillOpacity={1}
          fill="url(#colorNo)" 
          activeDot={{ r: 6 }}
          name="No Pool tUSDC" // Legend name
          connectNulls // Connect lines across null values (due to forward fill)
        />
      </AreaChart>
    </ResponsiveContainer>
  );
} 