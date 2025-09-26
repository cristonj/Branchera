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
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Open Source • Ad-Free • Always
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-black leading-tight">
              Branchera
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl mb-6 text-gray-700 font-light max-w-4xl mx-auto leading-relaxed">
              The social app that <span className="font-semibold text-black">gets out of your way</span> — built for constructive dialogue, not endless scrolling
            </p>
            
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-gray-50 border-l-4 border-black p-6 rounded-r-lg">
                <p className="text-lg md:text-xl text-gray-800 font-medium italic leading-relaxed">
                  &ldquo;What if social media was about maximizing constructive dialogue instead of engagement?&rdquo;
                </p>
                <p className="text-sm text-gray-600 mt-2">— Our founding mission</p>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-black text-white p-4 rounded-lg text-center">
                <p className="text-lg font-semibold">
                  &ldquo;Attack arguments, not people.&rdquo;
                </p>
                <p className="text-sm text-gray-300 mt-1">The golden rule of constructive discourse</p>
              </div>
            </div>
            
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience AI-powered fact-checking, transparent discussions with smart point extraction, and a community where substance matters more than likes. Forever free, forever open source, forever ad-free.
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
                  A Social Platform Built Differently
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  No dark patterns, no engagement algorithms, no hidden agendas. Just transparent, open-source tools for meaningful dialogue.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
                {/* Open Source & Transparent */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Fully Open Source</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Every line of code is public and auditable. No black boxes, no secret algorithms. See exactly how your data is handled and help us build better features.
                  </p>
                </div>

                {/* Gets Out of Your Way */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Gets Out of Your Way</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Clean, distraction-free interface. No infinite scroll, no notification spam, no attention hijacking. Focus on what matters: the conversation.
                  </p>
                </div>

                {/* Forever Free & Ad-Free */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Forever Free & Ad-Free</h3>
                  <p className="text-gray-600 leading-relaxed">
                    No ads, no premium tiers, no paywalls. Built as a public good, funded by community support, not by harvesting your attention or data.
                  </p>
                </div>
              </div>

              {/* AI-Powered Features Row */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* AI-Powered Fact Checking */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">AI-Powered Fact Checking</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Powered by Gemini AI with transparent web search verification. See exactly what sources were checked and how claims were verified.
                  </p>
                </div>

                {/* Smart Point Extraction */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Smart Point Extraction</h3>
                  <p className="text-gray-600 leading-relaxed">
                    AI automatically identifies key discussion points, making complex conversations navigable and helping you respond to specific arguments.
                  </p>
                </div>

                {/* Quality Over Quantity */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Quality Over Quantity</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Thoughtful text-based discussions reward depth over viral content. No likes, no vanity metrics — just meaningful engagement.
                  </p>
                </div>
              </div>
            </div>

            {/* Coming Soon Features */}
            <div className="mt-32 mb-20">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Coming Soon
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  We&rsquo;re constantly building new features to make constructive dialogue even more powerful and accessible.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {/* Mobile Apps */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-300 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 sm:w-6 sm:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">Native Mobile Apps</h3>
                  <p className="text-sm text-gray-600">
                    iOS and Android apps with offline reading and push notifications for meaningful replies.
                  </p>
                </div>

                {/* Real-time Collaboration */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-300 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 sm:w-6 sm:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">Live Collaboration</h3>
                  <p className="text-sm text-gray-600">
                    Real-time collaborative editing for group research and shared document creation.
                  </p>
                </div>

                {/* Advanced AI Moderation */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-300 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 sm:w-6 sm:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">Smart Moderation</h3>
                  <p className="text-sm text-gray-600">
                    AI-assisted community moderation that promotes healthy discourse while preventing harassment.
                  </p>
                </div>

                {/* Multi-language Support */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-300 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 sm:w-6 sm:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">Global Discussions</h3>
                  <p className="text-sm text-gray-600">
                    Multi-language support with AI translation to connect diverse perspectives worldwide.
                  </p>
                </div>
              </div>

              {/* Community Roadmap Note */}
              <div className="text-center mt-12">
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-black text-white text-sm font-medium">
                    <svg className="w-5 h-5 sm:w-4 sm:h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  Want to help shape our roadmap? Join our community discussions
                </div>
              </div>
            </div>


            {/* Call to Action */}
            <div className="relative mt-20 mb-20">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 border border-black/20 max-w-5xl mx-auto text-center">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Join the Beta • Help Shape the Future
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black">
                  Ready for Social Media That Respects Your Intelligence?
                </h2>
                
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Be part of a community that values thoughtful discourse over viral content. Where every claim is fact-checked, every discussion is transparent, and your time is respected.
                </p>

                {/* Value Props */}
                <div className="grid md:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 font-medium">No ads, ever</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 font-medium">100% open source</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 font-medium">AI-powered fact checking</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Link
                    href="/login"
                    className="flex-1 py-4 px-8 text-center bg-black text-white hover:bg-black/80 rounded-full transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
                  >
                    Start Your First Discussion
                  </Link>
                </div>
                
                <p className="text-sm text-gray-500 mt-6">
                  Free account • No credit card required • 
                  <span className="font-semibold text-gray-700">Be one of the first to</span> have better conversations
                </p>
              </div>
            </div>
          </main>
        </div>
        
        {/* Footer */}
        <footer className="relative py-16 px-4 border-t border-black/20 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {/* Brand Column */}
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold text-black mb-3">Branchera</h3>
                <p className="text-gray-600 mb-4 max-w-md">
                  The social app that gets out of your way. Open source, ad-free, and designed for constructive dialogue instead of endless engagement.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                    Open Source
                  </div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></span>
                    Ad-Free Forever
                  </div>
                </div>
              </div>
              
              {/* Links Column */}
              <div>
                <h4 className="text-lg font-semibold text-black mb-4">Platform</h4>
                <ul className="space-y-2 text-gray-600">
                  <li><Link href="/dashboard" className="hover:text-black transition-colors">Dashboard</Link></li>
                  <li><Link href="/login" className="hover:text-black transition-colors">Sign In</Link></li>
                  <li><Link href="#" className="hover:text-black transition-colors">GitHub</Link></li>
                  <li><Link href="#" className="hover:text-black transition-colors">Community</Link></li>
                </ul>
              </div>
              
              {/* Legal Column */}
              <div>
                <h4 className="text-lg font-semibold text-black mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-600">
                  <li><Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link></li>
                  <li><Link href="#" className="hover:text-black transition-colors">License (MIT)</Link></li>
                </ul>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="border-t border-black/10 pt-8 text-center">
              <p className="text-sm text-gray-500 mb-2">
                &copy; 2025 Branchera. Building social media that respects your intelligence.
              </p>
              <p className="text-xs text-gray-400">
                &ldquo;What if social media was about maximizing constructive dialogue instead of engagement?&rdquo;
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}