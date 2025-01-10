import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../firebaseConfig";
import "./Login.css"; // Reuse the login styles
import "./Signup.css"; // Additional signup-specific styles

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User signed up:", userCredential.user);
            navigate("/dashboard");
        } catch (error) {
            setError(error.message);
            console.error("Error signing up:", error.message);
        }
    };

    const handleGoogleSignUp = async () => {
        setError("");
        try {
            const result = await signInWithPopup(auth, provider);
            console.log("User signed up with Google:", result.user);
            navigate("/dashboard");
        } catch (error) {
            setError(error.message);
            console.error("Error with Google sign-up:", error.message);
        }
    };

    return (
        <div className="login-container">
            <nav className="nav">
                <div className="nav-content">
                    <div className="nav-brand">Revode</div>
                    <div className="nav-links">
                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                        <Link to="/login" className="nav-link">Login</Link>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <div className="login-split">
                    <div className="login-visual">
                        <h1 className="visual-title">Create Account</h1>
                        <p className="visual-text">
                            Join our community and start your journey today. Get access to personalized
                            features and track your progress with our intuitive dashboard.
                        </p>
                    </div>

                    <div className="login-form-container">
                        <h2 className="form-title">Sign up</h2>
                        <p className="form-subtitle">Create your account</p>

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

                        <form onSubmit={handleSignUp} className="login-form">
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
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <div className="password-requirements">
                                    Password requirements:
                                    <div className="requirement-list">
                                        <span className="requirement-item">At least 8 characters long</span>
                                        <span className="requirement-item">Contains at least one number</span>
                                        <span className="requirement-item">Contains at least one special character</span>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="submit-button">
                                Create Account
                            </button>
                        </form>

                        <div className="divider">
                            <span className="divider-text">Or sign up with</span>
                        </div>

                        <button onClick={handleGoogleSignUp} className="google-button">
    
                            Sign up with Google
                        </button>

                        <div className="already-account">
                            Already have an account?{" "}
                            <Link to="/login">Sign in</Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SignUp;