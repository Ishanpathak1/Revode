import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SignUp from "./components/Auth/Signup";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/Auth/PrivateRoute";
import StreakPage from "./components/streakPage";
import Home from "./Home";

const App = () => {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/streakpage" element={<StreakPage />} />
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