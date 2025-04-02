import Link from 'next/link';

// Add edge runtime configuration
export const runtime = 'edge';

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find the requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  );
}
