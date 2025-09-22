// Frontend Firebase initialization
// Uses the Web SDK to provide initialized instances for Auth, Firestore, Storage, and Analytics

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID

};

// Ensure we don't initialize more than once in dev with HMR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Core services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics (initialized on-demand to avoid top-level await and SSR issues)
let analytics = null;
const initAnalytics = () => {
  if (analytics) return analytics;
  try {
    if (typeof window !== "undefined") {
      analytics = getAnalytics(app);
    }
  } catch (_) {
    // ignore analytics initialization errors
  }
  return analytics;
};

export { app, auth, db, storage, analytics, initAnalytics };


