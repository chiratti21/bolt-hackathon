import React, { useState, useCallback, useEffect } from "react";
import { Play, Clock, Heart, Zap, BookOpen, Trophy, RotateCcw, Home, Star } from 'lucide-react';

// แก้ไขพาธการ Import สำหรับคอมโพเนนต์เกมเดิม
// โดยสมมติว่าไฟล์เหล่านี้อยู่ในไดเรกทอรีเดียวกับ App.tsx (เช่น src/)
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import SkillSelection from './components/SkillSelection';
import GameOver from './components/GameOver';

// พาธสำหรับคอมโพเนนต์ใหม่ที่อยู่ใน src/components/
import Login from './components/Login';
import Register from './components/Register';

// พาธสำหรับ AuthContext ที่อยู่ใน src/contexts/
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Type Definitions (from types/game.ts)
export interface Question {
  text: string;
  answer: number;
  choices: number[];
  difficulty: number;
}

export interface GameState {
  mode: 'classic' | 'time' | null;
  lives: number;
  maxLives: number;
  score: number;
  exp: number;
  level: number;
  startTime: number;
  timeLimit: number;
  timeBonus: number;
  damageMultiplier: number;
  currentQuestion: Question | null;
  gameStatus: 'menu' | 'playing' | 'levelUp' | 'gameOver' | 'login' | 'register'; // Add login/register status
  difficulty: number;
  questionsAnswered: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: (state: GameState) => GameState;
}

// Utility Functions (from utils/questionGenerator.ts - assuming this file exists)
export function generateQuestion(difficulty: number): Question {
  const operators = ['+', '-', '*', '/'];
  const op = operators[Math.floor(Math.random() * operators.length)];

  const getRange = (diff: number) => {
    if (diff <= 2) return { min: 1, max: 10 };
    if (diff <= 5) return { min: 5, max: 20 };
    if (diff <= 8) return { min: 10, max: 30 };
    return { min: 20, max: 50 };
  };

  let num1, num2, answer;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops

  do {
    const range = getRange(difficulty);
    num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    if (op === '+') answer = num1 + num2;
    else if (op === '-') answer = num1 - num2;
    else if (op === '*') answer = num1 * num2;
    else { // Division
      // Ensure division results in an integer
      num1 = num1 * num2; // Make num1 a multiple of num2
      answer = num1 / num2;
    }
    attempts++;
  } while (answer < 0 || answer > 1000 || !Number.isInteger(answer) && attempts < maxAttempts); // Add maxAttempts

  if (attempts === maxAttempts) {
    // Fallback for extremely difficult generation if needed
    console.warn("Could not generate suitable question within max attempts. Using fallback.");
    return generateQuestion(difficulty - 1 > 0 ? difficulty - 1 : 1); // Retry with lower difficulty
  }

  const choices: number[] = [answer];
  while (choices.length < 3) { // Ensure 3 choices
    let randomChoice: number;
    do {
      randomChoice = Math.floor(Math.random() * 100) + answer - 50; // Generate choices around the answer
      randomChoice = Math.max(1, Math.min(1000, randomChoice)); // Keep choices within a reasonable range
    } while (choices.includes(randomChoice) || randomChoice === answer);
    choices.push(randomChoice);
  }

  // Shuffle choices
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return {
    text: `${num1} ${op} ${num2} = ?`,
    answer,
    choices,
    difficulty,
  };
}


const initialGameState: GameState = {
  mode: null,
  lives: 3,
  maxLives: 3,
  score: 0,
  exp: 0,
  level: 1,
  startTime: 0,
  timeLimit: 60, // 60 seconds for Time Attack
  timeBonus: 0, // No time bonus by default
  damageMultiplier: 1, // No damage multiplier by default
  currentQuestion: null,
  gameStatus: 'login', // Initial status is login
  difficulty: 1,
  questionsAnswered: 0,
};

const EXP_TO_LEVEL_UP = 100; // EXP needed to level up
const LIVES_PER_LEVEL = 1; // Lives gained per level up

