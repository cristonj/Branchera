// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

// Initialize Firebase services (only if app is initialized)
let auth = null;
let db = null;
let storage = null;
let analytics = null;

if (app) {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Initialize Analytics (only in browser and if supported)
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }
}

export { app, auth, db, storage, analytics };
export default app;
