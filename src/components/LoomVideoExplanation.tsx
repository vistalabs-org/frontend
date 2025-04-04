import React from 'react';

export const LoomVideoExplanation = () => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">How It Works</h2>
      <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden">
        <iframe 
          src="https://www.loom.com/embed/14eebc7c6f0e4312b68431ae8b6d0189?sid=011b6192-4b9f-442a-bd1f-b62b4614c2b3" 
          frameBorder="0" 
          webkitAllowFullScreen
          mozAllowFullScreen
          allowFullScreen 
          className="absolute top-0 left-0 w-full h-full"
        ></iframe>
      </div>
      <p className="text-sm text-gray-400 mt-2">
        Watch this short video to understand how prediction markets work.
      </p>
    </div>
  );
}; 