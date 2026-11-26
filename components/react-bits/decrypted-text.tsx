'use client';

import React, { useEffect, useState, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover';
  as?: React.ElementType;
}

export function DecryptedText({
  text,
  speed = 45,
  maxIterations = 10,
  sequential = true,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+~|}{[]:;?><',
  className = '',
  parentClassName = '',
  encryptedClassName = 'text-primary/70 dark:text-orange-400/80 font-mono',
  animateOn = 'hover',
  as: Component = 'span',
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    if (animateOn === 'view' && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isScrambling) {
              startAnimation();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, [animateOn]);

  const startAnimation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsScrambling(true);
    let iteration = 0;
    const len = text.length;
    const revealed = new Set<number>();

    intervalRef.current = setInterval(() => {
      if (sequential) {
        if (revealed.size < len) {
          const nextIndex =
            revealDirection === 'start'
              ? revealed.size
              : revealDirection === 'end'
              ? len - 1 - revealed.size
              : Math.floor(len / 2) + (revealed.size % 2 === 0 ? 1 : -1) * Math.ceil(revealed.size / 2);

          revealed.add(nextIndex);
          setRevealedIndices(new Set(revealed));
        } else {
          clearInterval(intervalRef.current!);
          setIsScrambling(false);
          setDisplayText(text);
          return;
        }
      } else {
        iteration++;
        if (iteration >= maxIterations) {
          clearInterval(intervalRef.current!);
          setIsScrambling(false);
          setDisplayText(text);
          return;
        }
      }

      const availableChars = useOriginalCharsOnly
        ? Array.from(new Set(text.split(''))).filter((c) => c !== ' ')
        : characters.split('');

      const scrambled = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (revealed.has(index)) return text[index];
          return availableChars[Math.floor(Math.random() * availableChars.length)] || char;
        })
        .join('');

      setDisplayText(scrambled);
    }, speed);
  };

  const handleMouseEnter = () => {
    if (animateOn === 'hover') {
      setIsHovering(true);
      startAnimation();
    }
  };

  const handleMouseLeave = () => {
    if (animateOn === 'hover') {
      setIsHovering(false);
    }
  };

  return (
    <Component
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-block ${parentClassName}`}
    >
      <span className={className}>
        {displayText.split('').map((char, index) => {
          const isDecrypted = !isScrambling || revealedIndices.has(index) || char === ' ';
          return (
            <span
              key={index}
              className={isDecrypted ? className : encryptedClassName}
            >
              {char}
            </span>
          );
        })}
      </span>
    </Component>
  );
}

export default DecryptedText;

