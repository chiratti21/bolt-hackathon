import React, { useState, useCallback, useEffect } from "react";
import StartScreen from "./components/StartScreen";
import GameScreen from "./components/GameScreen";
import SkillSelection from "./components/SkillSelection";
import GameOver from "./components/GameOver";
import { GameState, Question } from "./types/game";
import { generateQuestion } from "./utils/questionGenerator";
import { getRandomSkills, SKILLS } from "./utils/skills";

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
        console.log("have " + gameState.lives + " lives left");

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

      // Clear feedback after 1 second
      setTimeout(() => setFeedbackMessage(""), 1000);
    },
    [gameState, checkLevelUp]
  );

  const handleSkillSelect = useCallback(
    (skill: any) => {
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
    <>
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
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full border border-white/30 shadow-lg animate-bounce">
            {feedbackMessage}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
