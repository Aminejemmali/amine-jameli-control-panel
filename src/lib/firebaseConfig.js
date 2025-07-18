// Firebase Configuration for Amine Jameli Services Admin Panel
// Replace these placeholder values with your actual Firebase project credentials

export const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};

// Collection names with ds_ prefix for Dropservices
export const COLLECTIONS = {
  SERVICES: 'ds_services',
  USERS: 'ds_users', 
  ORDERS: 'ds_orders',
  PAYMENT_METHODS: 'ds_payment_methods',
  STATS: 'ds_stats'
};