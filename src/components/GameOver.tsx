import React from 'react';
import { Trophy, RotateCcw, Home, Star, Zap } from 'lucide-react';
import { GameState } from '../types/game';

interface GameOverProps {
  gameState: GameState;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export default function GameOver({ gameState, onRestart, onBackToMenu }: GameOverProps) {
  const getRank = () => {
    if (gameState.score >= 50) return { rank: 'Master', color: 'text-yellow-400', icon: '👑' };
    if (gameState.score >= 30) return { rank: 'Expert', color: 'text-purple-400', icon: '💎' };
    if (gameState.score >= 20) return { rank: 'Advanced', color: 'text-blue-400', icon: '⭐' };
    if (gameState.score >= 10) return { rank: 'Skilled', color: 'text-green-400', icon: '🏅' };
    return { rank: 'Beginner', color: 'text-gray-400', icon: '📖' };
  };

  const rankInfo = getRank();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Game Over Title */}
        <div className="mb-8">
          <div className="text-8xl mb-4">💀</div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            Game Over
          </h1>
          <p className="text-xl text-red-200">
            The MATHrix has defeated you... this time!
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{gameState.score}</div>
              <div className="text-blue-200 text-sm">Final Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{gameState.level}</div>
              <div className="text-blue-200 text-sm">Level Reached</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{gameState.exp}</div>
              <div className="text-blue-200 text-sm">Total EXP</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{gameState.questionsAnswered}</div>
              <div className="text-blue-200 text-sm">Questions</div>
            </div>
          </div>

          {/* Rank */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">{rankInfo.icon}</span>
              <div>
                <div className={`text-2xl font-bold ${rankInfo.color}`}>
                  {rankInfo.rank}
                </div>
                <div className="text-blue-200 text-sm">Performance Rank</div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Messages */}
        <div className="mb-8">
          {gameState.level >= 10 && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-200">Achievement: Reached Level 10!</span>
              </div>
            </div>
          )}
          {gameState.score >= 25 && (
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <Star className="w-5 h-5 text-purple-400" />
                <span className="text-purple-200">Achievement: Master Calculator!</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={onRestart}
            className="w-full max-w-md mx-auto block bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-xl transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center space-x-3">
              <RotateCcw className="w-5 h-5" />
              <span>Try Again</span>
            </div>
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full max-w-md mx-auto block bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-3">
              <Home className="w-5 h-5" />
              <span>Back to Menu</span>
            </div>
          </button>
        </div>

        {/* Motivational Message */}
        <div className="mt-8 text-blue-300 text-sm">
          <p className="mb-2">
            💪 Don't give up! Math mastery comes with practice.
          </p>
          <p>
            🎯 Challenge yourself to beat your high score!
          </p>
        </div>
      </div>
    </div>
  );
}