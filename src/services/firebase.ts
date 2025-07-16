import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCYcbPmw3ZBx7wUNc7doeF1f_aEeMK6W40',
  authDomain: 'eat-soon-001.firebaseapp.com',
  projectId: 'eat-soon-001',
  storageBucket: 'eat-soon-001.firebasestorage.app',
  messagingSenderId: '193166714237',
  appId: '1:193166714237:web:d4bbaeceb7143d279dd814',
  measurementId: 'G-HFN00KHQW2',
};

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with React Native persistence
let auth: Auth;
try {
  // Try to import getReactNativePersistence (available in Firebase 11.x)
  // @ts-ignore - TypeScript doesn't recognize this export but it exists at runtime
  const { getReactNativePersistence } = require('firebase/auth');

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
} catch (error) {
  console.warn('⚠️ Could not initialize with AsyncStorage persistence, falling back to default:', error);

  // Fallback to default initialization
  try {
    auth = initializeAuth(app);
  } catch (fallbackError) {
    // If auth is already initialized, get the existing instance
    auth = getAuth(app);
  }
}

// Use the named Firestore database (instead of the default) so we point to "eatsoon001" which matches the backend setup.
const db = getFirestore(app, 'eatsoon001');

export { auth, db };

