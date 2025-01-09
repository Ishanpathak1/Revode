// src/services/adminService.js
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const makeUserAdmin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isAdmin: true,
      role: 'admin',
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    throw error;
  }
};

export const checkIfUserIsAdmin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data()?.isAdmin === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};