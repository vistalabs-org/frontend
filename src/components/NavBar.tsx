// components/Header.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NavBar = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
      {/* Left - Create Proposal Link */}
      <div className="flex-1">
        <Link
          href="/create-proposal"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Create Proposal
        </Link>
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

      {/* Right - Connect Button with Network Selection */}
      <div className="flex-1 flex justify-end items-center">
        <ConnectButton />
      </div>
    </nav>
  );
};

export default NavBar;