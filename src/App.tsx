import React, { useState, useCallback, useEffect } from "react";
import { Play, Clock, Heart, Zap, BookOpen, Trophy, RotateCcw, Home, Star } from 'lucide-react';

// แก้ไขพาธการ Import สำหรับคอมโพเนนต์เกมเดิม
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import SkillSelection from './components/SkillSelection';
import GameOver from './components/GameOver';

// พาธสำหรับคอมโพเนนต์ใหม่ที่อยู่ใน src/components/
import Login from './components/Login';
import Register from './components/Register';

// พาธสำหรับ AuthContext ที่อยู่ใน src/contexts/
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import ยังคงเหมือนเดิม

// Type Definitions (จาก types/game.ts - โค้ดเดิม)
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
  gameStatus: 'menu' | 'playing' | 'levelUp' | 'gameOver' | 'login' | 'register';
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

// Utility Functions (จาก utils/questionGenerator.ts - โค้ดเดิม)
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
  const maxAttempts = 100;

  do {
    const range = getRange(difficulty);
    num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    if (op === '+') answer = num1 + num2;
    else if (op === '-') answer = num1 - num2;
    else if (op === '*') answer = num1 * num2;
    else {
      num1 = num1 * num2;
      answer = num1 / num2;
    }
    attempts++;
  } while (answer < 0 || answer > 1000 || !Number.isInteger(answer) && attempts < maxAttempts);

  if (attempts === maxAttempts) {
    console.warn("Could not generate suitable question within max attempts. Using fallback.");
    return generateQuestion(difficulty - 1 > 0 ? difficulty - 1 : 1);
  }

  const choices: number[] = [answer];
  while (choices.length < 3) {
    let randomChoice: number;
    do {
      randomChoice = Math.floor(Math.random() * 100) + answer - 50;
      randomChoice = Math.max(1, Math.min(1000, randomChoice));
    } while (choices.includes(randomChoice) || randomChoice === answer);
    choices.push(randomChoice);
  }

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
  timeLimit: 60,
  timeBonus: 0,
  damageMultiplier: 1,
  currentQuestion: null,
  gameStatus: 'login',
  difficulty: 1,
  questionsAnswered: 0,
};

const EXP_TO_LEVEL_UP = 100;
const LIVES_PER_LEVEL = 1;

function AppContent() {
  const { isAuthenticated, setLoggedInUser, logout, username } = useAuth(); // เพิ่ม username เข้ามาเพื่อแสดงผล
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = useCallback((message: string) => {
    setFeedbackMessage(message);
    const timer = setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartGame = useCallback((mode: 'classic' | 'time') => {
    setGameState((prev) => ({
      ...initialGameState,
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
        newExp += (10 * prev.damageMultiplier) + (prev.difficulty * 2);

        if (prev.mode === 'time') {
            const timeTaken = (Date.now() - prev.startTime) / 1000;
            const remainingTime = Math.max(0, prev.timeLimit - timeTaken);
            newTimeBonus += Math.min(5, Math.floor(remainingTime / 5));
        }

        if (newExp >= EXP_TO_LEVEL_UP * newLevel) {
            newLevel++;
            newExp = 0;
            newGameStatus = 'levelUp';
            newLives = Math.min(prev.maxLives + LIVES_PER_LEVEL, 5);
            showFeedback(`🎉 Level Up! You are now Level ${newLevel}!`);
        } else {
            newDifficulty = Math.min(10, prev.difficulty + 0.2);
        }
      } else {
        showFeedback("❌ Incorrect!");
        newLives = prev.lives - 1;
        if (newLives <= 0) {
          newGameStatus = 'gameOver';
        } else {
            newDifficulty = Math.max(1, prev.difficulty - 0.5);
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
      gameStatus: 'menu',
      difficulty: 1,
      lives: initialGameState.maxLives,
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

  const handleLoginSuccess = useCallback((username: string) => {
    setLoggedInUser(username);
    setGameState((prev) => ({ ...prev, gameStatus: 'menu' }));
    showFeedback("Login successful!");
  }, [setLoggedInUser, showFeedback]);

  const handleRegisterSuccess = useCallback(() => {
    setGameState((prev) => ({ ...prev, gameStatus: 'login' }));
    showFeedback("Registration successful! Please login.");
  }, [showFeedback]);

  if (!isAuthenticated) {
    if (gameState.gameStatus === 'login') {
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
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
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setGameState((prev) => ({ ...prev, gameStatus: 'register' }))}
      />
    );
  }

  return (
    // เปลี่ยน div หลักให้ใช้ 'flex-col' และ 'justify-between' เพื่อดันปุ่ม logout ไปอยู่ด้านบน
      <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-zinc-900 to-stone-900 text-white overflow-hidden">
      {/* Floating Header - ลอยอย่างสมบูรณ์ ไม่กินพื้นที่ */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="w-full px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-2 pointer-events-auto">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse opacity-60"></div>
            <span className="text-xs text-white/40 font-light">TheMathrix</span>
          </div>
          
          {username && (
            <div className="flex items-center space-x-3 pointer-events-auto">
              <span className="text-xs text-white/30 hidden sm:block font-light">
                {username}
              </span>
              <button
                onClick={logout}
                className="text-white/30 hover:text-white/60 text-sm font-light transition-colors duration-200 w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* เนื้อหาหลักของเกม - เต็มหน้าจอจริงๆ ไม่มีอะไรมากีดขวาง */}
      <div className="absolute inset-0 flex flex-col items-center"> {/* เพิ่ม w-full และ flex-grow */}
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
      </div> {/* ปิดเนื้อหาหลัก */}

      {feedbackMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up-toast">
          <div className="bg-white/30 backdrop-blur-lg text-white px-8 py-4 rounded-full border border-white/50 shadow-xl text-lg font-bold flex items-center space-x-2">
            {feedbackMessage}
          </div>
        </div>
      )}

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
      {/* ปุ่ม Logout ถูกย้ายไปอยู่ข้างบนใน div ของ header */}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
