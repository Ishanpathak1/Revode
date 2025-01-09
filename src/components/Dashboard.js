import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true 
});

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
            console.log('Sending problem description:', problemDescription); // Debug log
    
            const response = await fetch('http://localhost:3000/api/generate-mcqs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ description: problemDescription }),
            });
    
            console.log('Response status:', response.status); // Debug log
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData); // Debug log
                throw new Error(errorData.error || 'Failed to generate MCQs');
            }
    
            const data = await response.json();
            console.log('Received MCQs:', data); // Debug log
            
            if (!data.mcqs || !Array.isArray(data.mcqs)) {
                throw new Error('Invalid MCQ data received');
            }
    
            return data.mcqs;
        } catch (error) {
            console.error('Error in generateMCQs:', error); // Debug log
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
            console.log("Problem added with ID:", problemRef.id);
            
            // Generate MCQs
            const mcqs = await generateMCQs(newProblem.description);
            console.log("Generated MCQs:", mcqs);
            
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
            console.error("Error in handleAddProblem:", error);
            setError("Error adding problem: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = async (problemId) => {
    try {
        console.log("Starting quiz for problem:", problemId);
        
        const quizzesRef = collection(db, "quizzes");
        const q = query(quizzesRef, 
            where("problemId", "==", problemId),
            where("userId", "==", auth.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        console.log("Quiz query result:", querySnapshot.size);
        
        if (!querySnapshot.empty) {
            const quizData = querySnapshot.docs[0].data();
            console.log("Found quiz data:", quizData);
            
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
    

    const handleQuizSubmit = () => {
        if (!currentQuiz) return;

        let correctAnswers = 0;
        currentQuiz.forEach((question, index) => {
            if (quizResponses[index] === question.correctIndex) {
                correctAnswers++;
            }
        });

        const score = (correctAnswers / currentQuiz.length) * 100;
        setCurrentScore(score);
        setQuizSubmitted(true);
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            setError("Error logging out: " + error.message);
        }
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
            {/* Header Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>LeetCode Practice Dashboard</h1>
                {user && (
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <img
                            src={user.photoURL || "/default-avatar.png"}
                            alt="User Profile"
                            style={{ borderRadius: "50%", width: "40px", height: "40px" }}
                        />
                        <div>
                            <p style={{ fontWeight: "500" }}>{user.displayName || "N/A"}</p>
                            <p style={{ color: "#666" }}>{user.email}</p>
                        </div>
                        <button 
                            onClick={handleLogout}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div style={{ 
                    backgroundColor: "#ffebee", 
                    color: "#c62828", 
                    padding: "10px", 
                    borderRadius: "4px",
                    marginBottom: "20px" 
                }}>
                    {error}
                </div>
            )}

            {user ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {/* Add Problem Form */}
                    <div style={{ 
                        border: "1px solid #ddd", 
                        borderRadius: "8px", 
                        padding: "20px"
                    }}>
                        <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Add New Problem</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <input
                                type="text"
                                placeholder="Problem Title"
                                value={newProblem.title}
                                onChange={(e) => setNewProblem({
                                    ...newProblem,
                                    title: e.target.value
                                })}
                                style={{
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px"
                                }}
                            />
                            <textarea
                                placeholder="Problem Description"
                                value={newProblem.description}
                                onChange={(e) => setNewProblem({
                                    ...newProblem,
                                    description: e.target.value
                                })}
                                style={{
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    minHeight: "100px"
                                }}
                            />
                            <input
                                type="url"
                                placeholder="LeetCode Link"
                                value={newProblem.link}
                                onChange={(e) => setNewProblem({
                                    ...newProblem,
                                    link: e.target.value
                                })}
                                style={{
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px"
                                }}
                            />
                            <select
                                value={newProblem.difficulty}
                                onChange={(e) => setNewProblem({
                                    ...newProblem,
                                    difficulty: e.target.value
                                })}
                                style={{
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px"
                                }}
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                            <button
                                onClick={handleAddProblem}
                                disabled={loading}
                                style={{
                                    padding: "10px",
                                    backgroundColor: "#2196f3",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? "Adding..." : "Add Problem"}
                            </button>
                        </div>
                    </div>

                    {/* Problems List */}
                    <div style={{ 
                        border: "1px solid #ddd", 
                        borderRadius: "8px", 
                        padding: "20px"
                    }}>
                        <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Your Problems</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {problems.map((problem) => (
                                <div 
                                    key={problem.id}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                        padding: "15px"
                                    }}
                                >
                                    <h3 style={{ marginBottom: "8px" }}>{problem.title}</h3>
                                    <p style={{ color: "#666", marginBottom: "12px" }}>
                                        Difficulty: {problem.difficulty}
                                    </p>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button
                                            onClick={() => window.open(problem.link, '_blank')}
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#fff",
                                                color: "#2196f3",
                                                border: "1px solid #2196f3",
                                                borderRadius: "4px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            View Problem
                                        </button>
                                        <button
                                            onClick={() => startQuiz(problem.id)}
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#2196f3",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer"
                                            }}
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
                        <div style={{ 
                            gridColumn: "span 2",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "20px"
                        }}>
                            <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Quiz</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {currentQuiz.map((question, index) => (
                                    <div key={index}>
                                        <p style={{ marginBottom: "10px", fontWeight: "500" }}>
                                            {index + 1}. {question.question}
                                        </p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {question.options.map((option, optIndex) => (
                                                <label 
                                                    key={optIndex} 
                                                    style={{ 
                                                        display: "flex", 
                                                        gap: "8px",
                                                        padding: "8px",
                                                        backgroundColor: quizSubmitted ? 
                                                            (optIndex === question.correctIndex ? "#e8f5e9" : 
                                                             quizResponses[index] === optIndex ? "#ffebee" : "transparent")
                                                            : "transparent",
                                                        borderRadius: "4px"
                                                    }}
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
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor: "#4caf50",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            marginTop: "20px"
                                        }}
                                    >
                                        Submit Quiz
                                    </button>
                                ) : (
                                    <div style={{ marginTop: "20px" }}>
                                        <p style={{ 
                                            fontSize: "18px", 
                                            fontWeight: "500", 
                                            marginBottom: "10px",
                                            color: currentScore >= 70 ? "#4caf50" : "#f44336"
                                        }}>
                                            Your Score: {currentScore.toFixed(1)}%
                                        </p>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                onClick={() => {
                                                    setCurrentQuiz(null);
                                                    setQuizResponses({});
                                                    setQuizSubmitted(false);
                                                    setCurrentScore(null);
                                                }}
                                                style={{
                                                    padding: "8px 16px",
                                                    backgroundColor: "#2196f3",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Close Quiz
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setQuizResponses({});
                                                    setQuizSubmitted(false);
                                                    setCurrentScore(null);
                                                }}
                                                style={{
                                                    padding: "8px 16px",
                                                    backgroundColor: "#ff9800",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer"
                                                }}
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
                <p>Please log in to access the dashboard.</p>
            )}
        </div>
    );
};

export default Dashboard;