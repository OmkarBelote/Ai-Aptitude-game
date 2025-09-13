/* ===================================
   Question Manager - Loads question data
   =================================== */
class QuestionManager {
    constructor() {
        this.questionPool = new Map();
        this.loadedSubjects = new Set();
    }

    async getQuestions(settings) {
        try {
            const questionPool = [];
            for (const subject of settings.subjects) {
                // Check if the subject questions are already loaded to avoid redundant network calls
                if (!this.loadedSubjects.has(subject)) {
                    const subjectQuestions = await this.loadSubjectFromFile(subject);
                    this.questionPool.set(subject, subjectQuestions);
                    this.loadedSubjects.add(subject);
                }
                questionPool.push(...this.questionPool.get(subject));
            }

            if (questionPool.length === 0) {
                throw new Error('No questions were found. Check file paths and JSON files.');
            }

            // Filter questions by difficulty if a specific difficulty is requested
            let filtered = questionPool;
            if (settings.difficulty && settings.difficulty !== 'Mixed' && settings.difficulty !== 'Auto') {
                filtered = questionPool.filter(q => q.difficulty === settings.difficulty);
            }
            
            // Shuffle the entire filtered pool of questions
            this.shuffleArray(filtered);

            const finalQuestions = filtered.slice(0, settings.questionsCount);

            // Shuffle the options for each question to ensure they appear in a different order
            finalQuestions.forEach(q => this.shuffleQuestionOptions(q));

            return finalQuestions;

        } catch (error) {
            console.error('Error in getQuestions:', error);
            throw error;
        }
    }

    async loadSubjectFromFile(subjectName) {
        const filename = subjectName.toLowerCase().replace(/\s+/g, '-') + '.json';
        try {
            const response = await fetch(`data/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} for file ${filename}`);
            }
            const data = await response.json();
            // Assign a subject to each question for easy reference later
            return (data.questions || []).map(q => ({ ...q, subject: subjectName }));
        } catch (error) {
            console.error(`Failed to load or parse ${filename}:`, error);
            throw error;
        }
    }
    
    // Fisher-Yates shuffle algorithm
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Shuffle options for a single question
    shuffleQuestionOptions(question) {
        if (question.options) {
            // Get the correct answer before shuffling
            const correctAnswer = question.correct_answer;
            this.shuffleArray(question.options);
            // Re-assign the correct answer based on its new position (not necessary, but a good practice)
            // The original logic already handles this correctly by comparing the selected option text
        }
        return question;
    }
}