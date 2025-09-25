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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-purple-50/30 to-pink-100/20"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-orange-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 pt-20">
          <main className="text-center max-w-5xl w-full">
            {/* Brand Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-8 border border-blue-200/50">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Where Progress Happens
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent leading-tight">
              Branchera
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl mb-6 text-gray-700 font-light max-w-4xl mx-auto leading-relaxed">
              The social platform where <span className="font-semibold text-blue-700">clarity and logic</span> beat distraction and misinformation
            </p>
            
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Share your thoughts through thoughtful text, engage in meaningful discussions, and be part of a community that values quality over quantity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 max-w-lg mx-auto">
              <Link
                href="/login"
                className="group relative flex-1 py-4 px-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 rounded-full transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/login"
                className="flex-1 py-4 px-8 text-center bg-white/80 backdrop-blur-sm text-gray-800 border border-gray-200 hover:bg-white hover:border-gray-300 rounded-full transition-all duration-300 font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-1"
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
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Text-Based Discussions */}
              <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-700 transition-colors">Thoughtful Text Discussions</h3>
                <p className="text-gray-600 leading-relaxed">
                  Share your ideas through clear, well-crafted text. Express complex thoughts with precision and clarity.
                </p>
              </div>

              {/* Meaningful Conversations */}
              <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-purple-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-purple-700 transition-colors">Text Replies</h3>
                <p className="text-gray-600 leading-relaxed">
                  Respond to discussions with thoughtful text replies. Build conversations with clear, structured communication.
                </p>
              </div>

              {/* Authentic Engagement */}
              <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-red-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-red-700 transition-colors">One Heart Per User</h3>
                <p className="text-gray-600 leading-relaxed">
                  Prevent manipulation with our one-like-per-user system. Authentic engagement over artificial inflation.
                </p>
              </div>

              {/* User Control */}
              <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-green-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-green-700 transition-colors">You Control Your Content</h3>
                <p className="text-gray-600 leading-relaxed">
                  Delete your discussions and replies anytime. Your voice, your choice, your control.
                </p>
              </div>

              {/* Quality Over Quantity */}
              <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-indigo-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-indigo-700 transition-colors">Quality Over Quantity</h3>
                <p className="text-gray-600 leading-relaxed">
                  Focused text format encourages thoughtful, well-structured communication. Quality ideas, clearly expressed.
                </p>
              </div>

              {/* Real-Time Engagement */}
              <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-yellow-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-yellow-700 transition-colors">Real-Time Discussions</h3>
                <p className="text-gray-600 leading-relaxed">
                  See engagement stats, likes, and replies update instantly. Stay connected to the conversation.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial Section */}
          <div className="mt-32 mb-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Join the Movement
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Be part of a community that values substance over superficiality
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Finally, a platform that prioritizes meaningful dialogue over viral content. The quality of discussions here is refreshing."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    AS
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Alex Smith</div>
                    <div className="text-sm text-gray-600">Early Adopter</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "The one-heart system prevents manipulation and keeps conversations genuine. It's exactly what social media needed."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    MJ
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Maria Johnson</div>
                    <div className="text-sm text-gray-600">Community Member</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Love having control over my content. Being able to delete my posts and replies gives me confidence to share authentically."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    DR
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">David Rodriguez</div>
                    <div className="text-sm text-gray-600">Beta Tester</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="relative mt-20 mb-20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 border border-gray-200/50 shadow-2xl max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                Ready to join the conversation?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Experience meaningful discussions where your ideas matter. 
                Join a community focused on clarity, logic, and genuine engagement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Link
                  href="/login"
                  className="group relative flex-1 py-4 px-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 rounded-full transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span className="relative z-10">Start Your First Discussion</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                No spam, no ads, just meaningful conversations
              </p>
            </div>
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-gray-200/50 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Branchera</h3>
            <p className="text-gray-600">Where Progress Happens</p>
          </div>
          <div className="text-sm text-gray-500">
            <p>&copy; 2025 Branchera. Building a better social experience.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}