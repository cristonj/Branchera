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
          <div className="mb-16 mt-10">
            
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
              Social media where <span className="font-semibold text-black">you&rsquo;re a human</span>, not a product.
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-md mx-auto mt-12">
              <Link
                href="/login"
                className="flex-1 py-3 px-8 border-2 border-black text-center bg-black text-white hover:text-black hover:bg-white rounded-full transition-all duration-300 font-semibold shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>

        </main>
        </div>
    </div>
  );
}