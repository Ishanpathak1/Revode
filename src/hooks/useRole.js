import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const useRole = (user) => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            if (!user) {
                setRole(null);
                setLoading(false);
                return;
            }

            try {
                const rolesRef = collection(db, 'roles');
                const q = query(rolesRef, where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const roleData = querySnapshot.docs[0].data();
                    setRole(roleData.role);
                } else {
                    setRole('student'); // Default role
                }
            } catch (error) {
                console.error('Error fetching role:', error);
                setRole('student');
            } finally {
                setLoading(false);
            }
        };

        fetchRole();
    }, [user]);

    return { role, loading };
};