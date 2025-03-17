This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Note on Favicon generation
(https://realfavicongenerator.net/favicon-generator/nextjs/your-favicon-is-ready)
Make sure your favicon is properly setup:
npx realfavicon check 3000

## Step 7: Test your PWA

1. Build your app for production:
```bash
npm run build
# or
yarn build
```

2. Start the production server:
```bash
npm start
# or
yarn start
```

3. Open your app in Chrome and use DevTools to check the PWA status:
   - Open Chrome DevTools
   - Go to the "Application" tab
   - Check "Manifest" and "Service Workers" sections

## Step 8: Verify PWA functionality

- Check if your app works offline
- Verify if it's installable (you should see an install prompt in the browser)
- Test on mobile devices

## Step 9: Consider additional PWA features

- Push notifications
- Background sync
- Responsive design for various screen sizes
- Offline data persistence