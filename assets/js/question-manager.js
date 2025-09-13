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
            } else {
                 this.shuffleArray(filtered); // Shuffle for Mixed/Auto mode initial questions
            }
            
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
    
    // Core AI logic for dynamic question selection
    getDynamicQuestions(currentQuestions, currentIndex, session) {
        const lastAnswer = session.answers[session.answers.length - 1];
        const currentDifficulty = lastAnswer.question.difficulty;
        let nextDifficulty = currentDifficulty;

        if (lastAnswer.isCorrect) {
            // User answered correctly, increase difficulty
            if (currentDifficulty === 'Easy') nextDifficulty = 'Medium';
            else if (currentDifficulty === 'Medium') nextDifficulty = 'Hard';
            else if (currentDifficulty === 'Hard') nextDifficulty = 'Expert';
        } else {
            // User answered incorrectly, decrease difficulty
            if (currentDifficulty === 'Expert') nextDifficulty = 'Hard';
            else if (currentDifficulty === 'Hard') nextDifficulty = 'Medium';
            else if (currentDifficulty === 'Medium') nextDifficulty = 'Easy';
        }
        
        // Find all questions of the new difficulty that haven't been asked yet
        const remainingQuestions = this.questionPool.get(lastAnswer.question.subject)
                                     .filter(q => !session.answers.some(a => a.question.id === q.id));

        const newQuestion = remainingQuestions
                             .find(q => q.difficulty === nextDifficulty) || this.getRandomQuestion(remainingQuestions);

        if (newQuestion) {
            // Insert the new question into the array
            currentQuestions.splice(currentIndex, 0, newQuestion);
        }

        return currentQuestions;
    }

    getRandomQuestion(array) {
        if (array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
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
            this.shuffleArray(question.options);
        }
        return question;
    }
}