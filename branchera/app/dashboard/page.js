'use client';

import { useEffect, useState } from 'react';

// Force dynamic rendering to prevent pre-rendering issues with Firebase
export const dynamic = 'force-dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import DiscussionFeed from '@/components/DiscussionFeed';
import DiscussionDialog from '@/components/DiscussionDialog';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [newDiscussion, setNewDiscussion] = useState(null);
  const [isDiscussionDialogOpen, setIsDiscussionDialogOpen] = useState(false);

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
      <nav className="border-b border-black/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">
              Branchera
            </h1>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/points"
                className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                My Points
              </Link>
              
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </div>
              
              <button
                onClick={logout}
                className="px-3 py-1 text-sm bg-black text-white hover:bg-black/80 rounded-full"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <DiscussionFeed 
          newDiscussion={newDiscussion} 
          onStartDiscussion={() => setIsDiscussionDialogOpen(true)}
        />
      </main>

      {/* Discussion Dialog */}
      <DiscussionDialog
        isOpen={isDiscussionDialogOpen}
        onClose={() => setIsDiscussionDialogOpen(false)}
        onDiscussionCreated={handleNewDiscussion}
      />
    </div>
  );
}
