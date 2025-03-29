import { config } from "@root/config";
import { cookieToInitialState } from "@account-kit/core";
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Market',
  description: 'Vista Market - Prediction Markets on Uniswap v4',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vista Markets',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    // Persist state across pages
  // https://accountkit.alchemy.com/react/ssr#persisting-the-account-state
  const headerData = await headers();
  const initialState = cookieToInitialState(
    config,
    headerData.get("cookie") ?? undefined
  );

  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <Providers initialState={initialState}>
              <div className="app-container">
          
                <NavBar />
          
                <main className="main-content">
                  {children}
                </main>
              </div>
        </Providers>
      </body>
    </html>
  );
}