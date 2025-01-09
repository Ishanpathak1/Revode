import React from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebaseConfig";

const Navbar = () => {
    const handleLogout = async () => {
        try {
            await auth.signOut();
            console.log("User logged out");
        } catch (error) {
            console.error("Error logging out:", error.message);
        }
    };

    return (
        <nav>
            <ul style={{ listStyle: "none", display: "flex", gap: "1rem" }}>
                <li>
                    <Link to="/signup">Sign Up</Link>
                </li>
                <li>
                    <Link to="/login">Login</Link>
                </li>
                <li>
                    <Link to="/dashboard">Dashboard</Link>
                </li>
                {auth.currentUser && (
                    <li>
                        <button onClick={handleLogout}>Logout</button>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;