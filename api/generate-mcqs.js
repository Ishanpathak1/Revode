const OpenAI = require('openai');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error('OPENAI_API_KEY is not defined in environment variables');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: apiKey,
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { description } = req.body;

            if (!description) {
                return res.status(400).json({ error: 'Description is required' });
            }

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
                max_tokens: 2000,
            });

            const content = completion.choices[0].message.content;
            const mcqs = JSON.parse(content);

            res.status(200).json({ mcqs });
        } catch (error) {
            console.error('Error generating MCQs:', error);
            res.status(500).json({ error: 'Failed to generate MCQs', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};
