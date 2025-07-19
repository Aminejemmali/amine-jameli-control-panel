import { initializeApp } from 'firebase/app';
import { getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase Configuration for Amine Jameli Services Admin Panel
// Replace these placeholder values with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyDGAsvk9LLFqmyVpdA2ro0hNHGaFQ2nUMw",
  authDomain: "aminejameliservices.firebaseapp.com",
  databaseURL: "https://aminejameliservices-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "aminejameliservices",
  storageBucket: "aminejameliservices.appspot.com",
  messagingSenderId: "815526979960",
  appId: "1:815526979960:web:38e520885152f87a1b008d",
  measurementId: "G-PX3L4MEJ7P"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(app);

export default app;