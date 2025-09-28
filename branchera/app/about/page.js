'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import TopNav from '@/components/TopNav';

export default function AboutPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4 pt-20">
        <main className="text-center max-w-4xl w-full">
          
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/logo.svg" 
              alt="Branches Logo" 
              className="w-16 h-16 md:w-20 md:h-20 mr-4"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-black">
              About Branches
            </h1>
          </div>
          
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-gray-50 border-l-4 border-black p-6 rounded-r-lg mb-8">
              <p className="text-xl text-gray-800 font-medium italic">
                &ldquo;At Branches, we think the app should be the product, not the users.&rdquo;
              </p>
            </div>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Most social apps sell user data to advertisers. We sell the app to users. 
              Simple, honest, sustainable.
            </p>
          </div>

          {/* Core differences */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-3 text-black">Community Owned</h3>
              <p className="text-gray-600">
                Not owned by a billionaire. Built by the community, for the community.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold mb-3 text-black">Your Interests First</h3>
              <p className="text-gray-600">
                The app adapts to what you actually care about, not what keeps you scrolling.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold mb-3 text-black">Open Source</h3>
              <p className="text-gray-600">
                Every line of code is public. No black boxes, no hidden algorithms.
              </p>
            </div>
          </div>

          <div className="bg-black text-white p-6 rounded-lg max-w-2xl mx-auto">
            <p className="text-lg font-semibold mb-2">
              You are the customer, not the commodity.
            </p>
            <p className="text-sm text-gray-300">
              Experience what social media feels like when it works for you.
            </p>
          </div>

        </main>
      </div>
      
      <footer className="py-8 px-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          &copy; 2025 Branches. The app should be the product, not the users.
        </p>
      </footer>
    </div>
  );
}