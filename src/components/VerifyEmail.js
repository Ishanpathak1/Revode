import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { applyActionCode, sendEmailVerification } from 'firebase/auth';

const VerifyEmail = () => {
    const [verificationStatus, setVerificationStatus] = useState('verifying');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Get the action code from the URL
                const urlParams = new URLSearchParams(window.location.search);
                const actionCode = urlParams.get('oobCode');

                if (!actionCode) {
                    setVerificationStatus('error');
                    setError('No verification code found in URL');
                    return;
                }

                // Try to verify the email
                await applyActionCode(auth, actionCode);
                setVerificationStatus('success');

                // Redirect to login after success
                setTimeout(() => {
                    navigate('/login');
                }, 3000);

            } catch (error) {
                console.error('Verification error:', error);
                setVerificationStatus('error');
                
                if (error.code === 'auth/invalid-action-code') {
                    setError('The verification link has expired or already been used. Need a new one?');
                } else {
                    setError('An error occurred during verification. Please try again.');
                }
            }
        };

        verifyEmail();
    }, [navigate]);

    const handleResendVerification = async () => {
        try {
            // Check if user is still signed in
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                setError('A new verification email has been sent. Please check your inbox.');
            } else {
                setError('Please go back to login and try again.');
            }
        } catch (error) {
            setError('Error sending verification email. Please try again later.');
        }
    };

    return (
        <div className="verify-email-container">
            <div className="verify-email-card">
                {verificationStatus === 'verifying' && (
                    <div>
                        <h2>Verifying your email...</h2>
                        <div className="loading-spinner"></div>
                        <p>Please wait while we verify your email address.</p>
                    </div>
                )}

                {verificationStatus === 'success' && (
                    <div>
                        <h2>Email Verified! ✓</h2>
                        <p>Your email has been successfully verified.</p>
                        <p>Redirecting to login page in 3 seconds...</p>
                    </div>
                )}

                {verificationStatus === 'error' && (
                    <div>
                        <h2>Verification Failed</h2>
                        <p>{error}</p>
                        <div className="verify-actions">
                            <button 
                                onClick={handleResendVerification} 
                                className="resend-button"
                            >
                                Resend Verification Email
                            </button>
                            <button 
                                onClick={() => navigate('/login')}
                                className="login-button"
                            >
                                Return to Login
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;