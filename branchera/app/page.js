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
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 pt-8">
          <main className="text-center max-w-5xl w-full">
            {/* Brand Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              The App Should Be The Product • Not The Users
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/logo.svg" 
                alt="Branches Logo" 
                className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mr-4"
              />
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight">
                Branches
              </h1>
            </div>
            
            <p className="text-lg md:text-xl lg:text-2xl mb-6 text-gray-700 font-light max-w-4xl mx-auto leading-relaxed">
              At Branches, we think <span className="font-semibold text-black">the app should be the product</span>, not the users.
              <br />
              You're the customer, not the commodity being sold to advertisers.
            </p>

            {/* Early CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 max-w-md mx-auto">
              <Link
                href="/login"
                className="flex-1 py-3 px-6 text-center bg-black text-white border-0 hover:bg-black/80 rounded-full transition-all duration-300 font-semibold text-base shadow-lg hover:shadow-xl"
              >
                Try The Product
              </Link>
              <Link
                href="/login"
                className="flex-1 py-3 px-6 text-center bg-white text-black border border-black hover:bg-black hover:text-white rounded-full transition-all duration-300 font-semibold text-base"
              >
                Sign In
              </Link>
            </div>

            <p className="text-xs text-gray-500 mb-6">
              Not owned by a billionaire • No ads, ever • 
              <span className="font-medium text-gray-700">You are the customer</span>
            </p>
            
            <div className="max-w-3xl mx-auto mb-4">
              <div className="bg-gray-50 border-l-4 border-black p-4 rounded-r-lg">
                <p className="text-base md:text-lg text-gray-800 font-medium italic leading-relaxed">
                  &ldquo;Most social apps sell user data to advertisers. We sell the app to users.&rdquo;
                </p>
                <p className="text-xs text-gray-600 mt-2">— Our business model</p>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-black text-white p-3 rounded-lg text-center">
                <p className="text-base font-semibold">
                  &ldquo;When you're not paying for the product, you are the product.&rdquo;
                </p>
                <p className="text-xs text-gray-300 mt-1">Not at Branches.</p>
              </div>
            </div>
            
            <p className="text-base md:text-lg text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience social media where your interests come first, not advertiser interests. Where the app works for you, not against you.
            </p>

            {/* Key Features */}
            <div className="mt-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  When The App Is The Product
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Everything changes when you're the customer instead of the product. Here's what that looks like.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-12">
                {/* No Surveillance */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">No Surveillance</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We don't track you across the web, build shadow profiles, or harvest your data. Your privacy isn't our business model.
                  </p>
                </div>

                {/* Your Interests First */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Your Interests First</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The app adapts to what you actually care about, not what keeps you scrolling longest. Your genuine interests drive the experience.
                  </p>
                </div>

                {/* Transparent Business Model */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Transparent Business Model</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We make money by building a great app that users want to pay for. Simple, honest, sustainable.
                  </p>
                </div>
              </div>

              {/* Comparison Row */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {/* No Engagement Hacking */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">No Engagement Hacking</h3>
                  <p className="text-gray-600 leading-relaxed">
                    No infinite scroll, no notification spam, no dark patterns designed to steal your time and attention.
                  </p>
                </div>

                {/* Community Owned */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Community Owned</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Not owned by a billionaire. Built by the community, for the community. Your voice shapes our development.
                  </p>
                </div>

                {/* Open Source */}
                <div className="group relative bg-white rounded-2xl p-8 border border-black/20 hover:border-black transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">Fully Open Source</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Every line of code is public. No black boxes, no hidden algorithms. See exactly how the app works.
                  </p>
                </div>
              </div>
            </div>

            {/* The Difference Section */}
            <div className="mt-20 mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  The Difference Is Everything
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  When you're the customer instead of the product, every aspect of your experience changes.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* Other Apps */}
                <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-200">
                  <h3 className="text-2xl font-bold mb-6 text-red-900 text-center">Other Social Apps</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="text-red-800"><strong>Users are the product</strong> sold to advertisers</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="text-red-800">Algorithms optimize for <strong>engagement</strong>, not your interests</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="text-red-800">Owned by <strong>billionaires</strong> with their own agendas</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="text-red-800">Dark patterns designed to <strong>steal your time</strong></p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="text-red-800">Surveillance and <strong>data harvesting</strong></p>
                    </div>
                  </div>
                </div>

                {/* Branches */}
                <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-200">
                  <h3 className="text-2xl font-bold mb-6 text-green-900 text-center">Branches</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-green-800"><strong>The app is the product</strong> sold to users</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-green-800">Algorithms optimize for <strong>your interests</strong>, not engagement</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-green-800">Owned by <strong>the community</strong>, not billionaires</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-green-800">Clean design that <strong>respects your time</strong></p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-green-800">Privacy-first, <strong>no data harvesting</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="relative mt-16 mb-16">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 border border-black/20 max-w-5xl mx-auto text-center">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Join The Movement • Be The Customer, Not The Product
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                  Ready To Be The Customer?
                </h2>
                
                <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
                  Experience what social media feels like when the app works for you, not against you. When your interests come first.
                </p>

                {/* Value Props */}
                <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 font-medium">You are the customer</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 font-medium">Not owned by a billionaire</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 font-medium">The app is the product</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Link
                    href="/login"
                    className="flex-1 py-4 px-8 text-center bg-black text-white hover:bg-black/80 rounded-full transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
                  >
                    Try The Product
                  </Link>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  Free to try • No credit card required • 
                  <span className="font-semibold text-gray-700">Experience the difference</span>
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
                <div className="flex items-center mb-3">
                  <img 
                    src="/logo.svg" 
                    alt="Branches Logo" 
                    className="w-8 h-8 mr-3"
                  />
                  <h3 className="text-2xl font-bold text-black">Branches</h3>
                </div>
                <p className="text-gray-600 mb-4 max-w-md">
                  At Branches, we think the app should be the product, not the users. You're the customer, not the commodity.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                    Community Owned
                  </div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></span>
                    Open Source
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
                &copy; 2025 Branches. A platform that grows with you. Not owned by a billionaire. You are not the product.
              </p>
              <p className="text-xs text-gray-400">
                &ldquo;At Branches, we think the app should be the product, not the users.&rdquo;
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}