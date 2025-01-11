import React, { useState } from "react";
import { signInWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../firebaseConfig";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [verificationEmailSent, setVerificationEmailSent] = useState(false);
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            if (!userCredential.user.emailVerified) {
                // Send a new verification email
                await sendEmailVerification(userCredential.user);
                // Sign out the user
                await auth.signOut();
                setVerificationEmailSent(true);
                setError("Please verify your email before logging in. A new verification email has been sent.");
                return;
            }

            // If email is verified, proceed to dashboard
            navigate("/dashboard");
        } catch (error) {
            let errorMessage = "";
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Incorrect password";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Invalid email address";
                    break;
                default:
                    errorMessage = error.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, provider);
            navigate("/dashboard");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
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
                        <h1 className="visual-title">Welcome Back</h1>
                        <p className="visual-text">
                            Log in to your account to continue your journey and track your progress.
                        </p>
                    </div>

                    <div className="login-form-container">
                        <h2 className="form-title">Login</h2>
                        <p className="form-subtitle">Welcome back!</p>

                        {error && (
                            <div className={`error-message ${verificationEmailSent ? 'verification-alert' : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                Click the link sent to your Email.
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
                                    disabled={loading}
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
                                    disabled={loading}
                                />
                            </div>

                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? "Logging in..." : "Login"}
                            </button>
                        </form>

                        <div className="divider">
                            <span className="divider-text">Or sign in with</span>
                        </div>

                        <button 
                            onClick={handleGoogleLogin} 
                            className="google-button"
                            disabled={loading}
                        >
                            Sign in with Google
                        </button>

                        <div className="create-account">
                            Don't have an account?{" "}
                            <Link to="/signup">Create one</Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Login;