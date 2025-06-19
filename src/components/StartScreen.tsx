import React from 'react';
import { Play, Clock, Heart, Zap, BookOpen } from 'lucide-react';

interface StartScreenProps {
  onSelectMode: (mode: 'classic' | 'time') => void;
}

export default function StartScreen({ onSelectMode }: StartScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center max-w-4xl mx-auto">
        {/* Game Title */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            The MATHrix
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 mb-2">
            Level up your math skills in this epic adventure!
          </p>
          <p className="text-lg text-blue-300 opacity-80">
            Choose your answers wisely, gain EXP, and unlock powerful skills
          </p>
        </div>

        {/* Game Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-blue-200">Learn & Practice</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-blue-200">Gain EXP</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <Heart className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-blue-200">Life System</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-blue-200">Time Challenge</p>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6">Choose Your Challenge</h2>
          
          <button
            onClick={() => onSelectMode('classic')}
            className="group w-full max-w-md mx-auto block bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-6 px-8 rounded-2xl transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white/20"
          >
            <div className="flex items-center justify-center space-x-3">
              <Heart className="w-6 h-6" />
              <div className="text-left">
                <div className="text-xl">Classic Mode</div>
                <div className="text-sm opacity-80">3 Lives Challenge</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectMode('time')}
            className="group w-full max-w-md mx-auto block bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-6 px-8 rounded-2xl transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white/20"
          >
            <div className="flex items-center justify-center space-x-3">
              <Clock className="w-6 h-6" />
              <div className="text-left">
                <div className="text-xl">Time Attack</div>
                <div className="text-sm opacity-80">60 Second Rush</div>
              </div>
            </div>
          </button>
        </div>

        {/* Game Info */}
        <div className="mt-12 text-blue-300 text-sm max-w-2xl mx-auto">
          <p className="mb-2">
            🎯 Answer questions correctly to gain EXP and level up
          </p>
          <p className="mb-2">
            ⚡ Choose powerful skills when you level up
          </p>
          <p>
            🏆 Challenge yourself with increasing difficulty
          </p>
        </div>
      </div>
    </div>
  );
}