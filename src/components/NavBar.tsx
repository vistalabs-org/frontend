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
    <nav className="flex items-center justify-between px-6 py-4 bg-[#1E2631] border-b border-[#2D3745]">
      <div className="flex-1">
        {/* Empty div to maintain spacing */}
      </div>

      {/* Center - Logo and Name */}
      <div className="flex items-center gap-3">
        <div className="relative w-6 h-6">
          <Image 
            src="/logo.svg" 
            alt="Vista Market Logo" 
            width={24} 
            height={24}
            priority
          />
        </div>
        <h1 className={`${roboto.className} text-xl text-white`}>Vista Market</h1>
      </div>

      {/* Right - Connect Button */}
      <div className="flex-1 flex justify-end">
        <ConnectButton />
      </div>
    </nav>
  );
};

export default NavBar;