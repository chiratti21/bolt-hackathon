import { Skill, GameState } from '../types/game';

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