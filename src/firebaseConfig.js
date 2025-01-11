import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app;
let analytics = null;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Analytics only if supported
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  }).catch(e => {
    console.warn('Firebase Analytics not supported:', e.message);
  });
} catch (error) {
  console.error('Error initializing Firebase:', error.message);
}

// Initialize auth and firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Action code settings for email verification
export const actionCodeSettings = {
  url: `${window.location.origin}/verify-email`,  // This uses the current domain
  handleCodeInApp: false,
};

// Export all services
export { auth, db, analytics };
export default app;