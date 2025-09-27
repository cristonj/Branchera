'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';

export default function ProfilePage() {
  const { user, userProfile, getDisplayName, openDisplayNameModal, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    }
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-semibold">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{getDisplayName()}</h3>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            {/* Display Name Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Display Name</h3>
                  <p className="text-gray-600 mt-1">
                    This is the name that others will see when you participate in discussions.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Current display name: <span className="font-medium">{getDisplayName()}</span>
                  </p>
                </div>
                <button
                  onClick={openDisplayNameModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Change Display Name
                </button>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                    {user.email}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. This is your Google account email.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Account Name
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                    {user.displayName || 'Not provided'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This is your original Google account name (for reference only).
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Status */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Status</h3>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${
                    userProfile?.hasSetDisplayName ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {userProfile?.hasSetDisplayName ? 'Profile Complete' : 'Profile Setup Required'}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {userProfile?.hasSetDisplayName 
                      ? 'Your profile is set up and ready to go!' 
                      : 'Please set a display name to complete your profile.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900">About Display Names</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Your display name is used throughout Branchera instead of your Google account name. 
                      This gives you control over how you appear to other users while maintaining your privacy.
                      You can change your display name at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}