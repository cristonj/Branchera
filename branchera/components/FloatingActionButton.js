'use client';

import { useState } from 'react';
import DiscussionDialog from './DiscussionDialog';

export default function FloatingActionButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDiscussionCreated = (discussion) => {
    // The dialog will handle closing itself when a discussion is created
    // We don't need to do anything special here
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-200 flex items-center justify-center z-40"
        aria-label="Start a new discussion"
      >
        {/* Notepad Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </button>

      {/* Discussion Dialog */}
      <DiscussionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onDiscussionCreated={handleDiscussionCreated}
      />
    </>
  );
}