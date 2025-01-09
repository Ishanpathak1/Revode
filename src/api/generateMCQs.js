export const generateMCQs = async (problemDescription) => {
    try {
        // Use a relative URL for the backend API
        const response = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/generate-mcqs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description: problemDescription }),
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
