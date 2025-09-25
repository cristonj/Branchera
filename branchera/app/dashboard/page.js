'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AudioRecorder from '@/components/AudioRecorder';
import DiscussionFeed from '@/components/DiscussionFeed';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [newDiscussion, setNewDiscussion] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleNewDiscussion = (discussion) => {
    setNewDiscussion(discussion);
    // Clear the new discussion after a brief moment to allow the feed to process it
    setTimeout(() => setNewDiscussion(null), 100);
  };

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
              </div>
              
              <button
                onClick={logout}
                className="px-3 py-1 text-sm bg-black text-white hover:bg-gray-800 rounded-full"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AudioRecorder onDiscussionCreated={handleNewDiscussion} />
        <DiscussionFeed newDiscussion={newDiscussion} />
      </main>
    </div>
  );
}
