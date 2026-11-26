'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = '',
}: ShinyTextProps) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block relative overflow-hidden ${
        disabled
          ? ''
          : 'bg-clip-text text-transparent bg-gradient-to-r from-neutral-300 via-white to-neutral-300 dark:from-neutral-400 dark:via-white dark:to-neutral-400'
      } ${className}`}
      style={{
        backgroundImage: disabled
          ? 'none'
          : 'linear-gradient(120deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.9) 50%, rgba(255, 255, 255, 0) 70%)',
        backgroundSize: '200% 100%',
        animation: disabled ? 'none' : `shiny-sweep ${animationDuration} infinite linear`,
      }}
    >
      <style jsx>{`
        @keyframes shiny-sweep {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
      <span className="relative z-10">{text}</span>
    </span>
  );
}

export default ShinyText;

