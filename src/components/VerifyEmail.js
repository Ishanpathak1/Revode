import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { applyActionCode, sendEmailVerification } from 'firebase/auth';
import './VerifyEmail.css';

const VerifyEmail = () => {
    const [verificationStatus, setVerificationStatus] = useState('verifying');
    const [message, setMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const actionCode = urlParams.get('oobCode');

                if (!actionCode) {
                    setVerificationStatus('error');
                    setMessage('Invalid verification link. Please try logging in or request a new verification email.');
                    return;
                }

                await applyActionCode(auth, actionCode);
                setVerificationStatus('success');
                setMessage('Email verified successfully! You can now log in to your account.');

                // Automatically redirect after success
                setTimeout(() => {
                    navigate('/login');
                }, 3000);

            } catch (error) {
                console.error('Verification error:', error);
                
                if (error.code === 'auth/invalid-action-code') {
                    // Check if user is already verified
                    if (auth.currentUser?.emailVerified) {
                        setVerificationStatus('alreadyVerified');
                        setMessage('Your email is already verified. You can proceed to login.');
                    } else {
                        setVerificationStatus('error');
                        setMessage('This verification link has expired or already been used. Need a new one?');
                    }
                } else {
                    setVerificationStatus('error');
                    setMessage('An error occurred during verification. Please try again or request a new link.');
                }
            }
        };

        verifyEmail();
    }, [navigate]);

    const handleResendVerification = async () => {
        if (isProcessing) return;
        
        setIsProcessing(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                setMessage('A new verification email has been sent. Please check your inbox and spam folder.');
            } else {
                setMessage('Please return to login and request a new verification email.');
            }
        } catch (error) {
            console.error('Error sending verification:', error);
            setMessage('Failed to send verification email. Please try again later.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNavigateToLogin = () => {
        navigate('/login');
    };

    const renderContent = () => {
        switch (verificationStatus) {
            case 'verifying':
                return (
                    <div className="verify-content">
                        <div className="spinner"></div>
                        <h2>Verifying your email...</h2>
                        <p>Please wait while we verify your email address.</p>
                    </div>
                );

            case 'success':
                return (
                    <div className="verify-content">
                        <div className="success-icon">✓</div>
                        <h2>Email Verified!</h2>
                        <p>{message}</p>
                        <p className="redirect-text">Redirecting to login page...</p>
                    </div>
                );

            case 'alreadyVerified':
                return (
                    <div className="verify-content">
                        <div className="success-icon">✓</div>
                        <h2>Already Verified</h2>
                        <p>{message}</p>
                        <button 
                            onClick={handleNavigateToLogin}
                            className="primary-button"
                        >
                            Continue to Login
                        </button>
                    </div>
                );

            case 'error':
                return (
                    <div className="verify-content">
                        <div className="error-icon">!</div>
                        <h2>Verification Issue</h2>
                        <p>{message}</p>
                        <div className="button-group">
                            <button 
                                onClick={handleResendVerification}
                                className="secondary-button"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Sending...' : 'Resend Verification Email'}
                            </button>
                            <button 
                                onClick={handleNavigateToLogin}
                                className="primary-button"
                            >
                                Return to Login
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="verify-email-container">
            <div className="verify-email-card">
                {renderContent()}
            </div>
        </div>
    );
};

export default VerifyEmail;