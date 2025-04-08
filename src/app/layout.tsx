import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import NavBar from "@/components/NavBar";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Vista Market',
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
  const cookie = headerData.get("cookie") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers cookie={cookie}>
                <NavBar />
                <main className="flex-1 p-4 md:p-6">
                  {children}
                </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}