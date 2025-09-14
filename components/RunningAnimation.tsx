"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function RunningAnimation() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [position, setPosition] = useState(100); // Start from right side
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(1); // -1 for right to left, 1 for left to right

  // Animation frames: 1, 2, 3, 2, repeat
  const frameSequence = [0, 1, 2, 1]; // Indexes for images 1, 2, 3, 2
  const imageFiles = ["1.png", "2.png", "3.png"];

  useEffect(() => {
    // Frame animation (changes every 200ms for smooth running)
    const frameInterval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frameSequence.length);
    }, 200);

    // Position animation (moves every 16ms for smooth movement)
    const positionInterval = setInterval(() => {
      setPosition((prev) => {
        const newPosition = prev + direction * 2; // Move 2px per frame
        
        // Check if hit the right edge (start flipping to left)
        if (newPosition >= window.innerWidth - 50) {
          setDirection(-1);
          setIsFlipped(true); // Face left when moving left
          return window.innerWidth - 50;
        }
        
        // Check if hit the left edge (start flipping to right)
        if (newPosition <= 0) {
          setDirection(1);
          setIsFlipped(false); // Face right when moving right
          return 0;
        }
        
        return newPosition;
      });
    }, 16);

    return () => {
      clearInterval(frameInterval);
      clearInterval(positionInterval);
    };
  }, [direction]);

  return (
    <div 
      className="fixed left-0 right-0 pointer-events-none z-50"
      style={{ bottom: '65px' }} // Custom Y position - adjust this value
    >
      <div
        className="absolute transition-transform duration-75"
        style={{
          left: `${position}px`,
          transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
        }}
      >
        <Image
          src={`/components/refs/${imageFiles[frameSequence[currentFrame]]}`}
          alt="Running stick figure"
          width={100}
          height={100}
          className="drop-shadow-lg"
        />
      </div>
    </div>
  );
}
