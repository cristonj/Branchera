import Link from 'next/link';

export default function DiscussionNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg 
            className="w-24 h-24 mx-auto text-gray-400"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Discussion Not Found
        </h1>
        
        <p className="text-gray-600 mb-8">
          The discussion you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/feed"
            className="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 font-medium transition-colors"
          >
            Browse Discussions
          </Link>
          
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-full hover:bg-gray-50 font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
