import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import Navbar from "./Navbar";
import "./Rankingpage.css";
import DynamicMeta from "./DynamicMeta";

const RankingPage = () => {
    const [user, setUser] = useState(null);
    const [rankings, setRankings] = useState([]);
    const [timeFilter, setTimeFilter] = useState('all-time');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRank, setUserRank] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            if (user) {
                fetchRankings();
            }
        });

        return () => unsubscribe();
    }, [timeFilter]);

    const fetchRankings = async () => {
        try {
            setLoading(true);
            const userStatsRef = collection(db, "userStats");
            const q = query(userStatsRef, orderBy("totalScore", "desc"));
            const querySnapshot = await getDocs(q);
            
            // Create a map to store the highest scoring entry for each email
            const emailMap = new Map();
            
            querySnapshot.docs.forEach((doc) => {
                const data = doc.data();
                const currentEntry = emailMap.get(data.email);
                
                // If no entry exists for this email, or if this entry has a higher score
                if (!currentEntry || (data.totalScore || 0) > (currentEntry.totalScore || 0)) {
                    emailMap.set(data.email, {
                        ...data,
                        uniqueId: doc.id
                    });
                }
            });

            // Convert map to array and add ranks
            const rankingsData = Array.from(emailMap.values())
                .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                .map((data, index) => ({
                    ...data,
                    rank: index + 1
                }));

            // Find current user's rank
            if (user) {
                const userRankData = rankingsData.find(data => data.userId === user.uid);
                setUserRank(userRankData?.rank || null);
            }

            setRankings(rankingsData);
            setError(null);
        } catch (error) {
            console.error("Error in fetchRankings:", error);
            setError("Error fetching rankings: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filterRankings = () => {
        return rankings.filter(rank => {
            const searchTerm = searchQuery.toLowerCase();
            return rank.email?.toLowerCase().includes(searchTerm);
        });
    };

    const getRankBadge = (rank) => {
        switch (rank) {
            case 1:
                return "🥇";
            case 2:
                return "🥈";
            case 3:
                return "🥉";
            default:
                return rank;
        }
    };

    return (
        <>
        <DynamicMeta/>
            <Navbar user={user} onLogout={() => auth.signOut()} />
            <div className="ranking-container">
                {user ? (
                    <div className="ranking-content">
                        <div className="ranking-header">
                            <h1>Global Rankings</h1>
                            <div className="ranking-controls">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input"
                                />
                                <select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="all-time">All Time</option>
                                    <option value="monthly">This Month</option>
                                    <option value="weekly">This Week</option>
                                    <option value="daily">Today</option>
                                </select>
                            </div>
                        </div>

                        {userRank && (
                            <div className="user-ranking-card">
                                <h2>Your Current Ranking</h2>
                                <div className="user-ranking-stats">
                                    <span className="rank-number">#{userRank}</span>
                                    <span className="rank-percentile">
                                        Top {Math.round((userRank / rankings.length) * 100)}%
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="rankings-table-container">
                            {loading ? (
                                <div className="loading-message">Loading rankings...</div>
                            ) : error ? (
                                <div className="error-message">{error}</div>
                            ) : (
                                <table className="rankings-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>User</th>
                                            <th>Problems Solved</th>
                                            <th>Streak</th>
                                            <th>Total Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filterRankings().map((rankData) => (
                                            <tr 
                                                key={rankData.uniqueId}
                                                className={rankData.userId === user.uid ? 'current-user-row' : ''}
                                            >
                                                <td>
                                                    <span className="rank-badge">
                                                        {getRankBadge(rankData.rank)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {rankData.email}{' '}
                                                    {rankData.userId === user.uid && (
                                                        <span className="user-badge">(You)</span>
                                                    )}
                                                </td>
                                                <td>{rankData.solvedProblem || 0}</td>
                                                <td>{rankData.streak || 0} days</td>
                                                <td>{rankData.totalScore || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="welcome-container">
                        <div className="welcome-content">
                            <h2 className="welcome-title">Welcome to Rankings!</h2>
                            <p className="welcome-text">Please log in to view the global rankings.</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default RankingPage;