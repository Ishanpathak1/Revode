import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";

import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import "./Dashboard.css";
import Navbar from "./Navbar";


// Initialize OpenAI

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [problems, setProblems] = useState([]);
    const [newProblem, setNewProblem] = useState({
        title: "",
        description: "",
        difficulty: "Easy",
        link: "",
    });
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quizResponses, setQuizResponses] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [currentScore, setCurrentScore] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            if (user) {
                fetchProblems();
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchProblems = async () => {
        try {
            const problemsRef = collection(db, "problems");
            const q = query(problemsRef, where("userId", "==", auth.currentUser?.uid));
            const querySnapshot = await getDocs(q);
            const problemsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProblems(problemsList);
        } catch (error) {
            setError("Error fetching problems: " + error.message);
        }
    };

    const generateMCQs = async (problemDescription) => {
        try {
            const apiUrl = process.env.REACT_APP_API_BASE_URL;

        if (!apiUrl) {
            throw new Error("API base URL is not defined. Check environment variables.");
        }

        const response = await fetch(`${apiUrl}/generate-mcqs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ description: problemDescription }),
            });
    
            
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData); // Debug log
                throw new Error(errorData.error || 'Failed to generate MCQs');
            }
    
            const data = await response.json();
            
            
            if (!data.mcqs || !Array.isArray(data.mcqs)) {
                throw new Error('Invalid MCQ data received');
            }
    
            return data.mcqs;
        } catch (error) {
            
            throw error;
        }
    };

    const handleAddProblem = async () => {
        try {
            if (!newProblem.title || !newProblem.description || !newProblem.link) {
                setError("Please fill in all fields");
                return;
            }
    
            setLoading(true);
            
            // First save the problem and get its ID
            const problemData = {
                ...newProblem,
                userId: auth.currentUser.uid,
                createdAt: new Date().toISOString(),
            };
            
            // Save problem first and get the reference
            const problemRef = await addDoc(collection(db, "problems"), problemData);
            
            
            // Generate MCQs
            const mcqs = await generateMCQs(newProblem.description);
            
            
            // Store MCQs with the correct problem ID
            const quizData = {
                problemId: problemRef.id,  // Use the problem's ID
                userId: auth.currentUser.uid,
                mcqs: mcqs,
                createdAt: new Date().toISOString(),
            };
            
            // Save quiz
            await addDoc(collection(db, "quizzes"), quizData);
            console.log("Quiz saved for problem:", problemRef.id);
    
            // Reset form and refresh problems
            setNewProblem({
                title: "",
                description: "",
                difficulty: "Easy",
                link: "",
            });
            await fetchProblems();
            setError(null);
        } catch (error) {
            
            setError("Error adding problem: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = async (problemId) => {
    try {
        
        
        const quizzesRef = collection(db, "quizzes");
        const q = query(quizzesRef, 
            where("problemId", "==", problemId),
            where("userId", "==", auth.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        
        
        if (!querySnapshot.empty) {
            const quizData = querySnapshot.docs[0].data();
            
            
            if (quizData.mcqs && Array.isArray(quizData.mcqs)) {
                setCurrentQuiz(quizData.mcqs);
                setQuizResponses({});
                setQuizSubmitted(false);
                setCurrentScore(null);
            } else {
                console.error("Invalid quiz data structure:", quizData);
                setError("Quiz data is not in the correct format");
            }
        } else {
            console.log("No quiz found for problem:", problemId);
            setError("No quiz found for this problem");
        }
    } catch (error) {
        console.error("Error in startQuiz:", error);
        setError("Error starting quiz: " + error.message);
    }
};
    

const handleQuizSubmit = async () => {
    if (!currentQuiz) return;

    try {
        // Calculate score and check if quiz passed
        const { score, passed } = calculateQuizScore(currentQuiz, quizResponses);
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Update user statistics
        await updateUserStats(score, passed, today);
        
        // Update activity heatmap data if quiz passed
        if (passed) {
            await updateActivityData(today);
        }

        // Update UI state
        setCurrentScore(score);
        setQuizSubmitted(true);
        setError(passed ? null : "Quiz score below 70%. Streak not updated. Try again!");

    } catch (error) {
        console.error("Error in quiz submission:", error);
        setError(`Error submitting quiz: ${error.message}`);
    }
};

// Helper function to calculate quiz score
const calculateQuizScore = (quiz, responses) => {
    const correctAnswers = quiz.reduce((total, question, index) => {
        return total + (responses[index] === question.correctIndex ? 1 : 0);
    }, 0);

    const score = (correctAnswers / quiz.length) * 100;
    return {
        score,
        passed: score >= 70
    };
};

// Helper function to update user statistics
const updateUserStats = async (score, passed, today) => {
    const userStatsRef = collection(db, "userStats");
    const q = query(userStatsRef, where("userId", "==", auth.currentUser.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // Create new user stats if none exist
        const newUserStats = {
            userId: auth.currentUser.uid,
            email: auth.currentUser.email,
            streak: passed ? 1 : 0,
            lastSolved: passed ? today : null,
            solvedProblem: passed ? 1 : 0,
            totalScore: score,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await addDoc(collection(db, "userStats"), newUserStats);
        return;
    }

    // Update existing user stats
    if (passed) {
        const userStatsDoc = querySnapshot.docs[0];
        const userStats = userStatsDoc.data();
        const newStreak = calculateNewStreak(userStats.lastSolved, today, userStats.streak);

        await updateDoc(doc(db, "userStats", userStatsDoc.id), {
            streak: newStreak,
            lastSolved: today,
            solvedProblem: (userStats.solvedProblem || 0) + 1,
            totalScore: (userStats.totalScore || 0) + score,
            updatedAt: new Date().toISOString()
        });
    }
};

// Helper function to calculate new streak
const calculateNewStreak = (lastSolved, today, currentStreak) => {
    if (!lastSolved) return 1;

    const lastSolvedDate = new Date(lastSolved);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastSolvedDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return currentStreak;        // Same day
    if (diffDays === 1) return currentStreak + 1;    // Consecutive day
    return 1;                                        // Streak broken
};

// Helper function to update activity heatmap data
const updateActivityData = async (today) => {
    const activityRef = collection(db, "activities");
    const activityQuery = query(
        activityRef,
        where("userId", "==", auth.currentUser.uid),
        where("date", "==", today)
    );
    
    const activitySnapshot = await getDocs(activityQuery);

    if (activitySnapshot.empty) {
        // Create new activity entry
        await addDoc(collection(db, "activities"), {
            userId: auth.currentUser.uid,
            date: today,
            count: 1,
            createdAt: new Date().toISOString()
        });
    } else {
        // Update existing activity count
        const activityDoc = activitySnapshot.docs[0];
        await updateDoc(doc(db, "activities", activityDoc.id), {
            count: activityDoc.data().count + 1,
            updatedAt: new Date().toISOString()
        });
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
        <div className="dashboard-container">
            <Navbar user={user} onLogout={handleLogout} />
            {/* Header Section */}
            <header className="dashboard-header">
               
            </header>

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                </div>
            )}

            {user ? (
                <div className="dashboard-grid">
                    {/* Add Problem Form */}
                    <div className="dashboard-card">
                        <h2 className="card-title">Add New Problem</h2>
                        <div className="form-container">
                            <input
                                type="text"
                                placeholder="Problem Title"
                                value={newProblem.title}
                                onChange={(e) => setNewProblem({
                                    ...newProblem,
                                    title: e.target.value
                                })}
                                className="form-input"
                            />
                            <textarea
                                placeholder="Problem Description"
                                value={newProblem.description}
                                onChange={(e) => setNewProblem({
                                    ...newProblem,
                                    description: e.target.value
                                })}
                                className="form-input form-textarea"
                            />
                            <input
                                type="url"
                                placeholder="LeetCode Link"
                                value={newProblem.link}
                                onChange={(e) => setNewProblem({
                                    ...newProblem,
                                    link: e.target.value
                                })}
                                className="form-input"
                            />
                            <select
                                value={newProblem.difficulty}
                                onChange={(e) => setNewProblem({
                                    ...newProblem,
                                    difficulty: e.target.value
                                })}
                                className="form-select"
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                            <button
                                onClick={handleAddProblem}
                                disabled={loading}
                                className="primary-btn"
                            >
                                {loading ? "Adding..." : "Add Problem"}
                            </button>
                        </div>
                    </div>

                    {/* Problems List */}
                    <div className="dashboard-card">
                        <h2 className="card-title">Your Problems</h2>
                        <div className="problem-list">
                            {problems.map((problem) => (
                                <div key={problem.id} className="problem-card">
                                    <h3 className="problem-title">{problem.title}</h3>
                                    <p className="problem-difficulty">
                                        Difficulty: {problem.difficulty}
                                    </p>
                                    <div className="problem-actions">
                                        <button
                                            onClick={() => window.open(problem.link, '_blank')}
                                            className="secondary-btn"
                                        >
                                            View Problem
                                        </button>
                                        <button
                                            onClick={() => startQuiz(problem.id)}
                                            className="primary-btn"
                                        >
                                            Start Quiz
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quiz Section */}
                    {currentQuiz && (
                        <div className="quiz-section">
                            <h2 className="card-title">Quiz</h2>
                            <div className="quiz-container">
                                {currentQuiz.map((question, index) => (
                                    <div key={index} className="quiz-question">
                                        <p className="question-text">
                                            {index + 1}. {question.question}
                                        </p>
                                        <div className="options-list">
                                            {question.options.map((option, optIndex) => (
                                                <label 
                                                    key={optIndex} 
                                                    className={`option-label ${
                                                        quizSubmitted
                                                            ? optIndex === question.correctIndex
                                                                ? "option-correct"
                                                                : quizResponses[index] === optIndex
                                                                ? "option-incorrect"
                                                                : ""
                                                            : ""
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question-${index}`}
                                                        value={optIndex}
                                                        onChange={() => setQuizResponses({
                                                            ...quizResponses,
                                                            [index]: optIndex
                                                        })}
                                                        disabled={quizSubmitted}
                                                        checked={quizResponses[index] === optIndex}
                                                    />
                                                    {option}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {!quizSubmitted ? (
                                    <button
                                        onClick={handleQuizSubmit}
                                        className="primary-btn"
                                    >
                                        Submit Quiz
                                    </button>
                                ) : (
                                    <div className="quiz-result">
                                        <p className={`score-text ${currentScore >= 70 ? 'score-pass' : 'score-fail'}`}>
                                            Your Score: {currentScore.toFixed(1)}%
                                        </p>
                                        <div className="quiz-actions">
                                            <button
                                                onClick={() => {
                                                    setCurrentQuiz(null);
                                                    setQuizResponses({});
                                                    setQuizSubmitted(false);
                                                    setCurrentScore(null);
                                                }}
                                                className="primary-btn close-btn"
                                            >
                                                Close Quiz
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setQuizResponses({});
                                                    setQuizSubmitted(false);
                                                    setCurrentScore(null);
                                                }}
                                                className="primary-btn retry-btn"
                                            >
                                                Retry Quiz
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="dashboard-card">
                    <p className="text-center">Please log in to access the dashboard.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;