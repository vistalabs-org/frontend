// components/MarketCard.tsx
import React from 'react';
import Link from 'next/link';
import { truncateText } from '@/utils/text';

// --- Import Shadcn UI Components ---
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export type MarketCardProps = {
  title: string;
  description?: string;
  yesPrice?: number;
  noPrice?: number;
  url: string;
  id?: string;
};

const MarketCard: React.FC<MarketCardProps> = ({
  title,
  description,
  yesPrice,
  noPrice,
  url,
  id // Ensure id prop is received if used
}) => {
  return (
    <Card className="w-full flex flex-col h-full"> {/* Added h-full for consistent height */}
      <CardHeader> 
        <CardTitle className="line-clamp-2">{title}</CardTitle> {/* Added line-clamp */}
        {/* Explicitly return null if description is falsy */}
        {description ? (
          <CardDescription className="line-clamp-3">{truncateText(description, 100)}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-2 gap-4"> 
        {/* Use success colors */}
        <div className="flex flex-col items-center justify-center space-y-1 p-4 rounded-md bg-success/10"> 
          <p className="text-sm font-medium text-success">Yes</p> 
          <p className="text-xl font-semibold text-success"> 
             {yesPrice !== undefined ? `${(yesPrice * 100).toFixed(1)}%` : 'N/A'} 
          </p>
        </div>
        {/* Use destructive colors */}
        <div className="flex flex-col items-center justify-center space-y-1 p-4 rounded-md bg-destructive/10"> 
          <p className="text-sm font-medium text-destructive">No</p> 
          <p className="text-xl font-semibold text-destructive"> 
             {noPrice !== undefined ? `${(noPrice * 100).toFixed(1)}%` : 'N/A'} 
          </p>
        </div>
      </CardContent>
      <CardFooter> 
        <Link href={url} className="w-full" passHref>
          <Button className="w-full">
            View Market
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default MarketCard;