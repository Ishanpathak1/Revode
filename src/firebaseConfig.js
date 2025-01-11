import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

// Initialize Firebase services
let app;
let analytics = null;
let auth;
let db;
let storage;

try {
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);
  
  // Initialize Firestore and Auth immediately
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Initialize Analytics only if supported (async)
  isSupported()
    .then(yes => {
      if (yes) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized successfully');
      }
    })
    .catch(e => {
      console.warn('Firebase Analytics not supported:', e.message);
    });

  console.log('Firebase core services initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  
  // Provide fallback or error handling for critical services
  if (!auth || !db || !storage) {
    console.error('Critical Firebase services failed to initialize');
    // You might want to show an error UI to the user here
  }
}

// Action code settings for email verification
export const actionCodeSettings = {
  url: `${window.location.origin}/verify-email`,
  handleCodeInApp: false,
  dynamicLinkDomain: process.env.REACT_APP_DYNAMIC_LINK_DOMAIN // Optional: for dynamic links
};

// Utility function to check if all critical services are available
export const isFirebaseReady = () => {
  return !!auth && !!db && !!storage;
};

// Helper function for file uploads
export const getStorageFilePath = (userId, fileType, fileName) => {
  const validFileTypes = ['resumes', 'profileImages', 'documents'];
  if (!validFileTypes.includes(fileType)) {
    throw new Error('Invalid file type');
  }
  return `${fileType}/${userId}/${fileName}`;
};

// Upload size limits (in bytes)
export const uploadLimits = {
  resume: 5 * 1024 * 1024, // 5MB
  profileImage: 2 * 1024 * 1024, // 2MB
  document: 10 * 1024 * 1024 // 10MB
};

// Allowed file types
export const allowedFileTypes = {
  resume: ['application/pdf'],
  profileImage: ['image/jpeg', 'image/png', 'image/gif'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Export all services and utilities
export {
  app as default,
  auth,
  db,
  storage,
  analytics
};

// Constants for collection names
export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'userProfiles',
  ACTIVITIES: 'activities',
  USER_STATS: 'userStats',
  PROBLEMS: 'problems',
  QUIZZES: 'quizzes',
  COMPLETED_QUIZZES: 'completedQuizzes',
  ROLES: 'roles'
};