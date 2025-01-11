import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { format, parseISO, startOfYear, endOfYear } from "date-fns";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip } from "react-tooltip";
import Navbar from "./Navbar";

const UserProfilePage = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set date range for heatmap
  const startDate = startOfYear(new Date());
  const endDate = endOfYear(new Date());

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile data
        const userProfileRef = doc(db, "userProfiles", userId);
        const userProfileSnap = await getDoc(userProfileRef);
        
        if (!userProfileSnap.exists()) {
          throw new Error("User profile not found");
        }
        
        // Fetch user stats
        const userStatsRef = collection(db, "userStats");
        const statsQuery = query(userStatsRef, where("userId", "==", userId));
        const statsSnap = await getDocs(statsQuery);
        
        // Fetch activity data
        const activityRef = collection(db, "activities");
        const activityQuery = query(activityRef, where("userId", "==", userId));
        const activitySnap = await getDocs(activityQuery);
        
        const activities = activitySnap.docs.map(doc => ({
          date: new Date(doc.data().date).toISOString().split('T')[0],
          count: doc.data().count
        }));

        setUserData(userProfileSnap.data());
        setStreakData(statsSnap.docs[0]?.data() || null);
        setActivityData(activities);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="loading">Loading profile...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="error">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="streak-container">
        <div className="streak-content">
          <div className="profile-section">
            <div className="profile-header">
              <div className="profile-wrapper">
                <div className="profile-photo-container">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName?.charAt(0) || "U")}&background=random`}
                    alt="User Avatar"
                    className="profile-avatar"
                  />
                </div>
                <div className="profile-info">
                  <h1>{userData?.displayName || 'Anonymous User'}</h1>
                  {userData?.bio && <p className="bio">{userData.bio}</p>}
                  <div className="profile-links">
                    {userData?.portfolioUrl && (
                      <a 
                        href={userData.portfolioUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="profile-link"
                      >
                        Portfolio
                      </a>
                    )}
                    {userData?.githubUrl && (
                      <a 
                        href={userData.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="profile-link"
                      >
                        GitHub
                      </a>
                    )}
                    {userData?.linkedinUrl && (
                      <a 
                        href={userData.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="profile-link"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                    ? `${format(parseISO(value.date), "MMM d, yyyy")}: ${value.count} submission${
                        value.count !== 1 ? "s" : ""
                      }`
                    : "No activity",
                })}
              />
              <Tooltip id="calendar-tooltip" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfilePage;