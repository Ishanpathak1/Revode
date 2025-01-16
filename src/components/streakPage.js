import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { format, parseISO, startOfYear, endOfYear } from "date-fns";
import { updateProfile } from "firebase/auth";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip } from "react-tooltip";
import "./streakPage.css";
import Navbar from "./Navbar";
import DynamicMeta from "./DynamicMeta";

const StreakPage = () => {
  const [user, setUser] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Set date range for heatmap
  const startDate = startOfYear(new Date());
  const endDate = endOfYear(new Date());

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        setIsLoading(true);
        try {
          await Promise.all([
            fetchStreakData(user.uid),
            fetchActivityData(user.uid),
            fetchProfileData(user.uid)
          ]);
        } catch (error) {
          setError("Error loading data: " + error.message);
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchProfileData = async (userId) => {
    try {
      const profileRef = doc(db, "userProfiles", userId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        setProfileData(profileSnap.data());
      } else {
        const initialProfile = {
          displayName: user.displayName || '',
          email: user.email,
          createdAt: new Date().toISOString()
        };
        await setDoc(profileRef, initialProfile);
        setProfileData(initialProfile);
      }
    } catch (error) {
      setError("Error fetching profile data: " + error.message);
    }
  };

  const fetchStreakData = async (userId) => {
    try {
      const userStatsRef = collection(db, "userStats");
      const q = query(userStatsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setStreakData(data);
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

      const activities = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          date: formatDate(data.date),
          count: data.count,
        };
      });

      setActivityData(activities);
    } catch (error) {
      setError("Error fetching activity data: " + error.message);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let updatedData = { ...profileData };

      // Validate URLs
      const urlFields = ['portfolioUrl', 'githubUrl', 'linkedinUrl'];
      urlFields.forEach(field => {
        if (updatedData[field] && !updatedData[field].startsWith('http')) {
          updatedData[field] = `https://${updatedData[field]}`;
        }
      });

      // Update timestamps
      updatedData.updatedAt = new Date().toISOString();

      // Update profile in Firestore
      await setDoc(doc(db, "userProfiles", user.uid), updatedData, { merge: true });
      
      // Update display name in Firebase Auth if changed
      if (user.displayName !== updatedData.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: updatedData.displayName
        });
      }

      setProfileData(updatedData);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      setError("Error updating profile: " + error.message);
    } finally {
      setIsLoading(false);
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
    <DynamicMeta/>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="streak-container">
        {isLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : user ? (
          <div className="streak-content">
            <div className="profile-section">
              <div className="profile-header">
                <div className="profile-wrapper">
                  <div className="profile-photo-container">
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email?.charAt(0) || "U")}&background=random`}
                      alt="User Avatar"
                      className="profile-avatar"
                    />
                  </div>
                  {isEditing ? (
                    <form onSubmit={handleProfileUpdate} className="profile-form">
                      <div className="input-group">
                        <input
                          type="text"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            displayName: e.target.value
                          })}
                          placeholder="Display Name"
                          className="form-input"
                        />
                        {!profileData.displayName && (
                          <span className="input-message">Adding a display name helps others recognize you!</span>
                        )}
                      </div>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          bio: e.target.value
                        })}
                        placeholder="Bio (optional)"
                        className="form-textarea"
                        maxLength={500}
                      />
                      <input
                        type="url"
                        value={profileData.portfolioUrl}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          portfolioUrl: e.target.value
                        })}
                        placeholder="Portfolio URL (optional)"
                        className="form-input"
                      />
                      <input
                        type="url"
                        value={profileData.githubUrl}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          githubUrl: e.target.value
                        })}
                        placeholder="GitHub URL (optional)"
                        className="form-input"
                      />
                      <input
                        type="url"
                        value={profileData.linkedinUrl}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          linkedinUrl: e.target.value
                        })}
                        placeholder="LinkedIn URL (optional)"
                        className="form-input"
                      />
                      <div className="form-buttons">
                        <button 
                          type="submit" 
                          className="primary-btn"
                          disabled={isLoading}
                        >
                          {isLoading ? "Saving..." : "Save"}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setIsEditing(false)}
                          className="secondary-btn"
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="profile-info">
                      <h1>{profileData.displayName || user.email}</h1>
                      {!profileData.displayName && (
                        <p className="display-name-message">Add a display name to personalize your profile!</p>
                      )}
                      {profileData.bio && <p className="bio">{profileData.bio}</p>}
                      <div className="profile-links">
                        {profileData.portfolioUrl && (
                          <a 
                            href={profileData.portfolioUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="profile-link"
                          >
                            Portfolio
                          </a>
                        )}
                        {profileData.githubUrl && (
                          <a 
                            href={profileData.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="profile-link"
                          >
                            GitHub
                          </a>
                        )}
                        {profileData.linkedinUrl && (
                          <a 
                            href={profileData.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="profile-link"
                          >
                            LinkedIn
                          </a>
                        )}
                      </div>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="edit-btn"
                      >
                        Edit Profile
                      </button>
                    </div>
                  )}
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

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="welcome-container">
            <div className="welcome-content">
              <h2 className="welcome-title">Welcome to Revode!</h2>
              <p className="welcome-text">Please log in to view your statistics and manage your profile.</p>
              <div className="welcome-buttons">
                <button 
                  onClick={() => window.location.href = '/login'} 
                  className="primary-btn"
                >
                  Login
                </button>
                <button 
                  onClick={() => window.location.href = '/signup'} 
                  className="secondary-btn"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StreakPage;