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
      console.error('Error updating display name:', error);
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
        <div className="rounded-lg border border-black/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-900">Display Name</h4>
              <p className="text-gray-600 text-sm">
                This is how other users will see you in discussions
              </p>
            </div>
            {!showDisplayNameForm && (
              <button
                onClick={handleEditClick}
                className="px-4 py-2 text-gray-900 border border-black/20 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {showDisplayNameForm ? (
            <form onSubmit={handleDisplayNameSubmit} className="space-y-4">
              <div>
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
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {displayName.length}/50 characters
                  </span>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 border border-black/20 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !displayName.trim()}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 border border-black/20 rounded-lg p-4">
              <p className="font-medium text-gray-900">{getDisplayName()}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}