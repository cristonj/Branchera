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
          <div className="mb-8 sm:mb-12 md:mb-16 mt-4 sm:mt-6 md:mt-10">
            
            <div className="flex items-center justify-center mb-6 md:mb-8">
              <img
                src="/logo.svg"
                alt="Branches Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mr-3 sm:mr-4"
              />
              <h1 className="text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-black">
                Branches
              </h1>
            </div>
            
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-4 md:mb-6 text-gray-800 max-w-4xl mx-auto leading-tight font-light px-2">
              Social media where <span className="font-semibold text-black">you&rsquo;re a human</span>, not a product.
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 mt-8 sm:mt-12 px-4 sm:px-6 sm:max-w-md sm:mx-auto w-full sm:w-auto">
              <Link
                href="/login"
                className="flex-1 py-2 sm:py-3 px-4 sm:px-6 md:px-8 border-2 border-black text-center bg-black text-white hover:text-black hover:bg-white rounded-full transition-all duration-300 font-semibold shadow-lg text-sm sm:text-base min-h-[44px] flex items-center justify-center"
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