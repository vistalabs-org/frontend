"use client";

export const runtime = 'edge';

export default function CreateProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="create-proposal-container">
      {children}
    </div>
  );
} 