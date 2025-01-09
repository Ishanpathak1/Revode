// src/api/chatgpt.js
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateMCQs = async (problemDescription) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a LeetCode expert. Generate 5 multiple choice questions with 4 options each based on the given problem. Format your response as JSON with this structure: { 'mcqs': [{ 'question': 'question text', 'options': ['option1', 'option2', 'option3', 'option4'], 'correct': 0 }] }"
                },
                {
                    role: "user",
                    content: `Create MCQs for this LeetCode problem: ${problemDescription}`
                }
            ]
        });

        // Parse the response to get the JSON structure
        const mcqsJson = JSON.parse(completion.choices[0].message.content);
        return mcqsJson.mcqs;
    } catch (error) {
        console.error('Error generating MCQs:', error);
        throw error;
    }
};

export { generateMCQs };