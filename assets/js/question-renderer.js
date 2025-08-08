/* ===================================
   Question Renderer - Handles DOM updates for the quiz
   =================================== */
class QuestionRenderer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found.`);
        }
        this.options = options;
        this.currentQuestion = null;
        this.timerInterval = null;
        this.timeRemaining = 0;
        this.isAnswered = false;

        // Callbacks to communicate with the Game Engine
        this.onAnswerCallback = null;
        this.onNextCallback = null;
    }

    // Renders a new question to the screen
    renderQuestion(question, index, total) {
        this.currentQuestion = question;
        this.isAnswered = false;
        clearInterval(this.timerInterval);

        const html = `
            <div class="question-renderer">
                <div class="question-header">
                    <div class="question-progress-text">Question ${index + 1} of ${total}</div>
                    <div class="timer-text" id="timer">${this.options.timeLimit || '∞'}</div>
                </div>
                <p class="question-text">${question.question}</p>
                <div class="answer-options" id="answer-options">
                    ${question.options.map((option, i) => `
                        <button class="answer-option" data-index="${i}">${option}</button>
                    `).join('')}
                </div>
                <div class="question-feedback" id="question-feedback"></div>
                <div class="question-actions">
                    <button class="btn btn-primary" id="next-question-btn" style="display: none;">Next Question</button>
                </div>
            </div>
        `;
        this.container.innerHTML = html;
        this.addEventListeners();
        this.startTimer();
    }

    // Adds click listeners to the answer options and the "Next" button
    addEventListeners() {
        this.container.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectAnswer(e));
        });

        document.getElementById('next-question-btn').addEventListener('click', () => {
            if (this.onNextCallback) this.onNextCallback();
        });
    }

    // Handles the logic when a user clicks an answer
    selectAnswer(event) {
        if (this.isAnswered) return;
        this.isAnswered = true;
        clearInterval(this.timerInterval);

        const selectedOption = event.target;
        const selectedIndex = parseInt(selectedOption.dataset.index, 10);
        const isCorrect = this.currentQuestion.options[selectedIndex] === this.currentQuestion.correct_answer;
        
        // Provide visual feedback on the options
        this.container.querySelectorAll('.answer-option').forEach((btn, index) => {
            btn.classList.add('disabled');
            if (this.currentQuestion.options[index] === this.currentQuestion.correct_answer) {
                btn.classList.add('correct');
            } else if (index === selectedIndex) {
                btn.classList.add('incorrect');
            }
        });

        this.showFeedback(isCorrect);
        document.getElementById('next-question-btn').style.display = 'inline-flex';

        // Send the result back to the game engine
        if (this.onAnswerCallback) {
            this.onAnswerCallback({
                question: this.currentQuestion,
                isCorrect: isCorrect,
                responseTime: (this.options.timeLimit || 0) - this.timeRemaining,
                timeLimit: this.options.timeLimit
            });
        }
    }

    // Starts the countdown timer for the question
    startTimer() {
        if (!this.options.timeLimit) return;
        this.timeRemaining = this.options.timeLimit;
        const timerEl = document.getElementById('timer');
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            if (timerEl) {
                 timerEl.textContent = this.timeRemaining;
            }
            if (this.timeRemaining <= 0) {
                clearInterval(this.timerInterval);
                this.handleTimeUp();
            }
        }, 1000);
    }

    // Handles the logic when the timer runs out
    handleTimeUp() {
        if (this.isAnswered) return;
        this.isAnswered = true;

        this.container.querySelectorAll('.answer-option').forEach(btn => btn.classList.add('disabled'));
        this.showFeedback(false, true);
        document.getElementById('next-question-btn').style.display = 'inline-flex';

        if (this.onAnswerCallback) {
            this.onAnswerCallback({
                question: this.currentQuestion,
                isCorrect: false,
                isTimeout: true,
                responseTime: this.options.timeLimit,
                timeLimit: this.options.timeLimit
            });
        }
    }

    // Displays feedback and the explanation after an answer
    showFeedback(isCorrect, isTimeout = false) {
        const feedbackEl = document.getElementById('question-feedback');
        if (!feedbackEl) return;

        if (isTimeout) {
            feedbackEl.innerHTML = `<p class="feedback-text">Time's up!</p>`;
            feedbackEl.className = 'question-feedback incorrect';
        } else if (isCorrect) {
            feedbackEl.innerHTML = `<p class="feedback-text">Correct!</p>`;
            feedbackEl.className = 'question-feedback correct';
        } else {
            feedbackEl.innerHTML = `<p class="feedback-text">Incorrect.</p>`;
            feedbackEl.className = 'question-feedback incorrect';
        }
        
        if (this.currentQuestion.explanation) {
            feedbackEl.innerHTML += `<p class="feedback-explanation">${this.currentQuestion.explanation}</p>`;
        }
    }
    
    // Methods for the Game Engine to subscribe to events
    onAnswer(callback) { this.onAnswerCallback = callback; return this; }
    onNext(callback) { this.onNextCallback = callback; return this; }
}