function AppContent() { // Renamed App to AppContent
  const { isAuthenticated, login, logout } = useAuth();
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = useCallback((message: string) => {
    setFeedbackMessage(message);
    const timer = setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000); // Message disappears after 3 seconds
    return () => clearTimeout(timer);
  }, []);

  const handleStartGame = useCallback((mode: 'classic' | 'time') => {
    setGameState((prev) => ({
      ...initialGameState, // Reset to initial state
      mode: mode,
      startTime: mode === 'time' ? Date.now() : 0,
      gameStatus: 'playing',
      currentQuestion: generateQuestion(initialGameState.difficulty),
    }));
    showFeedback(`Starting ${mode === 'classic' ? 'Classic' : 'Time Attack'} Mode!`);
  }, [showFeedback]);

  const handleAnswerSelect = useCallback((selectedAnswer: number) => {
    if (!gameState.currentQuestion) return;

    const isCorrect = selectedAnswer === gameState.currentQuestion.answer;

    setGameState((prev) => {
      let newScore = prev.score;
      let newExp = prev.exp;
      let newLives = prev.lives;
      let newDifficulty = prev.difficulty;
      let newQuestionsAnswered = prev.questionsAnswered + 1;
      let newGameStatus = prev.gameStatus;
      let newLevel = prev.level;
      let newTimeBonus = prev.timeBonus;

      if (isCorrect) {
        showFeedback("✅ Correct!");
        newScore += 10 * prev.damageMultiplier;
        newExp += (10 * prev.damageMultiplier) + (prev.difficulty * 2); // More EXP for higher difficulty

        // Calculate time bonus for Time Attack mode
        if (prev.mode === 'time') {
            const timeTaken = (Date.now() - prev.startTime) / 1000;
            const remainingTime = Math.max(0, prev.timeLimit - timeTaken);
            // Example: 1 bonus point for every 5 seconds remaining, up to a max
            newTimeBonus += Math.min(5, Math.floor(remainingTime / 5));
        }

        if (newExp >= EXP_TO_LEVEL_UP * newLevel) {
            newLevel++;
            newExp = 0; // Reset EXP for the new level
            newGameStatus = 'levelUp';
            newLives = Math.min(prev.maxLives + LIVES_PER_LEVEL, 5); // Gain lives on level up, max 5 for example
            showFeedback(`🎉 Level Up! You are now Level ${newLevel}!`);
        } else {
            newDifficulty = Math.min(10, prev.difficulty + 0.2); // Gradually increase difficulty
        }
      } else {
        showFeedback("❌ Incorrect!");
        newLives = prev.lives - 1;
        if (newLives <= 0) {
          newGameStatus = 'gameOver';
        } else {
            newDifficulty = Math.max(1, prev.difficulty - 0.5); // Decrease difficulty on incorrect answer
        }
      }

      return {
        ...prev,
        score: newScore,
        exp: newExp,
        lives: newLives,
        level: newLevel,
        difficulty: newDifficulty,
        questionsAnswered: newQuestionsAnswered,
        timeBonus: newTimeBonus,
        gameStatus: newGameStatus,
        currentQuestion: newGameStatus === 'playing' ? generateQuestion(newDifficulty) : null,
      };
    });
  }, [gameState.currentQuestion, gameState.mode, showFeedback]);


  const handleTimeUp = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      gameStatus: 'gameOver',
    }));
    showFeedback("⏰ Time's Up!");
  }, [showFeedback]);

  const handleRestart = useCallback(() => {
    setGameState({
      ...initialGameState,
      gameStatus: 'menu', // Go back to menu to select mode
      difficulty: 1,
      lives: initialGameState.maxLives, // Reset lives to max on restart
    });
    showFeedback("Game Restarted!");
  }, [showFeedback]);

  const handleBackToMenu = useCallback(() => {
    setGameState({
      ...initialGameState,
      gameStatus: 'menu',
    });
    showFeedback("Back to Main Menu!");
  }, [showFeedback]);

  const availableSkills: Skill[] = [
    {
      id: 'extraLife',
      name: 'Extra Life',
      icon: '❤️',
      description: 'Gain +1 Max Life and heal 1 life.',
      effect: (state) => ({
        ...state,
        maxLives: state.maxLives + 1,
        lives: Math.min(state.lives + 1, state.maxLives + 1),
      }),
    },
    {
      id: 'damageBoost',
      name: 'Damage Boost',
      icon: '💥',
      description: 'Increase score and EXP gain by 50%.',
      effect: (state) => ({ ...state, damageMultiplier: state.damageMultiplier + 0.5 }),
    },
    {
      id: 'timeSaver',
      name: 'Time Saver',
      icon: '⏳',
      description: 'Add 10 seconds to Time Attack mode.',
      effect: (state) => ({ ...state, timeLimit: state.timeLimit + 10 }),
    },
    {
        id: 'difficultyMastery',
        name: 'Difficulty Mastery',
        icon: '🧠',
        description: 'Significantly increase next question difficulty.',
        effect: (state) => ({ ...state, difficulty: state.difficulty + 1 }),
    },
    {
        id: 'healingPotion',
        name: 'Healing Potion',
        icon: '🧪',
        description: 'Heal 2 lives.',
        effect: (state) => ({ ...state, lives: Math.min(state.lives + 2, state.maxLives) }),
    },
  ];

  const handleSkillSelect = useCallback((skill: Skill) => {
    setGameState((prev) => {
      const newState = skill.effect(prev);
      return {
        ...newState,
        gameStatus: 'playing',
        currentQuestion: generateQuestion(newState.difficulty),
      };
    });
    showFeedback(`Skill Unlocked: ${skill.name}!`);
  }, [showFeedback]);

  // ** ย้าย handleLoginSuccess และ handleRegisterSuccess มาไว้ตรงนี้ **
  const handleLoginSuccess = useCallback((username: string) => {
    login(username); // Now `login` expects a username
    setGameState((prev) => ({ ...prev, gameStatus: 'menu' })); // After login, go to game menu
    showFeedback("Login successful!");
  }, [login, showFeedback]);

  const handleRegisterSuccess = useCallback(() => {
    setGameState((prev) => ({ ...prev, gameStatus: 'login' })); // After registration, go to login screen
    showFeedback("Registration successful! Please login.");
  }, [showFeedback]);
  // ** สิ้นสุดการย้าย **


  if (!isAuthenticated) {
    if (gameState.gameStatus === 'login') {
      return (
        <Login
          onLoginSuccess={handleLoginSuccess} // Pass handleLoginSuccess directly
          onNavigateToRegister={() => setGameState((prev) => ({ ...prev, gameStatus: 'register' }))}
        />
      );
    } else if (gameState.gameStatus === 'register') {
      return (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={() => setGameState((prev) => ({ ...prev, gameStatus: 'login' }))}
        />
      );
    }
    // Default to login if status is not explicitly set for auth
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setGameState((prev) => ({ ...prev, gameStatus: 'register' }))}
      />
    );
  }

  // Render game screens if authenticated
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-zinc-900 to-stone-900 text-white flex flex-col items-center justify-center">
      {gameState.gameStatus === 'menu' && (
        <StartScreen onSelectMode={handleStartGame} />
      )}

      {gameState.gameStatus === 'playing' && gameState.currentQuestion && (
        <GameScreen
          gameState={gameState}
          onAnswerSelect={handleAnswerSelect}
          onTimeUp={handleTimeUp}
        />
      )}

      {gameState.gameStatus === "levelUp" && (
        <SkillSelection
          skills={availableSkills}
          onSelectSkill={handleSkillSelect}
          onClose={() =>
            setGameState((prev) => ({
              ...prev,
              gameStatus: "playing",
              currentQuestion: generateQuestion(prev.difficulty),
            }))
          }
        />
      )}

      {gameState.gameStatus === "gameOver" && (
        <GameOver
          gameState={gameState}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up-toast">
          <div className="bg-white/30 backdrop-blur-lg text-white px-8 py-4 rounded-full border border-white/50 shadow-xl text-lg font-bold flex items-center space-x-2">
            {feedbackMessage}
          </div>
        </div>
      )}

      {/* Tailwind CSS keyframes for toast animation */}
      <style>{`
        @keyframes fadeInUpToast {
          0% { opacity: 0; transform: translate(-50%, 20px); }
          20% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
        .animate-fade-in-up-toast {
          animation: fadeInUpToast 3s ease-out forwards;
        }
      `}</style>
      <button
          onClick={logout}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors z-50"
      >
          Logout
      </button>
    </div>
  );
}

// Wrap AppContent with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
