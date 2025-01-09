const generateMCQs = async (problemDescription) => {
    try {
        const response = await fetch('http://localhost:3000/api/generate-mcqs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                description: problemDescription 
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate MCQs');
        }

        const data = await response.json();
        return data.mcqs;
    } catch (error) {
        console.error('Error generating MCQs:', error);
        throw error;
    }
};

export { generateMCQs };