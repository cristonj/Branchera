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
let auth = null;
let db = null;
let storage = null;
let analytics = null;

// Lazy getters for Firebase services
export const getAuthInstance = async () => {
  if (!auth && app) {
    const { getAuth } = await import("firebase/auth");
    auth = getAuth(app);
  }
  return auth;
};

export const getFirestoreInstance = async () => {
  if (!db && app) {
    const { getFirestore } = await import("firebase/firestore");
    db = getFirestore(app);
  }
  return db;
};

export const getStorageInstance = async () => {
  if (!storage && app) {
    const { getStorage } = await import("firebase/storage");
    storage = getStorage(app);
  }
  return storage;
};

export const getAnalyticsInstance = async () => {
  if (!analytics && app && typeof window !== 'undefined') {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
    }
  }
  return analytics;
};

// Legacy exports for backward compatibility (will be lazy-loaded)
export { app };
export const auth = new Proxy({}, {
  get() {
    console.warn('Direct auth access is deprecated. Use getAuthInstance() instead.');
    return getAuthInstance();
  }
});

export const db = new Proxy({}, {
  get() {
    console.warn('Direct db access is deprecated. Use getFirestoreInstance() instead.');
    return getFirestoreInstance();
  }
});

export const storage = new Proxy({}, {
  get() {
    console.warn('Direct storage access is deprecated. Use getStorageInstance() instead.');
    return getStorageInstance();
  }
});

export default app;
