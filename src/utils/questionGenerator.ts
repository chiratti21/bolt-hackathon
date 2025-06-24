import { Question } from '../types/game'; // นำเข้า Question type จาก src/types/game.ts

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