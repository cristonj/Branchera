'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';

export default function SettingsPage() {
  const { user, userProfile, getDisplayName, updateDisplayName, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showDisplayNameForm, setShowDisplayNameForm] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        setIsLoading(false);
        setDisplayName(userProfile?.displayName || '');
      }
    }
  }, [user, loading, router, userProfile]);

  const handleDisplayNameSubmit = async (e) => {
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
      await updateDisplayName(trimmedName);
      setSuccessMessage('Display name updated successfully!');
      setShowDisplayNameForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to update display name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = () => {
    setShowDisplayNameForm(true);
    setError('');
    setSuccessMessage('');
    setDisplayName(userProfile?.displayName || '');
  };

  const handleCancelEdit = () => {
    setShowDisplayNameForm(false);
    setError('');
    setDisplayName(userProfile?.displayName || '');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <TopNav />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Display Name</h1>
          <p className="text-gray-600">Change how others see you in discussions</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Display Name Section */}
        <div className="rounded-lg border border-black/20 p-6 w-full">
          {showDisplayNameForm ? (
            <form onSubmit={handleDisplayNameSubmit} className="space-y-4">
              <div className="space-y-4">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Enter your display name"
                  maxLength={50}
                  disabled={isSubmitting}
                  autoFocus
                />

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {displayName.length}/50 characters
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="flex items-center justify-center w-10 h-10 text-gray-700 border border-black/20 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Cancel"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !displayName.trim()}
                      className="flex items-center justify-center w-10 h-10 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Save"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
                  {error}
                </div>
              )}
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div className="bg-gray-50 border border-black/20 rounded-lg p-4 flex-1 mr-3">
                <p className="font-medium text-gray-900">{getDisplayName()}</p>
              </div>
              <button
                onClick={handleEditClick}
                className="flex items-center justify-center w-10 h-10 text-gray-900 border border-black/20 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                title="Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}