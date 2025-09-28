'use client';

import { useState, useEffect } from 'react';

export default function DisplayNameModal({ isOpen, onSubmit, onClose, currentName = '' }) {
  const [displayName, setDisplayName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedName = displayName.trim();
    
    // Validation
    if (!trimmedName) {
      setError('Display name is required');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Display name must be at least 2 characters long');
      return;
    }
    
    if (trimmedName.length > 50) {
      setError('Display name must be less than 50 characters');
      return;
    }
    
    // Check for inappropriate content (basic validation)
    const inappropriatePatterns = /^(admin|moderator|support|system|bot|null|undefined|anonymous)$/i;
    if (inappropriatePatterns.test(trimmedName)) {
      setError('This display name is not allowed');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(trimmedName);
    } catch (error) {
      setError(error.message || 'Failed to set display name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
      onClick={(e) => {
        // Prevent background clicks from closing modal when required
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-white rounded-lg border border-black/20 shadow-2xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Set Your Display Name
            </h2>
            {/* Close button - only show if not required (currentName exists) */}
            {currentName && (
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-900 disabled:opacity-50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <p className="text-gray-600 mb-6">
            {currentName 
              ? 'Update your display name that others will see in discussions.'
              : 'Choose a display name that others will see when you participate in discussions.'
            }
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-900 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError(''); // Clear error when user types
                }}
                className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Enter your display name"
                maxLength={50}
                disabled={isSubmitting}
                autoFocus
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {displayName.length}/50 characters
                </span>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {currentName && (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-gray-700 border border-black/20 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !displayName.trim()}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  currentName ? 'Update' : 'Set Display Name'
                )}
              </button>
            </div>
          </form>

          {!currentName && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              You need to set a display name to continue using Branches
            </p>
          )}
        </div>
      </div>
    </div>
  );
}