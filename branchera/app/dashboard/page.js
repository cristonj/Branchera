'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Branchera
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.displayName || user.email}
                </span>
              </div>
              
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Branchera!
          </h2>
          
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Your Profile
              </h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">Name:</span> {user.displayName || 'Not set'}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">User ID:</span> <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{user.uid}</code></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Discussions</h4>
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">0</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Start your first discussion</p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Branches</h4>
                  <span className="text-2xl">🌳</span>
                </div>
                <p className="text-3xl font-bold text-indigo-600">0</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create your first branch</p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Connections</h4>
                  <span className="text-2xl">🤝</span>
                </div>
                <p className="text-3xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connect with others</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white">
              <h3 className="text-xl font-bold mb-2">Get Started</h3>
              <p className="mb-4">Welcome to Branchera - the social platform where clarity and logic beat distraction and misinformation.</p>
              <button className="px-6 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Start Your First Discussion
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
