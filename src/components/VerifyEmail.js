//src/components/VerifyEmail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { applyActionCode } from 'firebase/auth';
import './VerifyEmail.css';

const VerifyEmail = () => {
    const [verificationStatus, setVerificationStatus] = useState('verifying');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const queryParams = new URLSearchParams(location.search);
                const actionCode = queryParams.get('oobCode');

                if (!actionCode) {
                    setVerificationStatus('error');
                    return;
                }

                await applyActionCode(auth, actionCode);
                setVerificationStatus('success');

                // Redirect to login after successful verification
                setTimeout(() => {
                    navigate('/login');
                }, 3000);

            } catch (error) {
                console.error('Error verifying email:', error);
                setVerificationStatus('error');
            }
        };

        verifyEmail();
    }, [location, navigate]);

    return (
        <div className="verify-email-container">
            <div className="verify-email-card">
                {verificationStatus === 'verifying' && (
                    <div className="verify-status">
                        <h2>Verifying your email...</h2>
                        <div className="loading-spinner"></div>
                        <p>Please wait while we verify your email address.</p>
                    </div>
                )}

                {verificationStatus === 'success' && (
                    <div className="verify-status success">
                        <h2>Email Verified! ✓</h2>
                        <p>Your email has been successfully verified.</p>
                        <p>Redirecting to login page...</p>
                    </div>
                )}

                {verificationStatus === 'error' && (
                    <div className="verify-status error">
                        <h2>Verification Failed</h2>
                        <p>We couldn't verify your email. The link may have expired or been used already.</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="primary-btn"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;