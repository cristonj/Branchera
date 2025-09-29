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
        className="fixed bottom-6 right-6 w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-200 flex items-center justify-center z-40"
        aria-label="Start a new discussion"
      >
        {/* Leaf Icon */}
        <svg
          className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
          fill="currentColor"
          viewBox="0 0 512 512"
        >
          <path d="M476.188,24.146c-6.748-3.504-60.728,38.022-185.304,67.086C230.347,105.355,62.5,153.527,65.286,392.815 L0,431.218l20.338,35.598c63.073-40.692,236.014-120.042,409.766-323.621c0,0-26.875,134.419-334.096,311.056 c103.685,53.758,249.604,53.758,360.979-76.806C568.346,246.888,476.188,24.146,476.188,24.146z"/>
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