import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../firebaseConfig";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("User logged in:", userCredential.user);
            navigate("/dashboard");
        } catch (error) {
            setError(error.message);
            console.error("Error logging in:", error.message);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        try {
            const result = await signInWithPopup(auth, provider);
            console.log("User signed in with Google:", result.user);
            navigate("/dashboard");
        } catch (error) {
            setError(error.message);
            console.error("Error with Google login:", error.message);
        }
    };

    return (
        <div className="login-container">
            <nav className="nav">
                <div className="nav-content">
                    <div className="nav-brand">Revode</div>
                    <div className="nav-links">
                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                        <Link to="/signup" className="nav-link">Sign Up</Link>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <div className="login-split">
                    <div className="login-visual">
                        <h1 className="visual-title">Welcome Back!</h1>
                        <p className="visual-text">
                            Login to access your dashboard, track your progress, and continue your journey.
                            We're excited to have you back!
                        </p>
                    </div>

                    <div className="login-form-container">
                        <h2 className="form-title">Log in</h2>
                        <p className="form-subtitle">Enter your details below</p>

                        {error && (
                            <div className="error-message">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="form-group">
                                <label htmlFor="email" className="form-label">Email address</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password" className="form-label">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-options">
                                <label className="remember-me">
                                    <input type="checkbox" /> Remember me
                                </label>
                                <a href="#" className="forgot-password">Forgot password?</a>
                            </div>

                            <button type="submit" className="submit-button">
                                Sign in
                            </button>
                        </form>

                        <div className="divider">
                            <span className="divider-text">Or continue with</span>
                        </div>

                        <button onClick={handleGoogleLogin} className="google-button">
                            Sign in with Google
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Login;