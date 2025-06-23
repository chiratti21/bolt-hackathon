import React, { useState, useCallback, useEffect } from "react";
import { Play, Clock, Heart, Zap, BookOpen, Trophy, RotateCcw, Home, Star } from 'lucide-react'; // Import Lucide icons

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
  gameStatus: 'menu' | 'playing' | 'levelUp' | 'gameOver';
  difficulty: number;
  questionsAnswered: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string; // Changed to string for emoji or Lucide icon name
  effect: (state: GameState) => GameState;
}

// Utility Functions (from utils/questionGenerator.ts)
export function generateQuestion(difficulty: number): Question {
  const operators = ['+', '-', '*', '/'];
  const op = operators[Math.floor(Math.random() * operators.length)];

  // Increase number ranges based on difficulty
  const getRange = (diff: number) => {
    if (diff <= 2) return { min: 1, max: 10 };
    if (diff <= 5) return { min: 1, max: 50 };
    if (diff <= 8) return { min: 10, max: 100 };
    return { min: 50, max: 500 };
  };

  const range = getRange(difficulty);
  let question: Question;

  do {
    const a = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const b = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    question = createQuestionTemplate(a, b, op, difficulty);
  } while (question.answer < 0 || question.answer > 9999 || question.choices.some(c => c < 0 || c > 9999)); // Ensure choices are also non-negative and within reasonable bounds
  // Additional check to prevent division by zero or non-integer results for division
  if (op === '/') {
    while (b === 0 || a % b !== 0) {
      b = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }
    question = createQuestionTemplate(a, b, op, difficulty);
  }


  return question;
}

function createQuestionTemplate(a: number, b: number, op: string, difficulty: number): Question {
  let text: string;
  let answer: number;

  switch (op) {
    case '+':
      answer = a + b;
      if (Math.random() < 0.5) {
        text = `${a} + ___ = ${answer}`;
        answer = b;
      } else {
        text = `${a} + ${b} = ___`;
        answer = a + b;
      }
      break;

    case '-':
      if (a < b) [a, b] = [b, a];
      answer = a - b;
      if (Math.random() < 0.5) {
        text = `${a} - ___ = ${answer}`;
        answer = b;
      } else {
        text = `${a} - ${b} = ___`;
        answer = a - b;
      }
      break;

    case '*':
      // Keep multiplication simpler
      const smallA = Math.floor(Math.random() * (Math.min(a, 12) - 1 + 1)) + 1; // Limit factors for multiplication
      const smallB = Math.floor(Math.random() * (Math.min(b, 12) - 1 + 1)) + 1;
      answer = smallA * smallB;
      if (Math.random() < 0.5) {
        text = `${smallA} × ___ = ${answer}`;
        answer = smallB;
      } else {
        text = `${smallA} × ${smallB} = ___`;
        answer = smallA * smallB;
      }
      break;

    case '/':
      // Ensure clean division
      let divisor = Math.floor(Math.random() * (Math.min(b, 12) - 1 + 1)) + 1; // Limit divisor for division
      let dividend = a * divisor; // Ensure dividend is a multiple of divisor
      answer = a; // The initial 'a' will be the quotient

      if (Math.random() < 0.5) {
        text = `${dividend} ÷ ___ = ${a}`;
        answer = divisor;
      } else {
        text = `${dividend} ÷ ${divisor} = ___`;
        answer = a;
      }
      break;

    default:
      text = `${a} + ${b} = ___`;
      answer = a + b;
  }

  // Generate wrong choices
  const choices = new Set<number>();
  choices.add(answer); // Add correct answer first

  while (choices.size < 3) {
    const offset = Math.floor(Math.random() * 20) - 10; // Generate offset between -10 and +9
    let wrongAnswer = answer + offset;

    // Ensure wrong answer is not the same as the correct answer and is non-negative
    if (wrongAnswer < 0) wrongAnswer = Math.abs(wrongAnswer); // If negative, make positive
    if (wrongAnswer === answer) wrongAnswer += (offset >= 0 ? 1 : -1); // If same as answer, adjust by 1

    choices.add(wrongAnswer);
  }

  const finalChoices = Array.from(choices);

  // Shuffle choices
  for (let i = finalChoices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [finalChoices[i], finalChoices[j]] = [finalChoices[j], finalChoices[i]];
  }

  return { text, answer, choices: finalChoices, difficulty };
}

