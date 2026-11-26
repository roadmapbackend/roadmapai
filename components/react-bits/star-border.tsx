'use client';

import React from 'react';

interface StarBorderProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  children?: React.ReactNode;
}

export function StarBorder({
  as: Component = 'div',
  className = '',
  color = '#f97316',
  speed = '4s',
  children,
  ...props
}: StarBorderProps) {
  return (
    <Component
      className={`relative inline-block py-[1px] px-[1px] overflow-hidden rounded-xl ${className}`}
      {...props}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className="relative z-10 bg-background/95 dark:bg-card/95 border border-white/10 text-foreground text-center rounded-[11px] backdrop-blur-md">
        {children}
      </div>

      <style jsx global>{`
        @keyframes star-movement-bottom {
          0% {
            transform: translate(0%, 0%);
            opacity: 1;
          }
          100% {
            transform: translate(-100%, 0%);
            opacity: 0;
          }
        }
        @keyframes star-movement-top {
          0% {
            transform: translate(0%, 0%);
            opacity: 1;
          }
          100% {
            transform: translate(100%, 0%);
            opacity: 0;
          }
        }
        .animate-star-movement-bottom {
          animation: star-movement-bottom linear infinite alternate;
        }
        .animate-star-movement-top {
          animation: star-movement-top linear infinite alternate;
        }
      `}</style>
    </Component>
  );
}

export default StarBorder;

