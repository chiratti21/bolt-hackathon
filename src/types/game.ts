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
  icon: string;
  effect: (state: GameState) => GameState;
}