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

// Initialize Auth - Firebase will handle persistence automatically
let auth: Auth;
try {
  auth = initializeAuth(app);
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };

