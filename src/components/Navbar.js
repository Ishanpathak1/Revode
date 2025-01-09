import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import StreakPage from "./streakPage";
import "./Navbar.css";

const Navbar = ({ user, onLogout }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? "nav-link active" : "nav-link";
    };

    const handleClickOutside = () => {
        setShowDropdown(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/dashboard" className="navbar-logo">
                    <span className="logo-text">Revode</span>
                </Link>

                <div className="navbar-links">
                    <Link to="/dashboard" className={isActive("/dashboard")}>
                        Dashboard
                    </Link>
                    <Link to="/streakPage" className={isActive("/streak")}>
                        Profile
                    </Link>
                    <button onClick={onLogout} className="nav-link logout-btn">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;