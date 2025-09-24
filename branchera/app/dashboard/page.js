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
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">
              Branchera
            </h1>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm">
                  {user.displayName || user.email}
                </span>
              </div>
              
              <button
                onClick={logout}
                className="px-3 py-1 text-sm bg-black text-white hover:bg-gray-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">
          Welcome to Branchera!
        </h2>
        
        <div className="space-y-6">
          <div className="p-4 border border-gray-200">
            <h3 className="text-lg font-semibold mb-3">
              Your Profile
            </h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {user.displayName || 'Not set'}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Discussions</h4>
                <span>💬</span>
              </div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">Start your first discussion</p>
            </div>

            <div className="p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Branches</h4>
                <span>🌳</span>
              </div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">Create your first branch</p>
            </div>

            <div className="p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Connections</h4>
                <span>🤝</span>
              </div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">Connect with others</p>
            </div>
          </div>

          <div className="p-4 bg-black text-white">
            <h3 className="text-lg font-bold mb-2">Get Started</h3>
            <p className="mb-4 text-sm">Welcome to Branchera - the social platform where clarity and logic beat distraction and misinformation.</p>
            <button className="px-4 py-2 bg-white text-black font-medium hover:bg-gray-100">
              Start Your First Discussion
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
