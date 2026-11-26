'use client';

import React, { useEffect, useRef, useState } from 'react';

interface TrueFocusProps {
  sentence?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

export function TrueFocus({
  sentence = 'Deterministic Multi-Agent Autonomous Syndicate',
  manualMode = false,
  blurAmount = 4,
  borderColor = '#f97316',
  glowColor = 'rgba(249, 115, 22, 0.4)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1.2,
  className = '',
}: TrueFocusProps) {
  const words = sentence.split(' ');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (manualMode) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, (animationDuration + pauseBetweenAnimations) * 1000);

    return () => clearInterval(interval);
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const targetEl = wordRefs.current[currentIndex];
    const containerEl = containerRef.current;

    const targetRect = targetEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    setFocusRect({
      x: targetRect.left - containerRect.left,
      y: targetRect.top - containerRect.top,
      width: targetRect.width,
      height: targetRect.height,
    });
  }, [currentIndex, sentence]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex flex-wrap items-center gap-x-2 gap-y-1 select-none ${className}`}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            onMouseEnter={() => {
              if (manualMode) setCurrentIndex(index);
            }}
            className="cursor-pointer relative z-10 transition-all duration-300 font-bold"
            style={{
              filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.4,
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {word}
          </span>
        );
      })}

      {/* Focus Box */}
      <div
        className="absolute pointer-events-none rounded-md transition-all ease-out"
        style={{
          left: `${focusRect.x - 4}px`,
          top: `${focusRect.y - 2}px`,
          width: `${focusRect.width + 8}px`,
          height: `${focusRect.height + 4}px`,
          border: `1.5px solid ${borderColor}`,
          boxShadow: `0 0 16px ${glowColor}`,
          transitionDuration: `${animationDuration}s`,
        }}
      >
        <span
          className="absolute -top-1 -left-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: borderColor }}
        />
        <span
          className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: borderColor }}
        />
      </div>
    </div>
  );
}

export default TrueFocus;

