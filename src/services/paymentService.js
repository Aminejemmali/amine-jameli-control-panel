import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { COLLECTIONS } from '../lib/firebaseConfig.js';

const paymentMethodsCollection = collection(db, COLLECTIONS.PAYMENT_METHODS);

// Get all payment methods with real-time updates
export const subscribeToPaymentMethods = (callback) => {
  const q = query(paymentMethodsCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const paymentMethods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(paymentMethods);
  });
};

// Add a new payment method
export const addPaymentMethod = async (paymentMethodData) => {
  try {
    const docRef = await addDoc(paymentMethodsCollection, {
      ...paymentMethodData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

// Update an existing payment method
export const updatePaymentMethod = async (paymentMethodId, paymentMethodData) => {
  try {
    const paymentMethodRef = doc(db, COLLECTIONS.PAYMENT_METHODS, paymentMethodId);
    await updateDoc(paymentMethodRef, {
      ...paymentMethodData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw error;
  }
};

// Delete a payment method
export const deletePaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethodRef = doc(db, COLLECTIONS.PAYMENT_METHODS, paymentMethodId);
    await deleteDoc(paymentMethodRef);
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
};

// Get all payment methods (one-time fetch)
export const getAllPaymentMethods = async () => {
  try {
    const snapshot = await getDocs(paymentMethodsCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};