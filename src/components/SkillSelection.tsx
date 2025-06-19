import React from 'react';
import { X } from 'lucide-react';
import { Skill } from '../types/game';

interface SkillSelectionProps {
  skills: Skill[];
  onSelectSkill: (skill: Skill) => void;
  onClose: () => void;
}

export default function SkillSelection({ skills, onSelectSkill, onClose }: SkillSelectionProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-8 max-w-2xl w-full border-2 border-white/20 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">🎉 Level Up!</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-blue-200 text-center mb-8">
          Choose a skill to enhance your abilities:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => onSelectSkill(skill)}
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-4xl mb-3">{skill.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{skill.name}</h3>
              <p className="text-blue-200 text-sm">{skill.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-blue-300 text-sm">
            💡 Tip: Each skill stacks with previous selections!
          </p>
        </div>
      </div>
    </div>
  );
}