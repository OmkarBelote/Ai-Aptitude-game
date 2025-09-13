/* ===================================
   AI Gaming Aptitude Assessment
   Game Engine - Core Game Logic
   =================================== */
class GameEngine {
    constructor() {
        this.gameState = 'idle'; // idle, loading, playing, completed, error
        this.gameMode = null;
        this.settings = {};
        this.currentSession = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.lastError = null;

        // Initialize dependencies
        this.questionManager = new QuestionManager();
        this.storageManager = new StorageManager();
        this.scoringSystem = new ScoringSystem();
        this.questionRenderer = null; // Will be created in startGame
    }

    setState(newState) {
        this.gameState = newState;
        console.log(`Game state changed to: ${newState}`);
    }

    // Main function to start a game
    async startGame(gameMode) {
        try {
            this.setState('loading');
            this.gameMode = gameMode;
            
            // Get the configuration for the selected game mode
            const modeConfig = CONFIG.GAME_MODES[gameMode.toUpperCase()];
            if (!modeConfig) {
                throw new Error(`Configuration for game mode "${gameMode}" not found.`);
            }
            this.settings = { ...modeConfig };
            
            this.initializeSession();
            
            // Use the QuestionManager to load the necessary questions
            this.questions = await this.questionManager.getQuestions(this.settings);

            if (!this.questions || this.questions.length === 0) {
                throw new Error("No questions could be loaded. Please check the data files and game settings.");
            }
            
            // Create and set up the renderer
            const containerId = 'game-container';
            this.questionRenderer = new QuestionRenderer(containerId, {
                timeLimit: this.settings.timeLimit
            });
            this.setupRendererCallbacks();
            
            this.setState('playing');
            this.sessionStartTime = Date.now();
            this.loadCurrentQuestion();
            
            return true; // Signal success
        } catch (error) {
            this.lastError = error.message;
            console.error('Error starting game:', error);
            this.setState('error');
            return false; // Signal failure
        }
    }
    
    // Resets the state for a new game session
    initializeSession() {
        this.currentSession = {
            id: 'session_' + Date.now() + Math.random().toString(16).slice(2),
            gameMode: this.gameMode,
            startTime: new Date().toISOString(),
            answers: [],
            score: 0,
            bestStreak: 0,
            subjectBreakdown: {},
            difficultyHistory: []
        };
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;
    }

    // Connects the renderer's actions to the engine's logic
    setupRendererCallbacks() {
        this.questionRenderer
            .onAnswer((answerData) => this.handleQuestionAnswer(answerData))
            .onNext(() => this.nextQuestion());
    }

    // Loads the current question into the renderer
    loadCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length && !this.settings.endOnWrongAnswer) {
            this.completeGame();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        this.currentSession.difficultyHistory.push(question.difficulty);
        this.questionRenderer.renderQuestion(question, this.currentQuestionIndex + 1, this.settings.questionsCount);
    }

    // Processes the user's answer
    handleQuestionAnswer(answerData) {
        const points = this.scoringSystem.calculateQuestionScore(answerData, { currentStreak: this.streak });
        answerData.pointsEarned = points;

        if (answerData.isCorrect) {
            this.streak++;
            this.score += points;
        } else {
            this.streak = 0;
            // End game if in survival mode
            if (this.settings.endOnWrongAnswer) {
                this.completeGame();
                return;
            }
        }
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        
        // Update session data
        this.currentSession.score = this.score;
        this.currentSession.bestStreak = this.bestStreak;
        this.currentSession.answers.push(answerData);
        this.updateSubjectBreakdown(answerData);
    }

    // Updates the performance stats for each subject
    updateSubjectBreakdown(answerData) {
        const subject = answerData.question.subject;
        if (!this.currentSession.subjectBreakdown[subject]) {
            this.currentSession.subjectBreakdown[subject] = { correct: 0, total: 0, accuracy: 0, points: 0, topics: {} };
        }

        const breakdown = this.currentSession.subjectBreakdown[subject];
        breakdown.total++;
        breakdown.points += answerData.pointsEarned;

        if (answerData.isCorrect) {
            breakdown.correct++;
        }
        breakdown.accuracy = (breakdown.correct / breakdown.total) * 100;

        // Update topic-level breakdown
        const topic = answerData.question.topic;
        if (!breakdown.topics[topic]) {
            breakdown.topics[topic] = { correct: 0, total: 0, accuracy: 0 };
        }
        breakdown.topics[topic].total++;
        if (answerData.isCorrect) {
            breakdown.topics[topic].correct++;
        }
        breakdown.topics[topic].accuracy = (breakdown.topics[topic].correct / breakdown.topics[topic].total) * 100;
    }

    // Moves to the next question or ends the game
    nextQuestion() {
        if (this.gameState !== 'playing') return;

        this.currentQuestionIndex++;
        // Dynamic difficulty adjustment
        if (this.settings.difficulty === 'Auto' && this.currentQuestionIndex < this.questions.length) {
            this.questions = this.questionManager.getDynamicQuestions(this.questions, this.currentQuestionIndex, this.currentSession);
        }

        if (this.currentQuestionIndex < this.questions.length) {
            this.loadCurrentQuestion();
        } else {
            this.completeGame();
        }
    }
    
    // Finalizes and saves the game session
    completeGame() {
        if (this.gameState === 'completed') return;
        this.setState('completed');
        
        const correctAnswers = this.currentSession.answers.filter(a => a.isCorrect).length;
        this.currentSession.totalQuestions = this.currentSession.answers.length;
        this.currentSession.correctAnswers = correctAnswers;
        this.currentSession.accuracy = this.currentSession.totalQuestions > 0 ? (correctAnswers / this.currentSession.totalQuestions) * 100 : 0;
        this.currentSession.endTime = new Date().toISOString();
        
        this.saveSession();
        
        console.log('Game completed. Final Session:', this.currentSession);
        // Redirect to the results page with the session ID
        window.location.href = `results.html?session=${this.currentSession.id}`;
    }

    // Saves the completed session to local storage
    saveSession() {
        const key = CONFIG.STORAGE_KEYS.GAME_SESSIONS;
        const sessions = this.storageManager.get(key, []);
        sessions.push(this.currentSession);
        this.storageManager.set(key, sessions);
    }
}