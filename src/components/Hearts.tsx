import React from "react";
import { Heart } from "lucide-react";

interface DynamicHeartsProps {
  currentLives: number;
  maxLives: number;
  className?: string;
}

export default function Hearts({
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
            className={`relative transition-all duration-300 transform ${
              isActive
            }`}
            style={{
              animationDelay: `${heartIndex * 100}ms`,
              animationDuration: isActive ? "2s" : "0s",
            }}
          >

            {/* Heart icon */}
            <Heart
              className={`relative w-6 h-6 transition-all duration-300 ${
                isActive
                  ? "text-red-400 fill-red-400 drop-shadow-lg"
                  : "text-gray-500 fill-gray-500"
              }`}
            />
          </div>
        );
      })}

      {/* Health status indicator */}
      <div className="ml-2 flex flex-col">
        <span className="text-white font-bold text-sm">
          {currentLives}/{maxLives}
        </span>
        <div
          className={`text-xs font-medium ${
            currentLives > maxLives * 0.6
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
