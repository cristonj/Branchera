'use client';

import { useEffect, useState } from 'react';

// Force dynamic rendering to prevent pre-rendering issues with Firebase
export const dynamic = 'force-dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DiscussionFeed from '@/components/DiscussionFeed';
import DiscussionDialog from '@/components/DiscussionDialog';
import TopNav from '@/components/TopNav';

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
      <TopNav />

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