// Utility Functions (from utils/skills.ts)
export const SKILLS: Skill[] = [
  {
    id: 'time_bonus',
    name: 'Time Master',
    description: '+5 seconds time bonus per question',
    icon: '⏰',
    effect: (state: GameState) => ({
      ...state,
      timeBonus: state.timeBonus + 5
    })
  },
  {
    id: 'damage_boost',
    name: 'Brain Power',
    description: '+5 EXP per correct answer',
    icon: '🧠',
    effect: (state: GameState) => ({
      ...state,
      damageMultiplier: state.damageMultiplier + 5
    })
  },
  {
    id: 'extra_life',
    name: 'Extra Heart',
    description: '+1 maximum life',
    icon: '❤️',
    effect: (state: GameState) => ({
      ...state,
      maxLives: state.maxLives + 1,
      lives: state.lives + 1
    })
  },
  {
    id: 'exp_boost',
    name: 'Quick Learner',
    description: '+50% EXP from all sources',
    icon: '📚',
    effect: (state: GameState) => ({
      ...state,
      damageMultiplier: Math.floor(state.damageMultiplier * 1.5)
    })
  }
];

export function getRandomSkills(count: number = 3): Skill[] {
  const shuffled = [...SKILLS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}


// Component: Hearts (from components/Hearts.tsx)
interface DynamicHeartsProps {
  currentLives: number;
  maxLives: number;
  className?: string;
}

function Hearts({
  currentLives,
  maxLives,
  className = "",
}: DynamicHeartsProps) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: maxLives }, (_, i) => {
        const isActive = i < currentLives;
        const heartIndex = i;

        return (
          <div
            key={i}
            className={`relative transition-all duration-300 transform ${isActive ? "scale-100 animate-pulse-fade" : "scale-80 opacity-50"
              }`}
            style={{
              animationDelay: `${heartIndex * 100}ms`,
            }}
          >
            {/* Heart icon */}
            <Heart
              className={`relative w-7 h-7 transition-all duration-300 ${isActive
                  ? "text-red-400 fill-red-400 drop-shadow-lg"
                  : "text-gray-500 fill-gray-500"
                }`}
            />
          </div>
        );
      })}

      {/* Health status indicator */}
      <div className="ml-2 flex flex-col items-start">
        <span className="text-white font-bold text-lg">
          {currentLives}/{maxLives}
        </span>
        <div
          className={`text-sm font-medium ${currentLives > maxLives * 0.6
              ? "text-green-300"
              : currentLives > maxLives * 0.3
                ? "text-yellow-300"
                : "text-red-300"
            }`}
        >
          {currentLives === maxLives
            ? "Perfect!"
            : currentLives > maxLives * 0.6
              ? "Healthy"
              : currentLives > maxLives * 0.3
                ? "Careful"
                : "Critical!"}
        </div>
      </div>
    </div>
  );
}


// Component: StartScreen (from components/StartScreen.tsx)
interface StartScreenProps {
  onSelectMode: (mode: 'classic' | 'time') => void;
}

