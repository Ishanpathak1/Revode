// src/utils/userStats.js
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';

export const updateUserStats = async (userId, email, score) => {
    try {
        const userStatsRef = collection(db, "userStats");
        const q = query(userStatsRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        
        const today = new Date().toISOString().split('T')[0];
        const statsData = {
            userId,
            email,
            lastSolved: today,
            solvedProblems: 1, // Will be incremented
            totalScore: score,
        };

        if (snapshot.empty) {
            statsData.streak = 1;
            await addDoc(userStatsRef, statsData);
        } else {
            const existingStats = snapshot.docs[0];
            const lastSolved = existingStats.data().lastSolved;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastSolved === yesterdayStr) {
                statsData.streak = (existingStats.data().streak || 0) + 1;
            } else if (lastSolved !== today) {
                statsData.streak = 1;
            }

            await updateDoc(existingStats.ref, statsData);
        }
    } catch (error) {
        console.error("Error updating stats:", error);
        throw error;
    }
};