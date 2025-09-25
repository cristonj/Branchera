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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <main className="text-center max-w-4xl w-full">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Branchera
          </h1>
          <p className="text-xl md:text-2xl mb-4">
            Where Progress Happens
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            The social platform where clarity and logic beat distraction and misinformation. 
            Share your thoughts through text, engage in meaningful discussions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 max-w-md mx-auto">
            <Link
              href="/login"
              className="flex-1 py-3 px-6 text-center bg-black text-white border border-black hover:bg-gray-800 rounded-full transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="flex-1 py-3 px-6 text-center bg-white text-black border border-black hover:bg-gray-50 rounded-full transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Text-Based Discussions */}
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Thoughtful Text Discussions</h3>
              <p className="text-gray-600">
                Share your ideas through clear, well-crafted text. Express complex thoughts with precision and clarity.
              </p>
            </div>

            {/* Meaningful Conversations */}
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Text Replies</h3>
              <p className="text-gray-600">
                Respond to discussions with thoughtful text replies. Build conversations with clear, structured communication.
              </p>
            </div>

            {/* Authentic Engagement */}
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">One Heart Per User</h3>
              <p className="text-gray-600">
                Prevent manipulation with our one-like-per-user system. Authentic engagement over artificial inflation.
              </p>
            </div>

            {/* User Control */}
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">You Control Your Content</h3>
              <p className="text-gray-600">
                Delete your discussions and replies anytime. Your voice, your choice, your control.
              </p>
            </div>

            {/* Quality Over Quantity */}
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Over Quantity</h3>
              <p className="text-gray-600">
                Focused text format encourages thoughtful, well-structured communication. Quality ideas, clearly expressed.
              </p>
            </div>

            {/* Real-Time Engagement */}
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Discussions</h3>
              <p className="text-gray-600">
                See engagement stats, likes, and replies update instantly. Stay connected to the conversation.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 p-8 bg-gray-50 rounded-2xl max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Ready to join the conversation?</h2>
            <p className="text-gray-600 mb-6">
              Experience meaningful discussions where your ideas matter. 
              Join a community focused on clarity, logic, and genuine engagement.
            </p>
            <Link
              href="/login"
              className="inline-block py-3 px-8 bg-black text-white hover:bg-gray-800 rounded-full transition-colors font-medium"
            >
              Start Your First Discussion
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}