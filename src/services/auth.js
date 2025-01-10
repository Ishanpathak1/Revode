// auth.js
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const registerUser = async (email, password) => {
    try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create role document
        await addDoc(collection(db, 'roles'), {
            userId: user.uid,
            email: user.email,
            role: 'student', // Default role
            createdAt: new Date().toISOString()
        });

        return user;
    } catch (error) {
        throw error;
    }
};