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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <main className="text-center max-w-sm w-full">
        <h1 className="text-4xl font-bold mb-4">
          Branchera
        </h1>
        <p className="text-lg mb-2">
          Where Progress Happens
        </p>
        <p className="text-sm text-gray-600 mb-8">
          The social platform where clarity and logic beat distraction and misinformation.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full py-3 px-4 text-center bg-black text-white border border-black hover:bg-gray-800 rounded-full"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 px-4 text-center bg-white text-black border border-black hover:bg-gray-50 rounded-full"
          >
            Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}