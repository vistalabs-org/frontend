// components/Header.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import React from 'react';
import HowItWorksOverlay from './HowItWorksOverlay';

const NavBar = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
      {/* Left - Create Proposal Link */}
      <div className="flex-1 flex items-center gap-4">
        <Link
          href="/create-proposal"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Create Proposal
        </Link>
        <HowItWorksOverlay />
      </div>

      {/* Center - Logo and Name */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-6 h-6">
            <Image 
              src="/logo.svg" 
              alt="Vista Market Logo" 
              width={24} 
              height={24}
              priority
            />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Vista Market</h1>
        </Link>
      </div>

      {/* Right - Theme Toggle and Connect Button */}
      <div className="flex-1 flex justify-end items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          <Sun className="h-[1.2rem] w-[1.2rem] sun-icon" />
          <Moon className="h-[1.2rem] w-[1.2rem] moon-icon" />
        </Button>
        <ConnectButton />
      </div>
    </nav>
  );
};

export default NavBar;