import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { COLLECTIONS } from '../lib/firebaseConfig.js';

export const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  const addDocument = async (data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateDocument = async (id, data) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: new Date()
      });
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const deleteDocument = async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument
  };
};

export const useFirestoreCollection = (collectionName) => {
  return useFirestore(collectionName);
};