import { config } from "@root/config";
import { cookieToInitialState } from "@account-kit/core";
import { headers } from "next/headers";
import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vista Markets",
  description: "Deployed on Unichain Prediction Market EigenLayer",
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vista Markets',
  },
};

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
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={inter.className}
      >
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