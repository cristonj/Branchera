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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Branchera',
    description: 'Where Progress Happens',
    url: 'https://branchera.org',
    logo: 'https://branchera.org/logo.png', // Update when you have a logo
    sameAs: [
      // Add your social media URLs here
      // 'https://twitter.com/branchera',
      // 'https://linkedin.com/company/branchera',
      // 'https://github.com/branchera'
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <main className="text-center px-4">
          <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Branchera
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400 mb-2">
            Where Progress Happens
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-500 mb-8 max-w-md mx-auto">
            The social platform where clarity and logic beat distraction and misinformation.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 text-lg font-semibold text-purple-600 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg border border-purple-200 dark:border-purple-800"
            >
              Sign In
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}