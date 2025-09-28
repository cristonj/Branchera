'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import TopNav from '@/components/TopNav';

export default function AboutPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      
      <div className="relative p-4 pt-24">
        <main className="max-w-5xl mx-auto">
          
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Our Story • Our Mission • Our Difference
            </div>
            
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
            
            <h2 className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
              We&rsquo;re building social media that works for you, not against you
            </h2>
          </div>

          {/* The Story */}
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div>
              <h3 className="text-2xl font-bold text-black mb-6">The Problem We Saw</h3>
              <div className="space-y-4 text-gray-700">
                <p>
                  Social media platforms make billions by selling user data to advertisers. 
                  This creates a fundamental misalignment: their success depends on maximizing 
                  your screen time, not your satisfaction.
                </p>
                <p>
                  The result? Algorithms designed to capture attention rather than deliver value. 
                  Features built to increase engagement rather than improve your experience. 
                  Platforms that serve advertisers first, users second.
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-black mb-6">Our Different Approach</h3>
              <div className="space-y-4 text-gray-700">
                <p>
                  We believe the app should be the product, not the users. 
                  When you pay for software, the software works for you. 
                  When advertisers pay for software, the software works for them.
                </p>
                <p>
                  This simple shift changes everything: how we design features, 
                  what our algorithms optimize for, and whose interests we serve. 
                  Your interests become our interests.
                </p>
              </div>
            </div>
          </div>

          {/* Core Principles */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-black text-center mb-12">
              How We&rsquo;re Different
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">Transparent Business Model</h3>
                <p className="text-gray-600">
                  We make money by building great software that users want to pay for. 
                  No data harvesting, no surveillance, no hidden agendas.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">Community Ownership</h3>
                <p className="text-gray-600">
                  Not owned by a billionaire with their own agenda. 
                  Built by the community, governed by the community, for the community.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">Radical Transparency</h3>
                <p className="text-gray-600">
                  Every line of code is open source. Every algorithm is explainable. 
                  No black boxes, no secret sauce, no hidden mechanisms.
                </p>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="bg-black text-white rounded-3xl p-12 text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-6">
              To prove that social media can work for users instead of against them. 
              To show that when you align business incentives with user interests, 
              everyone wins.
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-white text-black rounded-full font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              You&rsquo;re the customer, not the commodity
            </div>
          </div>

          {/* Join Us */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
              Ready To Experience The Difference?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join a social platform that actually works in your interest
            </p>
            
            <Link
              href="/login"
              className="inline-block py-3 px-8 bg-black text-white hover:bg-gray-800 rounded-full transition-all duration-300 font-semibold"
            >
              Get Started
            </Link>
          </div>

        </main>
      </div>
      
      <footer className="py-8 px-4 border-t border-gray-200 text-center mt-20">
        <p className="text-sm text-gray-500">
          &copy; 2025 Branches. Social media where you&rsquo;re the customer, not the commodity.
        </p>
      </footer>
    </div>
  );
}