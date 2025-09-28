'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot
} from 'firebase/firestore';

export function useFirestore() {
  // Add a document
  const addDocument = async (collectionName, data) => {
    try {
      
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: Please check your Firebase Security Rules. Make sure authenticated users can write to the discussions collection.');
      }
      
      throw error;
    }
  };

  // Update a document
  const updateDocument = async (collectionName, docId, data) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw error;
    }
  };

  // Delete a document
  const deleteDocument = async (collectionName, docId) => {
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      throw error;
    }
  };

  // Get a single document
  const getDocument = async (collectionName, docId) => {
    try {
      const docSnap = await getDoc(doc(db, collectionName, docId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw error;
    }
  };

  // Get multiple documents with optional query
  const getDocuments = async (collectionName, queryConstraints = []) => {
    try {
      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      return documents;
    } catch (error) {
      throw error;
    }
  };

  // Subscribe to real-time updates
  const subscribeToCollection = (collectionName, queryConstraints = [], callback) => {
    const q = query(collection(db, collectionName), ...queryConstraints);
    return onSnapshot(q, (querySnapshot) => {
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      callback(documents);
    });
  };

  return {
    addDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    getDocuments,
    subscribeToCollection,
    // Export Firestore query helpers for use in components
    where,
    orderBy,
    limit,
    startAfter
  };
}
