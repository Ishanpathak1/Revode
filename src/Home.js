import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import TypingEffect from './components/TypingEffect';

const Home = () => {
    return (
        <div className="home">
            {/* Navigation */}
            <nav className="nav">
                <div className="nav-brand">Revode</div>
                <div className="nav-links">
                    <Link to="/login" className="nav-link">Login</Link>
                    <Link to="/signup" className="nav-btn">Sign Up</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
    <div className="hero-content">
        <TypingEffect />
        <p>Transform your coding interview preparation with AI-powered MCQs and spaced repetition</p>
        <Link to="/signup" className="cta-button">Get Started Free</Link>
    </div>
</section>

            {/* Features Section */}
            <section className="features">
                <h2>Why Choose Revode?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📝</div>
                        <h3>Problem Tracking</h3>
                        <p>Save and organize your LeetCode problems in one place.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI-Generated MCQs</h3>
                        <p>Reinforce concepts with custom questions for each problem.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎯</div>
                        <h3>Active Recall</h3>
                        <p>Test your knowledge with spaced repetition quizzes.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📈</div>
                        <h3>Progress Tracking</h3>
                        <p>Monitor your improvement with detailed statistics.</p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats">
                <div className="stat-item">
                    <h3>Revise</h3>
                    <p>You don't learn the algorithm, you learn the technique</p>
                </div>
                <div className="stat-item">
                    <h3>Understand</h3>
                    <p>You just don't copy paste the code, you know the code</p>
                </div>
                <div className="stat-item">
                    <h3>Prepare</h3>
                    <p>Prepare yourself for the Interviews. Keep your skills sharp</p>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <h2>How It Works</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Add Problems</h3>
                        <p>Save your solved LeetCode problems to your dashboard.</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Generate MCQs</h3>
                        <p>Get AI-powered questions to test your understanding.</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Practice Daily</h3>
                        <p>Maintain your streak and track your progress.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <h2>Ready to ace your coding interviews?</h2>
                <p>Join thousands of developers preparing for technical interviews</p>
                <Link to="/signup" className="cta-button">Start Learning Now</Link>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>Revode</h3>
                        <p>Revolutionizing algorihtm practice with active recall and AI-powered learning.</p>
                    </div>
                    <div className="footer-section">
                        <h3>Quick Links</h3>
                        <Link to="/login">Login</Link>
                        <Link to="/signup">Sign Up</Link>
                    </div>
                    <div className="footer-section">
                        <h3>Contact</h3>
                        <p>Email: ishan.pathak2711@gmail.com</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Revode. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;