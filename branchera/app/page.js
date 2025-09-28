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
        <main className="text-center max-w-4xl w-full">
          
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/logo.svg" 
              alt="Branches Logo" 
              className="w-16 h-16 md:w-20 md:h-20 mr-4"
            />
            <h1 className="text-5xl md:text-6xl font-bold text-black">
              Branches
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-700 max-w-3xl mx-auto leading-relaxed">
            At Branches, we think <span className="font-semibold text-black">the app should be the product</span>, not the users.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-md mx-auto">
            <Link
              href="/login"
              className="flex-1 py-3 px-6 text-center bg-black text-white hover:bg-black/80 rounded-full transition-all duration-300 font-semibold"
            >
              Try The Product
            </Link>
            <Link
              href="/login"
              className="flex-1 py-3 px-6 text-center bg-white text-black border border-black hover:bg-black hover:text-white rounded-full transition-all duration-300 font-semibold"
            >
              Sign In
            </Link>
          </div>

          {/* Simple comparison */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            <div className="text-left">
              <h3 className="text-xl font-bold mb-4 text-red-800">Other Social Apps</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Users are the product</li>
                <li>• Owned by billionaires</li>
                <li>• Algorithms optimize for engagement</li>
                <li>• Data harvesting</li>
              </ul>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold mb-4 text-green-800">Branches</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• The app is the product</li>
                <li>• Community owned</li>
                <li>• Algorithms optimize for your interests</li>
                <li>• Privacy first</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto">
            <p className="text-lg text-gray-800 italic mb-2">
              &ldquo;When you&rsquo;re not paying for the product, you are the product.&rdquo;
            </p>
            <p className="text-sm text-gray-600">Not at Branches.</p>
          </div>

        </main>
      </div>
      
      {/* Simple Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          &copy; 2025 Branches. The app should be the product, not the users.
        </p>
      </footer>
    </div>
  );
}