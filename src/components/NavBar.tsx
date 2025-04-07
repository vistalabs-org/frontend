// components/Header.tsx
'use client';

import { Roboto } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const roboto = Roboto({
  weight: ['700'],
  subsets: ['latin'],
});

const NavBar = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      {/* Left - Create Proposal Link */}
      <div className="flex-1">
        <Link 
          href="/create-proposal" 
          className="text-gray-600 hover:text-blue-600 transition-colors"
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
          <h1 className={`${roboto.className} text-xl text-gray-900`}>Vista Market</h1>
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