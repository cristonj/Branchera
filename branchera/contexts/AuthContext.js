'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { UserProfileService } from '@/lib/userProfileService';
import DisplayNameModal from '@/components/DisplayNameModal';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Initialize or update user profile
          const profile = await UserProfileService.initializeUserProfile(user);
          
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName, // Keep Google name for reference
            photoURL: user.photoURL
          });
          
          setUserProfile(profile);
          
          // Check if user needs to set display name
          
          if (!profile.hasSetDisplayName || !profile.displayName) {
            setShowDisplayNameModal(true);
          } else {
          }
        } catch (error) {
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          });
          setUserProfile(null);
          
          // If profile creation failed, still show the modal for new users
          setShowDisplayNameModal(true);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setShowDisplayNameModal(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      router.push('/dashboard');
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      return;
    }
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      throw error;
    }
  };

  const updateDisplayName = async (displayName) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedProfile = await UserProfileService.updateDisplayName(user.uid, displayName);
      await UserProfileService.markDisplayNameSet(user.uid);
      
      setUserProfile(updatedProfile);
      setShowDisplayNameModal(false);
      
      return updatedProfile;
    } catch (error) {
      throw error;
    }
  };

  const openDisplayNameModal = () => {
    setShowDisplayNameModal(true);
  };

  const closeDisplayNameModal = () => {
    // Only allow closing if user has already set a display name
    if (userProfile?.hasSetDisplayName && userProfile?.displayName) {
      setShowDisplayNameModal(false);
    }
  };

  // Get the display name to use throughout the app
  const getDisplayName = () => {
    // Only return the custom display name if it's set, otherwise return "Unknown User"
    return userProfile?.displayName || 'Unknown User';
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    updateDisplayName,
    openDisplayNameModal,
    closeDisplayNameModal,
    getDisplayName,
    showDisplayNameModal
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      <DisplayNameModal 
        isOpen={showDisplayNameModal}
        onSubmit={updateDisplayName}
        onClose={closeDisplayNameModal}
        currentName={userProfile?.displayName || ''}
      />
    </AuthContext.Provider>
  );
}
