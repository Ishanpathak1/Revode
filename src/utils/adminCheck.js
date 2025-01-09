const ADMIN_EMAIL = 'ishan.pathak2711@gmail.com'; // Replace with your email

export const isAdmin = (user) => {
    return user?.email === ADMIN_EMAIL;
};