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

const servicesCollection = collection(db, COLLECTIONS.SERVICES);

// Get all services with real-time updates
export const subscribeToServices = (callback) => {
  const q = query(servicesCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(services);
  });
};

// Add a new service
export const addService = async (serviceData) => {
  try {
    const docRef = await addDoc(servicesCollection, {
      ...serviceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
};

// Update an existing service
export const updateService = async (serviceId, serviceData) => {
  try {
    const serviceRef = doc(db, COLLECTIONS.SERVICES, serviceId);
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

// Delete a service
export const deleteService = async (serviceId) => {
  try {
    const serviceRef = doc(db, COLLECTIONS.SERVICES, serviceId);
    await deleteDoc(serviceRef);
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// Get all services (one-time fetch)
export const getAllServices = async () => {
  try {
    const snapshot = await getDocs(servicesCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};