function StartScreen({ onSelectMode }: StartScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-20 left-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -top-30 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="text-center max-w-4xl mx-auto z-10 relative">
        {/* Game Title */}
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-7xl md:text-9xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 drop-shadow-2xl font-['Inter']">
            The MATHrix
          </h1>
          <p className="text-xl md:text-3xl text-blue-100 mb-4 opacity-90 animate-fade-in-up animation-delay-500">
            Level up your math skills in this epic adventure!
          </p>
          <p className="text-lg text-blue-200 opacity-80 animate-fade-in-up animation-delay-1000">
            Choose your answers wisely, gain EXP, and unlock powerful skills
          </p>
        </div>

        {/* Game Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 animate-fade-in-up animation-delay-1500">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-all duration-300 shadow-xl">
            <BookOpen className="w-10 h-10 text-blue-300 mx-auto mb-3" />
            <p className="text-base text-blue-100 font-medium">Learn & Practice</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-all duration-300 shadow-xl">
            <Zap className="w-10 h-10 text-yellow-300 mx-auto mb-3" />
            <p className="text-base text-blue-100 font-medium">Gain EXP</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-all duration-300 shadow-xl">
            <Heart className="w-10 h-10 text-red-300 mx-auto mb-3" />
            <p className="text-base text-blue-100 font-medium">Life System</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-all duration-300 shadow-xl">
            <Clock className="w-10 h-10 text-green-300 mx-auto mb-3" />
            <p className="text-base text-blue-100 font-medium">Time Challenge</p>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-6 animate-fade-in-up animation-delay-2000">
          <h2 className="text-3xl font-bold text-white mb-8 drop-shadow-md">Choose Your Challenge</h2>

          <button
            onClick={() => onSelectMode('classic')}
            className="group w-full max-w-md mx-auto block bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-extrabold py-7 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-pink-500/50 border-4 border-white/30 hover:border-white/50 animate-pulse-once"
          >
            <div className="flex items-center justify-center space-x-4">
              <Heart className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-left">
                <div className="text-3xl">Classic Mode</div>
                <div className="text-lg opacity-90">3 Lives Challenge</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectMode('time')}
            className="group w-full max-w-md mx-auto block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-extrabold py-7 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/50 border-4 border-white/30 hover:border-white/50 animate-pulse-once animation-delay-300"
          >
            <div className="flex items-center justify-center space-x-4">
              <Clock className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-left">
                <div className="text-3xl">Time Attack</div>
                <div className="text-lg opacity-90">60 Second Rush</div>
              </div>
            </div>
          </button>
        </div>

        {/* Game Info */}
        <div className="mt-16 text-blue-200 text-base max-w-2xl mx-auto opacity-90 animate-fade-in-up animation-delay-2500">
          <p className="mb-3">
            🎯 Answer questions correctly to gain EXP and level up
          </p>
          <p className="mb-3">
            ⚡ Choose powerful skills when you level up
          </p>
          <p>
            🏆 Challenge yourself with increasing difficulty
          </p>
        </div>
      </div>

      {/* Tailwind CSS keyframes for custom animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseOnce {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes pulseFade {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 1s ease-out forwards; }
        .animate-blob { animation: blob 7s infinite cubic-bezier(0.6, -0.28, 0.735, 0.045); }
        .animate-pulse-once { animation: pulseOnce 1.5s ease-out 1; }
        .animate-pulse-fade { animation: pulseFade 2s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-1500 { animation-delay: 1.5s; }
        .animation-delay-2500 { animation-delay: 2.5s; }
        .animation-delay-300 { animation-delay: 0.3s; }
      `}</style>
    </div>
  );
}

// Component: GameScreen (from components/GameScreen.tsx)
interface GameScreenProps {
  gameState: GameState;
  onAnswerSelect: (answer: number) => void;
  onTimeUp: () => void;
}

function GameScreen({
  gameState,
  onAnswerSelect,
  onTimeUp,
}: GameScreenProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [questionTime, setQuestionTime] = useState(10);
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Effect for Time Attack mode global timer
  useEffect(() => {
    if (gameState.mode === "time" && gameState.gameStatus === "playing") {
      const timer = setInterval(() => {
        const elapsed = (Date.now() - gameState.startTime) / 1000;
        const remaining = Math.max(0, gameState.timeLimit - elapsed);
        setTimeLeft(Math.ceil(remaining));

        if (remaining <= 0) {
          clearInterval(timer);
          onTimeUp();
        }
      }, 100);

      return () => clearInterval(timer);
    }
  }, [gameState.mode, gameState.startTime, gameState.timeLimit, gameState.gameStatus, onTimeUp]);

  // Effect for Classic mode question timer
  useEffect(() => {
    if (gameState.mode === "classic" && gameState.currentQuestion && gameState.gameStatus === "playing") {
      const baseTime = 15;
      const timeReduction = Math.floor(gameState.difficulty / 2);
      const adjustedTime = Math.max(5, baseTime - timeReduction + gameState.timeBonus);
      setQuestionTime(adjustedTime);

      let timeRemaining = adjustedTime;
      const timer = setInterval(() => {
        timeRemaining -= 1;
        setQuestionTime(timeRemaining);

        if (timeRemaining <= 0) {
          clearInterval(timer);
          onTimeUp();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [
    gameState.currentQuestion,
    gameState.difficulty,
    gameState.timeBonus,
    gameState.mode,
    gameState.gameStatus,
    onTimeUp,
  ]);

  const handleAnswerClick = (selectedAnswer: number) => {
    const isCorrect = selectedAnswer === gameState.currentQuestion?.answer;
    setAnswerFeedback(isCorrect ? 'correct' : 'wrong');
    onAnswerSelect(selectedAnswer);
    setTimeout(() => setAnswerFeedback(null), 500); // Clear feedback quickly
  };

  const getExpForNextLevel = () => gameState.level * 100;
  const expProgress = (gameState.exp / getExpForNextLevel()) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob-alt"></div>
        <div className="absolute -bottom-20 right-20 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob-alt animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-4xl mx-auto z-10 relative">
        {/* Header Stats */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20 shadow-2xl animate-fade-in-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            {/* Dynamic Lives Display */}
            <div className="flex items-center justify-center md:justify-start">
              <Hearts
                currentLives={gameState.lives}
                maxLives={gameState.maxLives}
              />
            </div>

            {/* Timer */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Clock className="w-8 h-8 text-blue-400" />
                {(gameState.mode === "time" ? timeLeft : questionTime) <= 5 && (
                  <div className="absolute -inset-1 bg-red-400 rounded-full opacity-30 animate-ping-slow" />
                )}
              </div>
              <div>
                <div
                  className={`font-bold text-2xl transition-colors duration-300 ${
                    (gameState.mode === "time" ? timeLeft : questionTime) <= 5
                      ? "text-red-400 animate-pulse-text"
                      : "text-white"
                  }`}
                >
                  {gameState.mode === "time" ? timeLeft : questionTime}s
                </div>
                <div className="text-sm text-blue-200">
                  {gameState.mode === "time" ? "Remaining" : "Per Question"}
                </div>
              </div>
            </div>

            {/* Level */}
            <div className="flex items-center space-x-3">
              <Star className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-white font-bold text-2xl">
                  {gameState.level}
                </div>
                <div className="text-sm text-blue-200">Level</div>
              </div>
            </div>

            {/* EXP Progress */}
            <div className="w-full mt-4 md:mt-0">
              <div className="flex justify-between text-sm text-blue-200 mb-1">
                <span>EXP</span>
                <span>
                  {gameState.exp} / {getExpForNextLevel()}
                </span>
              </div>
              <div className="w-full bg-blue-900/50 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${expProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        {gameState.currentQuestion && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/20 text-center shadow-2xl animate-scale-in">
            <div className="mb-8">
              <div className="text-base text-blue-300 mb-2 font-medium">
                Question {gameState.questionsAnswered + 1} • Difficulty{" "}
                {gameState.difficulty}
              </div>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                {gameState.currentQuestion.text}
              </h2>
            </div>

            {/* Answer Choices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {gameState.currentQuestion.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(choice)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold text-3xl py-8 px-8 rounded-2xl transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl border-4 border-white/20 hover:border-white/40 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Indicator */}
        <div className="text-center animate-fade-in-up animation-delay-500">
          <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-full px-5 py-3 border border-white/20 shadow-lg">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-200 text-sm md:text-base font-medium">
              Difficulty increases every 5 questions
            </span>
          </div>
        </div>
      </div>

      {/* Tailwind CSS keyframes for custom animations for GameScreen */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulsePingSlow {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(1); opacity: 0.7; }
        }
        @keyframes pulseText {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes blobAlt {
          0% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-30px, 40px) scale(1.2); }
          70% { transform: translate(20px, -30px) scale(0.8); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.5s ease-out forwards; }
        .animate-ping-slow { animation: pulsePingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-pulse-text { animation: pulseText 1.5s infinite ease-in-out; }
        .animate-blob-alt { animation: blobAlt 9s infinite cubic-bezier(0.86, 0, 0.07, 1); }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-500 { animation-delay: 0.5s; }
      `}</style>
    </div>
  );
}


// Component: SkillSelection (created from scratch based on usage in App.tsx)
interface SkillSelectionProps {
  skills: Skill[];
  onSelectSkill: (skill: Skill) => void;
  onClose: () => void;
}

function SkillSelection({ skills, onSelectSkill, onClose }: SkillSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-teal-900 to-green-900 flex items-center justify-center p-4">
      <div className="text-center max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-3xl p-10 border border-white/20 shadow-2xl animate-fade-in-up">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
          Level Up! ⬆️
        </h2>
        <p className="text-xl text-blue-200 mb-10">
          Choose a new skill to enhance your power!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => onSelectSkill(skill)}
              className="group bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:border-white/50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex flex-col items-center justify-center text-left"
            >
              <div className="text-5xl mb-4 transition-transform group-hover:scale-110">
                {skill.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                {skill.name}
              </h3>
              <p className="text-sm text-blue-100 opacity-90">
                {skill.description}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 backdrop-blur-sm border border-white/30"
        >
          Resume Game
        </button>
      </div>

      {/* Tailwind CSS keyframes for custom animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}


// Component: GameOver (from components/GameOver.tsx)
interface GameOverProps {
  gameState: GameState;
  onRestart: () => void;
  onBackToMenu: () => void;
}

function GameOver({ gameState, onRestart, onBackToMenu }: GameOverProps) {
  const getRank = () => {
    if (gameState.score >= 50) return { rank: 'Master', color: 'text-yellow-400', icon: '👑' };
    if (gameState.score >= 30) return { rank: 'Expert', color: 'text-purple-400', icon: '💎' };
    if (gameState.score >= 20) return { rank: 'Advanced', color: 'text-blue-400', icon: '⭐' };
    if (gameState.score >= 10) return { rank: 'Skilled', color: 'text-green-400', icon: '🏅' };
    return { rank: 'Beginner', color: 'text-gray-400', icon: '📖' };
  };

  const rankInfo = getRank();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-20 left-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="text-center max-w-2xl mx-auto z-10 relative">
        {/* Game Over Title */}
        <div className="mb-10 animate-fade-in-up">
          <div className="text-8xl mb-6 animate-pulse-emoji">💀</div>
          <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-4 drop-shadow-2xl">
            Game Over!
          </h1>
          <p className="text-xl md:text-2xl text-red-200 opacity-90 animate-fade-in-up animation-delay-500">
            The MATHrix has defeated you... this time!
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-10 border border-white/20 shadow-2xl animate-scale-in animation-delay-1000">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white mb-1">{gameState.score}</div>
              <div className="text-blue-200 text-sm">Final Score</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white mb-1">{gameState.level}</div>
              <div className="text-blue-200 text-sm">Level Reached</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white mb-1">{gameState.exp}</div>
              <div className="text-blue-200 text-sm">Total EXP</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white mb-1">{gameState.questionsAnswered}</div>
              <div className="text-blue-200 text-sm">Questions</div>
            </div>
          </div>

          {/* Rank */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="flex items-center justify-center space-x-4">
              <span className="text-4xl animate-bounce-rank">{rankInfo.icon}</span>
              <div>
                <div className={`text-3xl font-extrabold ${rankInfo.color} drop-shadow-lg`}>
                  {rankInfo.rank}
                </div>
                <div className="text-blue-200 text-base">Performance Rank</div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Messages */}
        <div className="mb-10 animate-fade-in-up animation-delay-1500">
          {gameState.level >= 10 && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-5 mb-4 shadow-md animate-fade-in">
              <div className="flex items-center justify-center space-x-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-200 font-medium">Achievement: Reached Level 10!</span>
              </div>
            </div>
          )}
          {gameState.score >= 25 && (
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-5 mb-4 shadow-md animate-fade-in animation-delay-200">
              <div className="flex items-center justify-center space-x-3">
                <Star className="w-6 h-6 text-purple-400" />
                <span className="text-purple-200 font-medium">Achievement: Master Calculator!</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-5 animate-fade-in-up animation-delay-2000">
          <button
            onClick={onRestart}
            className="w-full max-w-md mx-auto block bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-extrabold py-5 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/50 border-4 border-white/30 hover:border-white/50"
          >
            <div className="flex items-center justify-center space-x-4">
              <RotateCcw className="w-6 h-6" />
              <span>Try Again</span>
            </div>
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full max-w-md mx-auto block bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold py-5 px-8 rounded-full border-4 border-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center space-x-4">
              <Home className="w-6 h-6" />
              <span>Back to Menu</span>
            </div>
          </button>
        </div>

        {/* Motivational Message */}
        <div className="mt-10 text-blue-300 text-base max-w-sm mx-auto opacity-90 animate-fade-in-up animation-delay-2500">
          <p className="mb-3">
            💪 Don't give up! Math mastery comes with practice.
          </p>
          <p>
            🎯 Challenge yourself to beat your high score!
          </p>
        </div>
      </div>
      {/* Tailwind CSS keyframes for custom animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulseEmoji {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes bounceRank {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-15px); }
          60% { transform: translateY(-7px); }
        }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 1s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.5s ease-out forwards; }
        .animate-pulse-emoji { animation: pulseEmoji 2s infinite ease-in-out; }
        .animate-bounce-rank { animation: bounceRank 1.5s ease-in-out; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-1500 { animation-delay: 1.5s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-2500 { animation-delay: 2.5s; }
      `}</style>
    </div>
  );
}


// Main App Component
function App() {
  const [gameState, setGameState] = useState<GameState>({
    mode: null,
    lives: 3,
    maxLives: 3,
    score: 0,
    exp: 0,
    level: 1,
    startTime: 0,
    timeLimit: 60,
    timeBonus: 0,
    damageMultiplier: 10,
    currentQuestion: null,
    gameStatus: "menu",
    difficulty: 1,
    questionsAnswered: 0,
  });

  const [availableSkills, setAvailableSkills] = useState(getRandomSkills());
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  const initializeGame = useCallback((mode: "classic" | "time") => {
    const newState: GameState = {
      mode,
      lives: 3,
      maxLives: 3,
      score: 0,
      exp: 0,
      level: 1,
      startTime: Date.now(),
      timeLimit: 60,
      timeBonus: 0,
      damageMultiplier: 10,
      currentQuestion: generateQuestion(1),
      gameStatus: "playing",
      difficulty: 1,
      questionsAnswered: 0,
    };
    setGameState(newState);
    setFeedbackMessage("");
  }, []);

  const checkLevelUp = useCallback((currentState: GameState) => {
    const expForNextLevel = currentState.level * 100;
    if (currentState.exp >= expForNextLevel) {
      return {
        ...currentState,
        level: currentState.level + 1,
        exp: currentState.exp - expForNextLevel,
        gameStatus: "levelUp" as const,
      };
    }
    return currentState;
  }, []);

  const handleAnswerSelect = useCallback(
    (selectedAnswer: number) => {
      if (!gameState.currentQuestion || gameState.gameStatus !== "playing")
        return;

      const isCorrect = selectedAnswer === gameState.currentQuestion.answer;
      let newState = { ...gameState };

      if (isCorrect) {
        // Correct answer
        newState.score += 1;
        newState.exp += newState.damageMultiplier;
        newState.questionsAnswered += 1;

        // Increase difficulty every 5 questions
        if (newState.questionsAnswered % 5 === 0) {
          newState.difficulty += 1;
        }

        setFeedbackMessage("Correct! ✨");
      } else {
        // Wrong answer
        newState.lives -= 1;
        setFeedbackMessage("Wrong! Try harder! 💪");

        if (newState.lives <= 0) {
          newState.gameStatus = "gameOver";
          setGameState(newState);
          return;
        }
      }

      // Check for level up
      newState = checkLevelUp(newState);

      if (newState.gameStatus === "levelUp") {
        setAvailableSkills(getRandomSkills());
      } else {
        // Generate next question
        newState.currentQuestion = generateQuestion(newState.difficulty);
      }

      setGameState(newState);

      // Clear feedback after 1 second (handled by useEffect now, but good to keep if needed for immediate state update)
      // setTimeout(() => setFeedbackMessage(""), 1000);
    },
    [gameState, checkLevelUp]
  );

  const handleSkillSelect = useCallback(
    (skill: Skill) => {
      const newState = skill.effect(gameState);
      newState.gameStatus = "playing";
      newState.currentQuestion = generateQuestion(newState.difficulty);
      setGameState(newState);
    },
    [gameState]
  );

  const handleTimeUp = useCallback(() => {
    if (gameState.mode === "time") {
      setGameState((prev) => ({ ...prev, gameStatus: "gameOver" }));
    } else {
      // Classic mode - time up on question
      setGameState((prev) => ({
        ...prev,
        lives: prev.lives - 1,
        gameStatus: prev.lives <= 1 ? "gameOver" : "playing",
        currentQuestion:
          prev.lives > 1 ? generateQuestion(prev.difficulty) : null,
      }));
    }
  }, [gameState.mode]);

  const handleRestart = useCallback(() => {
    if (gameState.mode) {
      initializeGame(gameState.mode);
    }
  }, [gameState.mode, initializeGame]);

  const handleBackToMenu = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      mode: null,
      gameStatus: "menu",
    }));
  }, []);

  // Render feedback message
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(""), 1500);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  return (
    // Set global font to Inter and a fallback sans-serif
    <div style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* Google Fonts Import for Inter */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet" />

      {/* Global Tailwind CSS setup */}
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        /* Custom Tailwind Configuration (if needed, otherwise rely on default CDN) */
        /* You'd typically put this in tailwind.config.js */
        /* For this self-contained immersive, we define basic font-family here */
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      {gameState.gameStatus === "menu" && (
        <StartScreen onSelectMode={initializeGame} />
      )}

      {gameState.gameStatus === "playing" && (
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
          animation: fadeInUpToast 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
