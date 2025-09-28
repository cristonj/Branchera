'use client';

import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export class UserProfileService {
  static COLLECTION_NAME = 'userProfiles';

  // Get user profile by user ID
  static async getUserProfile(userId) {
    if (!db || !userId) {
      throw new Error('Database not initialized or user ID not provided');
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  // Create or update user profile
  static async createOrUpdateUserProfile(userId, profileData) {
    if (!db || !userId) {
      throw new Error('Database not initialized or user ID not provided');
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const existingProfile = await this.getUserProfile(userId);
      
      const profileUpdate = {
        ...profileData,
        updatedAt: serverTimestamp()
      };

      if (existingProfile) {
        // Update existing profile
        await updateDoc(docRef, profileUpdate);
        return { id: userId, ...existingProfile, ...profileUpdate };
      } else {
        // Create new profile
        const newProfile = {
          userId,
          createdAt: serverTimestamp(),
          ...profileUpdate
        };
        await setDoc(docRef, newProfile);
        return { id: userId, ...newProfile };
      }
    } catch (error) {
      throw error;
    }
  }

  // Update display name specifically
  static async updateDisplayName(userId, displayName) {
    if (!displayName || displayName.trim().length < 2) {
      throw new Error('Display name must be at least 2 characters long');
    }

    if (displayName.trim().length > 50) {
      throw new Error('Display name must be less than 50 characters');
    }

    // Check if display name is already taken
    const isUnique = await this.isDisplayNameUnique(displayName.trim(), userId);
    if (!isUnique) {
      throw new Error('That name is unavailable');
    }

    return await this.createOrUpdateUserProfile(userId, {
      displayName: displayName.trim()
    });
  }

  // Check if display name is unique (case-insensitive)
  static async isDisplayNameUnique(displayName, excludeUserId = null) {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      // Get all profiles to check case-insensitive uniqueness
      // Note: Firestore doesn't support case-insensitive queries, so we need to fetch all and filter
      const q = query(collection(db, this.COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      
      const normalizedName = displayName.trim().toLowerCase();
      
      // Check for case-insensitive matches
      const matches = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        const existingName = data.displayName;
        
        // Skip if no display name set
        if (!existingName) return false;
        
        // Skip if this is the user we're excluding (for updates)
        if (excludeUserId && doc.id === excludeUserId) return false;
        
        // Check case-insensitive match
        return existingName.toLowerCase() === normalizedName;
      });
      
      return matches.length === 0;
    } catch (error) {
      throw error;
    }
  }

  // Get user's display name or fallback to Google name
  static async getDisplayName(userId, fallbackName = null) {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.displayName || fallbackName || 'Anonymous User';
    } catch (error) {
      return fallbackName || 'Anonymous User';
    }
  }

  // Initialize user profile from Google auth data
  static async initializeUserProfile(user) {
    if (!user || !user.uid) {
      throw new Error('User data not provided');
    }

    try {
      const existingProfile = await this.getUserProfile(user.uid);
      
      if (!existingProfile) {
        // Create initial profile with Google data
        return await this.createOrUpdateUserProfile(user.uid, {
          email: user.email,
          googleDisplayName: user.displayName,
          photoURL: user.photoURL,
          // Don't set displayName yet - force user to set it
          hasSetDisplayName: false
        });
      } else {
        // Update Google-specific fields but preserve custom displayName
        const updatedProfile = await this.createOrUpdateUserProfile(user.uid, {
          email: user.email,
          googleDisplayName: user.displayName,
          photoURL: user.photoURL,
          hasSetDisplayName: !!existingProfile.displayName
        });
        
        return updatedProfile;
      }
    } catch (error) {
      throw error;
    }
  }

  // Mark that user has set their display name
  static async markDisplayNameSet(userId) {
    return await this.createOrUpdateUserProfile(userId, {
      hasSetDisplayName: true
    });
  }
}