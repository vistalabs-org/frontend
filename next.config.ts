import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// Note: withPWA is a higher-order function that returns another function
// This is why we need to use module.exports instead of export default
const config = withPWA(pwaConfig)(nextConfig as any);

// Use CommonJS export for Next.js
module.exports = config;

// This ensures TypeScript doesn't complain about the CommonJS export
export {};