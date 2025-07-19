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
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { COLLECTIONS } from '../lib/firebaseConfig.js';

const ordersCollection = collection(db, COLLECTIONS.ORDERS);

// Get all orders with real-time updates and populate related data
export const subscribeToOrders = (callback) => {
  const q = query(ordersCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, async (snapshot) => {
    const orders = await Promise.all(
      snapshot.docs.map(async (orderDoc) => {
        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        
        // Fetch related service data
        if (orderData.serviceId) {
          try {
            const serviceDoc = await getDoc(doc(db, COLLECTIONS.SERVICES, orderData.serviceId));
            if (serviceDoc.exists()) {
              orderData.serviceName = serviceDoc.data().name;
            }
          } catch (error) {
            console.error('Error fetching service:', error);
          }
        }
        
        // Fetch related user data
        if (orderData.clientId) {
          try {
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, orderData.clientId));
            if (userDoc.exists()) {
              orderData.clientName = userDoc.data().clientName;
            }
          } catch (error) {
            console.error('Error fetching user:', error);
          }
        }
        
        // Fetch related payment method data
        if (orderData.paymentMethodId) {
          try {
            const paymentDoc = await getDoc(doc(db, COLLECTIONS.PAYMENT_METHODS, orderData.paymentMethodId));
            if (paymentDoc.exists()) {
              orderData.paymentMethod = paymentDoc.data().type;
            }
          } catch (error) {
            console.error('Error fetching payment method:', error);
          }
        }
        
        return orderData;
      })
    );
    callback(orders);
  });
};

// Add a new order
export const addOrder = async (orderData) => {
  try {
    const docRef = await addDoc(ordersCollection, {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
};

// Update an existing order
export const updateOrder = async (orderId, orderData) => {
  try {
    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

// Delete an order
export const deleteOrder = async (orderId) => {
  try {
    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// Get all orders (one-time fetch)
export const getAllOrders = async () => {
  try {
    const snapshot = await getDocs(ordersCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};