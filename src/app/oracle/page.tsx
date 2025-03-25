"use client";
import OracleExample from '@/components/OracleExample';
import Link from 'next/link';

export default function OraclePage() {
  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 text-xl font-bold text-blue-600">
                Prediction Markets
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Home
              </Link>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600"
          >
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Markets
          </Link>
        </div>
        
        <OracleExample />
      </div>
    </main>
  );
} 