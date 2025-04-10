// next.config.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const withPWA = require('next-pwa');

const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Conditionally apply PWA configuration only for production builds
let config = nextConfig;
if (process.env.NODE_ENV === 'production') {
  const withPWA = require('next-pwa')(pwaConfig);
  config = withPWA(nextConfig);
}

// Use ESM export for Next.js
export default config;