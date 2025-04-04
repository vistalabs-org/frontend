import { createPagesFunctionHandler } from '@cloudflare/next-on-pages';

export default createPagesFunctionHandler({
  // Optional: Specify path to your Next.js app
  assetsPath: ".next"
});