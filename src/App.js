import React, { useEffect } from "react";
import { Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import mixpanel from 'mixpanel-browser';
import UserProfilePage from './components/UserProfilePage';
import SignUp from "./components/Auth/Signup";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/Auth/PrivateRoute";
import StreakPage from "./components/streakPage";
import Home from "./Home";
import RankingPage from "./components/Rankingpage";
import VerifyEmail from "./components/VerifyEmail";
import Blog from "./components/Blog";
import BlogDetail from "./components/BlogDetail";

const MIXPANEL_TOKEN = process.env.REACT_APP_MIXPANEL_TOKEN;

const App = () => {
    const location = useLocation();
    const navigationType = useNavigationType();

    useEffect(() => {
        // Initialize Mixpanel
        if (MIXPANEL_TOKEN) {
            mixpanel.init(MIXPANEL_TOKEN, {
                debug: process.env.NODE_ENV === 'development',
                persistence: 'localStorage',
                track_pageview: false,
                ignore_dnt: true
            });
        }
    }, []);

    useEffect(() => {
        // Track page views
        const handleRouteChange = (url) => {
            try {
                // Get session ID or create new one
                let sessionId = sessionStorage.getItem('session_id') || 
                    `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                sessionStorage.setItem('session_id', sessionId);

                // Only track if Mixpanel is initialized
                if (MIXPANEL_TOKEN) {
                    mixpanel.track('Page View', {
                        url: url,
                        session_id: sessionId,
                        referrer: document.referrer || 'direct',
                        navigation_type: navigationType,
                        browser: navigator?.userAgent,
                        language: navigator?.language,
                        screen_size: `${window.innerWidth}x${window.innerHeight}`,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                }
            } catch (error) {
                console.error('Mixpanel tracking error:', error);
            }
        };

        // Track route change
        handleRouteChange(location.pathname + location.search);
    }, [location, navigationType]); // Add location and navigationType to dependency array

    return (
        <div>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:postId" element={<BlogDetail />} />
                <Route path="/rank" element={<RankingPage />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/streakpage" element={<StreakPage />} />
                <Route path="/verify-email" element={<VerifyEmail />} /> 
                <Route path="/users/:userId" element={<UserProfilePage />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </div>
    );
};

export default App;