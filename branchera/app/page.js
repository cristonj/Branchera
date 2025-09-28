'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white">
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
        <main className="text-center max-w-5xl w-full">
          
          {/* Hero */}
          <div className="mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              Community Owned • Open Source • Privacy First
            </div>
            
            <div className="flex items-center justify-center mb-8">
              <img 
                src="/logo.svg" 
                alt="Branches Logo" 
                className="w-20 h-20 md:w-24 md:h-24 mr-4"
              />
              <h1 className="text-6xl md:text-7xl font-bold text-black">
                Branches
              </h1>
            </div>
            
            <h2 className="text-2xl md:text-3xl mb-6 text-gray-800 max-w-4xl mx-auto leading-tight font-light">
              Social media where <span className="font-semibold text-black">you&rsquo;re the customer</span>, not the commodity
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-md mx-auto">
              <Link
                href="/login"
                className="flex-1 py-3 px-8 text-center bg-black text-white hover:bg-gray-800 rounded-full transition-all duration-300 font-semibold shadow-lg"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="flex-1 py-3 px-8 text-center bg-white text-black border-2 border-black hover:bg-black hover:text-white rounded-full transition-all duration-300 font-semibold"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Core Philosophy */}
          <div className="mb-20">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-8">
                <h3 className="text-xl font-bold text-black mb-4">The Problem</h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Most social platforms make money by selling your data to advertisers. 
                  This creates a fundamental conflict: their success depends on keeping you scrolling, 
                  not on building something you actually want to use.
                </p>
              </div>
              
              <div className="bg-black text-white rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-4">Our Solution</h3>
                <p className="text-lg leading-relaxed mb-4">
                  We think the app should be the product, not the users.
                </p>
                <p className="text-base text-gray-300">
                  When you pay for the app, we work for you. When advertisers pay for the app, we work for them.
                </p>
              </div>
            </div>
          </div>

          {/* What This Means */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-12">
              What This Actually Means
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Left side - Problems */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-red-700 mb-6">When You&rsquo;re The Product</h3>
                
                <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Engagement Over Everything</h4>
                  <p className="text-red-700 text-sm">
                    Algorithms designed to maximize time spent, not value delivered
                  </p>
                </div>
                
                <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Your Data Is The Revenue</h4>
                  <p className="text-red-700 text-sm">
                    Every click, scroll, and pause is tracked and monetized
                  </p>
                </div>
                
                <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Billionaire Control</h4>
                  <p className="text-red-700 text-sm">
                    Platform decisions serve shareholder interests, not user needs
                  </p>
                </div>
              </div>
              
              {/* Right side - Solutions */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-green-700 mb-6">When You&rsquo;re The Customer</h3>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Value Over Engagement</h4>
                  <p className="text-green-700 text-sm">
                    Features built to genuinely improve your social experience
                  </p>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Privacy By Design</h4>
                  <p className="text-green-700 text-sm">
                    No tracking, no data harvesting, no surveillance capitalism
                  </p>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Community Ownership</h4>
                  <p className="text-green-700 text-sm">
                    Platform decisions made by and for the people who use it
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features That Matter */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Built Different
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
              When your interests align with ours, everything changes
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-3 text-black">No Surveillance</h3>
                <p className="text-gray-600 text-sm">
                  We don&rsquo;t track you across the web or build shadow profiles. 
                  Your data stays yours.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-3 text-black">Algorithms For You</h3>
                <p className="text-gray-600 text-sm">
                  AI that helps you find what you&rsquo;re actually looking for, 
                  not what keeps you scrolling longest.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-3 text-black">Community Controlled</h3>
                <p className="text-gray-600 text-sm">
                  Open source, transparent, and governed by the people who use it. 
                  No billionaire overlords.
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-gray-900 text-white rounded-3xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready To Be The Customer?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Experience social media that works for you, not against you
            </p>
            
            <Link
              href="/login"
              className="inline-block py-4 px-12 bg-white text-black hover:bg-gray-100 rounded-full transition-all duration-300 font-bold text-lg shadow-lg"
            >
              Get Started
            </Link>
            
            <p className="text-sm text-gray-400 mt-4">
              Free to try • No credit card required
            </p>
          </div>

        </main>
      </div>
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-3">
                <img 
                  src="/logo.svg" 
                  alt="Branches Logo" 
                  className="w-8 h-8 mr-3"
                />
                <h3 className="text-xl font-bold text-black">Branches</h3>
              </div>
              <p className="text-gray-600 max-w-md">
                Social media where you&rsquo;re the customer, not the commodity.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-black mb-3">Platform</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link href="/dashboard" className="hover:text-black">Dashboard</Link></li>
                <li><Link href="/about" className="hover:text-black">About</Link></li>
                <li><Link href="#" className="hover:text-black">GitHub</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-black mb-3">Legal</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link href="/privacy" className="hover:text-black">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-black">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-sm text-gray-500">
              &copy; 2025 Branches. You&rsquo;re the customer, not the commodity.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}