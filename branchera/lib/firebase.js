// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";

// Your web app's Firebase configuration
// These values come from .env.local file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if we have the required Firebase configuration
const hasRequiredConfig = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain;

// Initialize Firebase (ensure we don't initialize twice)
// Only initialize if we have valid configuration
let app = null;
if (hasRequiredConfig) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

// Lazy-loaded Firebase services
let authInstance = null;
let dbInstance = null;
let storageInstance = null;
let analyticsInstance = null;

// Lazy getters for Firebase services
export const getAuthInstance = async () => {
  if (!authInstance && app) {
    const { getAuth } = await import("firebase/auth");
    authInstance = getAuth(app);
  }
  return authInstance;
};

export const getFirestoreInstance = async () => {
  if (!dbInstance && app) {
    const { getFirestore } = await import("firebase/firestore");
    dbInstance = getFirestore(app);
  }
  return dbInstance;
};

export const getStorageInstance = async () => {
  if (!storageInstance && app) {
    const { getStorage } = await import("firebase/storage");
    storageInstance = getStorage(app);
  }
  return storageInstance;
};

export const getAnalyticsInstance = async () => {
  if (!analyticsInstance && app && typeof window !== 'undefined') {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    const supported = await isSupported();
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  }
  return analyticsInstance;
};

// Initialize services immediately for backward compatibility
let auth = null;
let db = null;
let storage = null;
let analytics = null;

if (app) {
  // Use dynamic imports but initialize immediately
  Promise.all([
    import("firebase/auth").then(({ getAuth }) => {
      auth = getAuth(app);
      return auth;
    }),
    import("firebase/firestore").then(({ getFirestore }) => {
      db = getFirestore(app);
      return db;
    }),
    import("firebase/storage").then(({ getStorage }) => {
      storage = getStorage(app);
      return storage;
    }),
  ]);

  // Initialize Analytics (only in browser and if supported)
  if (typeof window !== 'undefined') {
    import("firebase/analytics").then(async ({ getAnalytics, isSupported }) => {
      const supported = await isSupported();
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }
}

export { app, auth, db, storage, analytics };
export default app;
