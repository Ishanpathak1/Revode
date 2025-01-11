import React from "react";
import { Routes, Route } from "react-router-dom";
import UserProfilePage from './components/UserProfilePage';
import SignUp from "./components/Auth/Signup";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/Auth/PrivateRoute";
import StreakPage from "./components/streakPage";
import Home from "./Home";
import RankingPage from "./components/Rankingpage";
import VerifyEmail from "./components/VerifyEmail";
const App = () => {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/rank" element={<RankingPage />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/streakpage" element={<StreakPage />} />
                <Route path="/verify-email" element={<VerifyEmail />} /> 
                <Route path="/profile/:userId" element={<UserProfilePage />} />
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