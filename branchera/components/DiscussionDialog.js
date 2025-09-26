'use client';

import { useState, useEffect, useCallback } from 'react';
import TextDiscussionForm from './TextDiscussionForm';

export default function DiscussionDialog({ isOpen, onClose, onDiscussionCreated }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scrolling when modal is closed
      document.body.style.overflow = 'unset';
      // Delay hiding to allow exit animation
      const timer = setTimeout(() => setIsVisible(false), 150);
      return () => clearTimeout(timer);
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDiscussionCreated = (discussion) => {
    onDiscussionCreated(discussion);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity duration-150 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-150 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Start a Discussion</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <TextDiscussionForm 
            onDiscussionCreated={handleDiscussionCreated}
            isInDialog={true}
          />
        </div>
      </div>
    </div>
  );
}