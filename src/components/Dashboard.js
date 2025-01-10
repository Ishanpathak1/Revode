import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { useRole } from '../hooks/useRole';
import { ROLES, canAddProblems } from '../utils/roles';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from "firebase/firestore";
import "./Dashboard.css";
import Navbar from "./Navbar";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const { role, loading: roleLoading } = useRole(user);
    const userCanAddProblems = role === ROLES.ADMIN;
    
    // State variables
    const [problems, setProblems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [completedQuizzes, setCompletedQuizzes] = useState([]);
    const [currentQuizProblemId, setCurrentQuizProblemId] = useState(null);
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

    // Filtered problems
    const filteredProblems = problems.filter(problem => {
        const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = !difficultyFilter || problem.difficulty === difficultyFilter;
        return matchesSearch && matchesDifficulty;
    });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            if (user) {
                fetchProblems();
                fetchCompletedQuizzes();
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchProblems = async () => {
        try {
            const problemsRef = collection(db, "problems");
            // If admin, fetch all problems, else fetch based on filters
            const q = userCanAddProblems 
                ? query(problemsRef)
                : query(problemsRef, where("isPublic", "==", true));
            
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

    const fetchCompletedQuizzes = async () => {
        try {
            const completedRef = collection(db, "completedQuizzes");
            const q = query(completedRef, where("userId", "==", auth.currentUser?.uid));
            const querySnapshot = await getDocs(q);
            const completed = querySnapshot.docs.map(doc => doc.data().problemId);
            setCompletedQuizzes(completed);
        } catch (error) {
            console.error("Error fetching completed quizzes:", error);
        }
    };

    const handleDeleteProblem = async (problemId) => {
        if (!userCanAddProblems) return;
        
        try {
            // Delete problem
            await deleteDoc(doc(db, "problems", problemId));
            
            // Delete associated quiz
            const quizQuery = query(
                collection(db, "quizzes"), 
                where("problemId", "==", problemId)
            );
            const quizSnapshot = await getDocs(quizQuery);
            quizSnapshot.docs.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });
            
            // Refresh problems list
            await fetchProblems();
            setError(null);
        } catch (error) {
            setError("Error deleting problem: " + error.message);
        }
    };

    const generateMCQs = async (problemDescription) => {
        try {
            const apiUrl = process.env.REACT_APP_API_BASE_URL;
            if (!apiUrl) {
                throw new Error("API base URL is not defined");
            }

            const response = await fetch(`${apiUrl}/generate-mcqs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: problemDescription }),
            });

            if (!response.ok) {
                const errorData = await response.json();
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
        if (!userCanAddProblems) {
            setError("You don't have permission to add problems");
            return;
        }

        try {
            if (!newProblem.title || !newProblem.description || !newProblem.link) {
                setError("Please fill in all fields");
                return;
            }

            setLoading(true);
            
            const problemData = {
                ...newProblem,
                createdBy: auth.currentUser.uid,
                isPublic: true,
                createdAt: new Date().toISOString(),
            };
            
            const problemRef = await addDoc(collection(db, "problems"), problemData);
            const mcqs = await generateMCQs(newProblem.description);
            
            const quizData = {
                problemId: problemRef.id,
                createdBy: auth.currentUser.uid,
                mcqs: mcqs,
                createdAt: new Date().toISOString(),
            };
            
            await addDoc(collection(db, "quizzes"), quizData);
            
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
        if (completedQuizzes.includes(problemId)) {
            setError("You have already completed this quiz!");
            return;
        }

        try {
            setCurrentQuizProblemId(problemId);
            
            const quizzesRef = collection(db, "quizzes");
            const q = query(quizzesRef, where("problemId", "==", problemId));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const quizData = querySnapshot.docs[0].data();
                
                if (quizData.mcqs && Array.isArray(quizData.mcqs)) {
                    setCurrentQuiz(quizData.mcqs);
                    setQuizResponses({});
                    setQuizSubmitted(false);
                    setCurrentScore(null);
                } else {
                    setError("Quiz data is not in the correct format");
                }
            } else {
                setError("No quiz found for this problem");
            }
        } catch (error) {
            console.error("Error in startQuiz:", error);
            setError("Error starting quiz: " + error.message);
        }
    };

    const handleQuizSubmit = async () => {
        if (!currentQuiz || !currentQuizProblemId) return;
        
        if (completedQuizzes.includes(currentQuizProblemId)) {
            setError("You have already completed this quiz!");
            return;
        }

        try {
            const { score, passed } = calculateQuizScore(currentQuiz, quizResponses);
            const today = new Date().toISOString().split('T')[0];
            
            // Record quiz completion regardless of pass/fail
            await addDoc(collection(db, "completedQuizzes"), {
                userId: auth.currentUser.uid,
                problemId: currentQuizProblemId,
                score: score,
                passed: passed,
                completedAt: new Date().toISOString()
            });

            if (passed) {
                await updateUserStats(score, passed, today);
                await updateActivityData(today);
                // Add to completed quizzes list
                setCompletedQuizzes([...completedQuizzes, currentQuizProblemId]);
            }

            setCurrentScore(score);
            setQuizSubmitted(true);
            setError(passed ? null : "Quiz score below 70%. Try again!");

        } catch (error) {
            console.error("Error in quiz submission:", error);
            setError(`Error submitting quiz: ${error.message}`);
        }
    };

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

    const updateUserStats = async (score, passed, today) => {
        const userStatsRef = collection(db, "userStats");
        const q = query(userStatsRef, where("userId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
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

    const calculateNewStreak = (lastSolved, today, currentStreak) => {
        if (!lastSolved) return 1;

        const lastSolvedDate = new Date(lastSolved);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastSolvedDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return currentStreak;
        if (diffDays === 1) return currentStreak + 1;
        return 1;
    };

    const updateActivityData = async (today) => {
        const activityRef = collection(db, "activities");
        const activityQuery = query(
            activityRef,
            where("userId", "==", auth.currentUser.uid),
            where("date", "==", today)
        );
        
        const activitySnapshot = await getDocs(activityQuery);

        if (activitySnapshot.empty) {
            await addDoc(collection(db, "activities"), {
                userId: auth.currentUser.uid,
                date: today,
                count: 1,
                createdAt: new Date().toISOString()
            });
        } else {
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
                    {/* Add Problem Form - Only visible to admin */}
                    {userCanAddProblems && (
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
                    )}
    
                    {/* Problems List with Search and Filter */}
                    <div className="dashboard-card">
                        <h2 className="card-title">
                            {userCanAddProblems ? "Manage Problems" : "Available Problems"}
                        </h2>
                        
                        {/* Search and Filter Section */}
                        <div className="problem-filters">
                            <input
                                type="text"
                                placeholder="Search problems..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-input"
                            />
                            <select
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                                className="form-select"
                            >
                                <option value="">All Difficulties</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
    
                        <div className="problem-list">
                            {filteredProblems.map((problem) => (
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
                                        
                                        {userCanAddProblems ? (
                                            // Admin actions
                                            <div className="admin-actions">
                                                <button
                                                    onClick={() => handleEditProblem(problem.id)}
                                                    className="secondary-btn"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProblem(problem.id)}
                                                    className="danger-btn"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ) : (
                                            // Student actions
                                            <button
                                                onClick={() => startQuiz(problem.id)}
                                                className="primary-btn"
                                                disabled={completedQuizzes.includes(problem.id)}
                                            >
                                                {completedQuizzes.includes(problem.id) 
                                                    ? "Completed" 
                                                    : "Start Quiz"}
                                            </button>
                                        )}
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
                                                        disabled={quizSubmitted || completedQuizzes.includes(currentQuizProblemId)}
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
                                        disabled={completedQuizzes.includes(currentQuizProblemId)}
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
                                                    setCurrentQuizProblemId(null);
                                                }}
                                                className="primary-btn close-btn"
                                            >
                                                Close Quiz
                                            </button>
                                            {!completedQuizzes.includes(currentQuizProblemId) && (
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
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="dashboard-card">
                    <h2 className="text-center text-2xl font-bold mb-6">Welcome to Revode</h2>
                    <p className="text-center mb-8">Please log in or sign up to access the dashboard.</p>
                    <div className="flex justify-center gap-4">
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
            )}
        </div>
    );
};

export default Dashboard;