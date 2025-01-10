// TypingEffect.js
import React, { useEffect, useState } from 'react';
import './TypingEffect.css';

const TypingEffect = () => {
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    const words = [
        'LeetCode',
        'HackerRank',
        'CodeChef',
        'Codeforces',
        'AtCoder'
    ];

    useEffect(() => {
        const animateText = () => {
            const currentWord = words[currentIndex];
            
            if (isDeleting) {
                setDisplayText(currentWord.substring(0, displayText.length - 1));
                setTypingSpeed(50); // Faster when deleting
            } else {
                setDisplayText(currentWord.substring(0, displayText.length + 1));
                setTypingSpeed(70); // Normal speed when typing
            }

            // Handle word completion or deletion
            if (!isDeleting && displayText === currentWord) {
                setTimeout(() => setIsDeleting(true), 900); // Wait before deleting
            } else if (isDeleting && displayText === '') {
                setIsDeleting(false);
                setCurrentIndex((currentIndex + 1) % words.length);
                setTypingSpeed(200);
            }
        };

        const timer = setTimeout(animateText, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayText, isDeleting, currentIndex, typingSpeed]);

    return (
        <div className="typing-container">
            <h1>Master <span className="typing-text">{displayText}</span> Problems with Active Recall</h1>
        </div>
    );
};

export default TypingEffect;