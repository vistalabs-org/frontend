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

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Create the config using withPWA higher-order function
const config = withPWA(pwaConfig)(nextConfig);

// Use ESM export for Next.js
export default config;