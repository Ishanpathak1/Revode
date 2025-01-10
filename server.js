// server.js
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config();

const app = express();

// Configure CORS for your frontend
app.use(cors({
    origin: ['http://localhost:3000', 'https://revode.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// Initialize OpenAI with error handling
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error('OPENAI_API_KEY is not defined in environment variables');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: apiKey
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// OpenAI test route
app.get('/test-openai', async (req, res) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: "Say hello"
                }
            ]
        });
        res.json({ response: completion.choices[0].message.content });
    } catch (error) {
        console.error('OpenAI Test Error:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.response?.data || 'No additional details'
        });
    }
});

// MCQ generation endpoint
app.post('/api/generate-mcqs', async (req, res) => {
    try {
        const { description } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        console.log('Generating MCQs for:', description.substring(0, 100) + '...');

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a LeetCode expert specializing in algorithmic problem-solving. Generate 5 challenging multiple choice questions based on the given coding problem.
                    Return ONLY a JSON array without any markdown formatting.
                    Each question object should have exactly this format:
                    {
                        "question": "Question text here?",
                        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                        "correctIndex": 0
                    }
                
                    Focus your questions on these key areas:
                    1. Time and Space Complexity Analysis
                       - Best/worst/average case complexities
                       - Space-time tradeoffs
                       - Optimization opportunities
                
                    2. Algorithm Design Patterns
                       - Identifying suitable data structures
                       - Common patterns (Two Pointers, Sliding Window, etc.)
                       - Why certain approaches are better than others
                
                    3. Edge Cases and Problem Constraints
                       - Corner cases that could break the solution
                       - Input validation and boundary conditions
                       - Scale considerations
                
                    4. Solution Optimization
                       - Performance bottlenecks
                       - Memory usage optimization
                       - Code efficiency improvements
                
                    5. Implementation Details
                       - Critical steps in the algorithm
                       - Key variables and their roles
                       - Common implementation pitfalls
                
                    Make questions challenging by:
                    - Including specific numerical examples
                    - Comparing multiple approaches
                    - Analyzing tradeoffs between solutions
                    - Discussing algorithmic improvements
                    - Examining edge cases and their handling
                
                    Avoid:
                    - Basic syntax questions
                    - Language-specific features
                    - Trivial or obvious answers
                    - Questions unrelated to algorithmic thinking`
                },
                {
                    role: "user",
                    content: `Create MCQs for this LeetCode problem: ${description}`
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        // Clean and parse the response
        let content = completion.choices[0].message.content;
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        try {
            const mcqs = JSON.parse(content);
            
            // Validate MCQ format
            if (!Array.isArray(mcqs)) {
                throw new Error('Response is not an array');
            }

            mcqs.forEach((mcq, index) => {
                if (!mcq.question || !Array.isArray(mcq.options) || 
                    mcq.options.length !== 4 || typeof mcq.correctIndex !== 'number') {
                    throw new Error(`Invalid MCQ format at index ${index}`);
                }
            });

            console.log('Successfully generated MCQs');
            res.json({ mcqs });
        } catch (parseError) {
            console.error('Error parsing MCQs:', content);
            res.status(500).json({ 
                error: 'Failed to parse MCQs',
                details: parseError.message,
                rawContent: content 
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Failed to generate MCQs',
            details: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
    });
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'build')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });
  }
  
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});