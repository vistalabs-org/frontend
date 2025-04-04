// components/MarketCard.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { truncateText } from '@/utils/text';

export type MarketCardProps = {
  title: string;
  description?: string;
  yesPrice?: number;
  noPrice?: number;
  url: string;
};

const MarketCard: React.FC<MarketCardProps> = ({
  title,
  description,
  yesPrice,
  noPrice,
  url
}) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 mb-4">
          {truncateText(description, 100)}
        </p>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm">
          <span className="text-gray-600">Yes Price: </span>
          <span className="font-medium text-gray-900">
            {yesPrice ? `${yesPrice.toFixed(3)} USDC` : 'N/A'}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-600">No Price: </span>
          <span className="font-medium text-gray-900">
            {noPrice ? `${noPrice.toFixed(3)} USDC` : 'N/A'}
          </span>
        </div>
      </div>
      
      <Link 
        href={url}
        className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to market
      </Link>
    </div>
  );
};

export default MarketCard;