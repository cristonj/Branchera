'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import TopNav from '@/components/TopNav';

export default function AboutPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <TopNav />
      
      {/* Main Content */}
      <div className="relative overflow-hidden">
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 pt-8">
          <main className="text-center max-w-6xl w-full">
            {/* Hero Section */}
            <div className="mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Our Story • Our Mission • Our Values
              </div>
              
              <div className="flex items-center justify-center mb-6">
                <img 
                  src="/logo.svg" 
                  alt="Branches Logo" 
                  className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mr-4"
                />
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight">
                  About Branches
                </h1>
              </div>
              
              <p className="text-xl md:text-2xl text-gray-700 font-light max-w-4xl mx-auto leading-relaxed mb-6">
                We&rsquo;re building the social platform that puts <span className="font-semibold text-black">people before profit</span> and <span className="font-semibold text-black">dialogue before engagement</span>
              </p>
            </div>

            {/* Mission Statement */}
            <div className="max-w-5xl mx-auto mb-16">
              <div className="bg-gray-50 border-l-4 border-black p-6 rounded-r-lg">
                <h2 className="text-2xl font-bold text-black mb-3">Our Founding Question</h2>
                <p className="text-xl md:text-2xl text-gray-800 font-medium italic leading-relaxed mb-3">
                  &ldquo;What if social media was about maximizing constructive dialogue instead of engagement?&rdquo;
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  This simple question drives everything we do. Instead of optimizing for time spent scrolling, we optimize for meaningful conversations. Instead of algorithmic feeds designed to capture attention, we provide transparent tools that help people think more clearly together.
                </p>
              </div>
            </div>

            {/* Core Principles */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Our Core Principles
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  These principles create an environment where meaningful conversations flourish and understanding deepens over time.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Attack Arguments, Not People */}
                <div className="bg-white rounded-2xl p-6 border-2 border-black">
                  <div className="w-14 h-14 mx-auto mb-4 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">&ldquo;Attack Arguments, Not People&rdquo;</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The golden rule of constructive discourse. Challenge ideas rigorously while treating people with respect. This principle is built into our platform design and community guidelines.
                  </p>
                </div>

                {/* Transparency First */}
                <div className="bg-white rounded-2xl p-6 border-2 border-black">
                  <div className="w-14 h-14 mx-auto mb-4 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Radical Transparency</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Every line of our code is open source. Every AI decision is explainable. Every fact-check shows its sources. No black boxes, no hidden algorithms, no secret sauce.
                  </p>
                </div>

                {/* Gets Out of Your Way */}
                <div className="bg-white rounded-2xl p-6 border-2 border-black">
                  <div className="w-14 h-14 mx-auto mb-4 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Grows With You</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Adaptive conversations that evolve with your interests. AI that learns your thinking patterns. A community that develops deeper insights together over time.
                  </p>
                </div>

                {/* Forever Free */}
                <div className="bg-white rounded-2xl p-6 border-2 border-black">
                  <div className="w-14 h-14 mx-auto mb-4 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Forever Free & Independent</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Built as a public good, not a profit center. No ads, no premium tiers, no paywalls. Not owned by a billionaire. Funded by community support, not by harvesting your attention or data.
                  </p>
                </div>
              </div>
            </div>

            {/* The Problem We&rsquo;re Solving */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  The Problem We&rsquo;re Solving
                </h2>
              </div>
              
              <div className="max-w-4xl mx-auto">
                <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg mb-6">
                  <h3 className="text-xl font-bold text-red-800 mb-3">Traditional Social Media Is Broken</h3>
                  <ul className="text-red-700 space-y-2">
                    <li>• Designed to maximize engagement, not understanding</li>
                    <li>• Rewards outrage and controversy over thoughtful discourse</li>
                    <li>• Opaque algorithms that manipulate what you see</li>
                    <li>• Ad-driven business models that treat users as products</li>
                    <li>• Echo chambers that reinforce existing beliefs</li>
                    <li>• Misinformation spreads faster than fact-checking</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-green-800 mb-3">Our Solution: Social Media That Respects Intelligence</h3>
                  <ul className="text-green-700 space-y-2">
                    <li>• AI-powered fact-checking with transparent sources</li>
                    <li>• Smart point extraction to navigate complex discussions</li>
                    <li>• Open source code that anyone can audit and improve</li>
                    <li>• Community-funded model with no advertising</li>
                    <li>• Tools that encourage diverse perspectives and critical thinking</li>
                    <li>• Quality over quantity in every interaction</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We&rsquo;re Different */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  How We&rsquo;re Different
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  We&rsquo;re not just another social platform — we&rsquo;re reimagining what social media could be.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Open Source */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">100% Open Source</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Every algorithm, every feature, every line of code is public. Help us build better tools for human dialogue.
                  </p>
                </div>

                {/* AI-Powered Truth */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">AI-Powered Truth</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Real-time fact-checking with web search verification. See the sources, understand the reasoning, trust the process.
                  </p>
                </div>

                {/* Community Governance */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Community-Driven</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Features and policies shaped by users, not corporate interests. Your voice matters in how we evolve.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="relative mb-16">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-10 border border-black/20 max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                  Join the Movement
                </h2>
                <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                  Be part of building social media that serves humanity, not corporate profits. Help us prove that constructive dialogue can thrive online.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  {user ? (
                    <Link
                      href="/dashboard"
                      className="flex-1 py-4 px-8 text-center bg-black text-white hover:bg-black/80 rounded-full transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
                    >
                      Back to Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="flex-1 py-4 px-8 text-center bg-black text-white hover:bg-black/80 rounded-full transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
                    >
                      Start Your First Discussion
                    </Link>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  Free account • No ads ever • Help shape the future of social media
                </p>
              </div>
            </div>

          </main>
        </div>
        
        {/* Footer */}
        <footer className="relative py-16 px-4 border-t border-black/20 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-6">
              <div className="flex items-center justify-center mb-2">
                <img 
                  src="/logo.svg" 
                  alt="Branches Logo" 
                  className="w-8 h-8 mr-3"
                />
                <h3 className="text-2xl font-bold text-black">Branches</h3>
              </div>
              <p className="text-gray-600">Branches grows with you</p>
            </div>
            <div className="flex justify-center space-x-8 mb-8">
              <Link href="/" className="text-gray-600 hover:text-black transition-colors">Home</Link>
              <Link href="/about" className="text-gray-600 hover:text-black transition-colors">About</Link>
              <Link href="/privacy" className="text-gray-600 hover:text-black transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-600 hover:text-black transition-colors">Terms</Link>
            </div>
            <div className="text-sm text-gray-500">
              <p>&copy; 2025 Branches. A platform that grows with you. Not owned by a billionaire.</p>
              <p className="text-xs text-gray-400 mt-2">
                &ldquo;What if social media was about maximizing constructive dialogue instead of engagement?&rdquo;
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}