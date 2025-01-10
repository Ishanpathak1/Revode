// roles.js
export const ROLES = {
    ADMIN: 'admin',
    STUDENT: 'student'
};

export const canAddProblems = (role) => role === ROLES.ADMIN;