// server.js
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

// Add cors middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

// Add a test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});
app.get('/test-openai', async (req, res) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: "Say hello"
                }
            ]
        });
        res.json({ response: completion.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            details: error.response?.data || 'No additional details'
        });
    }
});

// The MCQ generation endpoint
app.post('/api/generate-mcqs', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        const { description } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a LeetCode expert. Generate 5 multiple choice questions based on the problem. Each question should have 4 options and one correct answer. Format the response as an array of objects with 'question', 'options', and 'correctIndex' properties."
                },
                {
                    role: "user",
                    content: `Create MCQs for this LeetCode problem: ${description}`
                }
            ]
        });

        console.log('OpenAI response:', completion.choices[0]);
        const mcqs = JSON.parse(completion.choices[0].message.content);
        res.json({ mcqs });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});