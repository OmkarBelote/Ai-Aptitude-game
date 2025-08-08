/* ===================================
   Scoring System - Calculates scores
   =================================== */
class ScoringSystem {
    constructor() {
        this.config = CONFIG.SCORING;
    }

    calculateQuestionScore(answerData, context) {
        if (!answerData.isCorrect) {
            return 0;
        }

        let score = this.config.BASE_SCORE;
        const question = answerData.question;

        const difficultyMultiplier = this.config.DIFFICULTY_MULTIPLIERS[question.difficulty] || 1.0;
        score *= difficultyMultiplier;

        const timeRemaining = answerData.timeLimit - answerData.responseTime;
        if (timeRemaining > this.config.TIME_BONUS_THRESHOLD) {
            score += this.config.TIME_BONUS_POINTS;
        }

        if (context.currentStreak >= this.config.STREAK_BONUS_THRESHOLD) {
            score += this.config.STREAK_BONUS_POINTS;
        }

        return Math.round(score);
    }
}
