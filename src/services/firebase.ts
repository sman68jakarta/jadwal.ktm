import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDl8RoTc39s2r8cyLL9JMRL8hpxn377d0M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "data-pembagian-ktm.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "data-pembagian-ktm",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "data-pembagian-ktm.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "276414422745",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:276414422745:web:f3820bee202f9c33bfe8c8"
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
