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

            let filtered = questionPool;
            if (settings.difficulty && settings.difficulty !== 'Mixed' && settings.difficulty !== 'Auto') {
                filtered = questionPool.filter(q => q.difficulty === settings.difficulty);
            }
            
            if (settings.shuffleQuestions) {
                this.shuffleArray(filtered);
            }

            const finalQuestions = filtered.slice(0, settings.questionsCount);

            if (settings.shuffleOptions) {
                finalQuestions.forEach(q => this.shuffleQuestionOptions(q));
            }

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
            return data.questions || [];
        } catch (error) {
            console.error(`Failed to load or parse ${filename}:`, error);
            throw error;
        }
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    shuffleQuestionOptions(question) {
        if (question.options) {
            this.shuffleArray(question.options);
        }
        return question;
    }
}
