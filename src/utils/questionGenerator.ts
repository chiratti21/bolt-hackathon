import { Question } from '../types/game';

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
  } while (question.answer < 0 || question.answer > 9999);

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
      const smallA = Math.min(a, 12);
      const smallB = Math.min(b, 12);
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
      const result = a * b;
      answer = a;
      if (Math.random() < 0.5) {
        text = `${result} ÷ ___ = ${a}`;
        answer = b;
      } else {
        text = `${result} ÷ ${b} = ___`;
        answer = a;
      }
      break;
      
    default:
      text = `${a} + ${b} = ___`;
      answer = a + b;
  }

  // Generate wrong choices
  const choices = [answer];
  while (choices.length < 3) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const wrongAnswer = Math.max(0, answer + offset);
    if (!choices.includes(wrongAnswer)) {
      choices.push(wrongAnswer);
    }
  }
  
  // Shuffle choices
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { text, answer, choices, difficulty };
}