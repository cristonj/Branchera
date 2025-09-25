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
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 pt-20">
          <main className="text-center max-w-5xl w-full">
            {/* Brand Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
              Where Progress Happens
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-black leading-tight">
              Branchera
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl mb-6 text-gray-700 font-light max-w-4xl mx-auto leading-relaxed">
              The AI-powered social platform where <span className="font-semibold text-black">clarity and logic</span> beat distraction and misinformation
            </p>
            
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Share your thoughts through thoughtful text with automatic AI fact-checking, engage in meaningful discussions with smart point extraction, and be part of a community that values truth and quality.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 max-w-lg mx-auto">
              <Link
                href="/login"
                className="flex-1 py-4 px-8 text-center bg-black text-white border-0 hover:bg-black/80 rounded-full transition-all duration-300 font-semibold text-lg"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="flex-1 py-4 px-8 text-center bg-white text-black border border-black hover:bg-black hover:text-white rounded-full transition-all duration-300 font-semibold text-lg"
              >
                Sign In
              </Link>
            </div>

            {/* Key Features */}
            <div className="mt-24">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Why Choose Branchera?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Built for meaningful conversations and authentic connections
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                {/* AI-Powered Fact Checking */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">AI-Powered Fact Checking</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Powered by Gemini AI, every post is automatically fact-checked with web search verification. Claims are analyzed and verified in real-time.
                  </p>
                </div>

                {/* AI Point Generation */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Smart AI Point Extraction</h3>
                  <p className="text-gray-600 leading-relaxed">
                    AI automatically extracts key points from discussions and replies, making complex conversations easier to follow and engage with.
                  </p>
                </div>

                {/* Web Search Verification */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Web Search Verification</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Claims are verified against real web sources. See the actual search results and sources used to verify information.
                  </p>
                </div>


                {/* No Ads or Spam */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Ad-Free Experience</h3>
                  <p className="text-gray-600 leading-relaxed">
                    No advertisements, no spam, no algorithmic manipulation. Just pure, meaningful conversations focused on substance over profit.
                  </p>
                </div>
              </div>
            </div>


            {/* Call to Action */}
            <div className="relative mt-20 mb-20">
              <div className="bg-white rounded-3xl p-12 border border-black/20 max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black">
                  Ready to join the conversation?
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Experience AI-powered discussions where truth matters and your ideas are fact-checked in real-time. 
                  Join a community focused on clarity, logic, and evidence-based engagement.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Link
                    href="/login"
                    className="flex-1 py-4 px-8 text-center bg-black text-white hover:bg-black/80 rounded-full transition-all duration-300 font-bold text-lg"
                  >
                    Start Your First Discussion
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-6">
                  No spam, no ads, just AI-verified meaningful conversations
                </p>
              </div>
            </div>
          </main>
        </div>
        
        {/* Footer */}
        <footer className="relative py-12 px-4 border-t border-black/20 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-black mb-2">Branchera</h3>
              <p className="text-gray-600">Where Progress Happens</p>
            </div>
            <div className="text-sm text-gray-500">
              <p>&copy; 2025 Branchera. Building a better social experience.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}