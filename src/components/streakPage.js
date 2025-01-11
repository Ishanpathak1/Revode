import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { format, startOfYear, endOfYear } from "date-fns";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip } from "react-tooltip";
import "./streakPage.css";
import Navbar from "./Navbar";

const StreakPage = () => {
  const [user, setUser] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [error, setError] = useState(null);

  const startDate = startOfYear(new Date());
  const endDate = endOfYear(new Date());

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchStreakData(user.uid);
        fetchActivityData(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchStreakData = async (userId) => {
    try {
      const userStatsRef = collection(db, "userStats");
      const q = query(userStatsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const streakData = querySnapshot.docs[0].data();
        setStreakData(streakData);
      } else {
        setStreakData(null);
      }
    } catch (error) {
      setError("Error fetching streak data: " + error.message);
    }
  };

  const fetchActivityData = async (userId) => {
    try {
      const activityRef = collection(db, "activities");
      const q = query(activityRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const activityData = querySnapshot.docs.map((doc) => ({
        date: doc.data().date,
        count: doc.data().count,
      }));

      setActivityData(activityData);
    } catch (error) {
      setError("Error fetching activity data: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      setError("Error logging out: " + error.message);
    }
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="streak-container">
        {user ? (
          <div className="streak-content">
            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-wrapper">
                <img
                  src={user.photoURL || "/default-avatar.png"}
                  alt="User Avatar"
                  className="profile-avatar"
                />
                <div className="profile-info">
                  <h1>{user.displayName || user.email}</h1>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3 className="stat-title">Problems Solved</h3>
                <p className="stat-value">{streakData?.solvedProblem || "0"}</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-title">Current Streak</h3>
                <p className="stat-value">
                  {streakData?.streak || "0"} <span>Days</span>
                </p>
              </div>
              <div className="stat-card">
                <h3 className="stat-title">Total Score</h3>
                <p className="stat-value">{streakData?.totalScore || "0"}</p>
              </div>
            </div>

            {/* Heatmap Section */}
            <div className="heatmap-section">
              <h2 className="heatmap-title">Activity Heatmap</h2>
              <div className="heatmap-container">
                <CalendarHeatmap
                  startDate={startDate}
                  endDate={endDate}
                  values={activityData}
                  classForValue={(value) => {
                    if (!value) return "color-empty";
                    return `color-scale-${Math.min(value.count, 4)}`;
                  }}
                  tooltipDataAttrs={(value) => ({
                    "data-tooltip-id": "calendar-tooltip",
                    "data-tooltip-content": value && value.date
                      ? `${format(new Date(value.date), "MMM d, yyyy")}: ${value.count} submission${
                          value.count !== 1 ? "s" : ""
                        }`
                      : "No activity",
                  })}
                />
                <Tooltip id="calendar-tooltip" />
              </div>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <div className="welcome-container">
            <div className="welcome-content">
              <h2 className="welcome-title">Welcome!</h2>
              <p className="welcome-text">Please log in to view your statistics.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StreakPage;