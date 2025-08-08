// AI Gaming Aptitude Assessment Configuration
const CONFIG = {
    // Game Mode Configurations
    GAME_MODES: {
        RAPID_FIRE: {
            name: 'Rapid Fire',
            questionsCount: 20,
            timeLimit: 30, // seconds per question
            difficulty: 'Mixed',
            subjects: ['Mathematics', 'Logical Reasoning', 'Verbal Ability', 'Quantitative Aptitude', 'Technical Aptitude']
        },
        SURVIVAL: {
            name: 'Survival',
            questionsCount: 100, // A high number to simulate 'endless'
            timeLimit: 45,
            difficulty: 'Auto', // Difficulty can increase over time
            endOnWrongAnswer: true,
            subjects: ['Mathematics', 'Logical Reasoning', 'Verbal Ability', 'Quantitative Aptitude', 'Technical Aptitude']
        },
        MARATHON: {
            name: 'Marathon',
            questionsCount: 50,
            timeLimit: 60,
            difficulty: 'Mixed',
            subjects: ['Mathematics', 'Logical Reasoning', 'Verbal Ability', 'Quantitative Aptitude', 'Technical Aptitude']
        }
    },

    // Scoring System Configuration
    SCORING: {
        BASE_SCORE: 10,
        DIFFICULTY_MULTIPLIERS: {
            'Easy': 1.0,
            'Medium': 1.5,
            'Hard': 2.0,
            'Expert': 2.5
        },
        TIME_BONUS_THRESHOLD: 10, // seconds left on timer to get a bonus
        TIME_BONUS_POINTS: 5,
        STREAK_BONUS_THRESHOLD: 3, // 3 correct answers in a row
        STREAK_BONUS_POINTS: 10
    },

    // Storage Keys for LocalStorage
    STORAGE_KEYS: {
        GAME_SESSIONS: 'aptitude_game_sessions'
    },
};
