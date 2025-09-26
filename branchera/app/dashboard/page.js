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
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors"
              >
                Points
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
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors"
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
