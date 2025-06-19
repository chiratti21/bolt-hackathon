import React, { useState, useEffect } from 'react';
import { Heart, Clock, Star, Zap } from 'lucide-react';
import { GameState, Question } from '../types/game';
import { generateQuestion } from '../utils/questionGenerator';

interface GameScreenProps {
  gameState: GameState;
  onAnswerSelect: (answer: number) => void;
  onTimeUp: () => void;
}

export default function GameScreen({ gameState, onAnswerSelect, onTimeUp }: GameScreenProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [questionTime, setQuestionTime] = useState(10);

  useEffect(() => {
    if (gameState.mode === 'time') {
      const timer = setInterval(() => {
        const elapsed = (Date.now() - gameState.startTime) / 1000;
        const remaining = Math.max(0, gameState.timeLimit - elapsed);
        setTimeLeft(Math.floor(remaining));
        
        if (remaining <= 0) {
          onTimeUp();
        }
      }, 100);

      return () => clearInterval(timer);
    }
  }, [gameState.mode, gameState.startTime, gameState.timeLimit, onTimeUp]);

  useEffect(() => {
    // Question timer (gets faster with difficulty)
    const baseTime = 15;
    const timeReduction = Math.floor(gameState.difficulty / 2);
    const adjustedTime = Math.max(5, baseTime - timeReduction + gameState.timeBonus);
    setQuestionTime(adjustedTime);

    if (gameState.mode === 'classic') {
      const timer = setTimeout(() => {
        onTimeUp();
      }, adjustedTime * 1000);

      return () => clearTimeout(timer);
    }
  }, [gameState.currentQuestion, gameState.difficulty, gameState.timeBonus, gameState.mode, onTimeUp]);

  const getExpForNextLevel = () => gameState.level * 100;
  const expProgress = (gameState.exp / getExpForNextLevel()) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Lives */}
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-white font-bold">
                  {Array.from({ length: gameState.maxLives }, (_, i) => (
                    <span key={i} className={i < gameState.lives ? 'text-red-400' : 'text-gray-500'}>
                      ❤️
                    </span>
                  ))}
                </div>
                <div className="text-xs text-blue-200">Lives</div>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-white font-bold text-xl">
                  {gameState.mode === 'time' ? timeLeft : questionTime}s
                </div>
                <div className="text-xs text-blue-200">
                  {gameState.mode === 'time' ? 'Total' : 'Question'}
                </div>
              </div>
            </div>

            {/* Level */}
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-white font-bold text-xl">{gameState.level}</div>
                <div className="text-xs text-blue-200">Level</div>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold text-xl">{gameState.score}</div>
                <div className="text-xs text-blue-200">Score</div>
              </div>
            </div>
          </div>

          {/* EXP Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-blue-200 mb-1">
              <span>EXP</span>
              <span>{gameState.exp} / {getExpForNextLevel()}</span>
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${expProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        {gameState.currentQuestion && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-white/20 text-center">
            <div className="mb-8">
              <div className="text-sm text-blue-300 mb-2">
                Question {gameState.questionsAnswered + 1} • Difficulty {gameState.difficulty}
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                {gameState.currentQuestion.text}
              </h2>
            </div>

            {/* Answer Choices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {gameState.currentQuestion.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => onAnswerSelect(choice)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold text-2xl py-6 px-8 rounded-xl transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white/20"
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-200 text-sm">
              Difficulty increases every 5 questions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}