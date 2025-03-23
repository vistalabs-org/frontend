import React, { useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MarketChart = ({ data = sampleChartData }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            domain={[0, 100]}
            tickFormatter={(tick) => `${tick}%`}
          />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Probability']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="yesPrice" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }}
            name="Yes Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Sample chart data showing a price history
const sampleChartData = [
  { date: '2025-01-01', yesPrice: 10 },
  { date: '2025-01-15', yesPrice: 12 },
  { date: '2025-02-01', yesPrice: 15 },
  { date: '2025-02-15', yesPrice: 18 },
  { date: '2025-03-01', yesPrice: 22 },
  { date: '2025-03-15', yesPrice: 19 },
  { date: '2025-04-01', yesPrice: 21 },
  { date: '2025-04-15', yesPrice: 25 },
  { date: '2025-05-01', yesPrice: 23 },
  { date: '2025-05-15', yesPrice: 26 },
  { date: '2025-06-01', yesPrice: 28 },
  { date: '2025-06-15', yesPrice: 24 },
  { date: '2025-07-01', yesPrice: 22 },
  { date: '2025-07-15', yesPrice: 20 },
  { date: '2025-08-01', yesPrice: 18 },
  { date: '2025-08-15', yesPrice: 15 },
  { date: '2025-09-01', yesPrice: 17 },
];

export default MarketChart;