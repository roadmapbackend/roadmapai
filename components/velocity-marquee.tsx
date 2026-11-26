'use client';

import React, { useRef, useEffect } from 'react';
import { useLenis } from '@/components/smooth-scroll';

interface VelocityMarqueeProps {
  baseSpeed?: number;
  direction?: 'left' | 'right';
  className?: string;
  items?: string[];
}

export function VelocityMarquee({
  baseSpeed = 1,
  direction = 'left',
  className = '',
  items = [
    'FIRST PRINCIPLES',
    'AUTONOMOUS SYNTHESIS',
    'DETERMINISTIC PEDAGOGY',
    '3-AGENT ARCHITECTURE',
    'HIGH CONVICTION',
    'ZERO HALLUCINATIONS',
    'MINUTE-BUDGETED DAGS',
  ],
}: VelocityMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const dirFactor = direction === 'left' ? -1 : 1;

  useLenis((lenis) => {
    // Smoothly absorb scroll velocity
    velocityRef.current = lenis.velocity || 0;
  });

  useEffect(() => {
    let animId: number;

    const loop = () => {
      // Natural dampening of scroll surge
      velocityRef.current *= 0.92;

      // Base translation + velocity boost
      const delta = (baseSpeed + Math.abs(velocityRef.current) * 1.8) * dirFactor;
      offsetRef.current += delta;

      if (containerRef.current) {
        // Wrap smoothly around half the total width of duplicated content
        const halfWidth = containerRef.current.scrollWidth / 2;
        if (halfWidth > 0) {
          if (offsetRef.current <= -halfWidth) {
            offsetRef.current += halfWidth;
          } else if (offsetRef.current >= 0 && dirFactor === 1) {
            offsetRef.current -= halfWidth;
          }
        }
        containerRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [baseSpeed, dirFactor]);

  // Repeat items for seamless infinite loop
  const repeatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className={`overflow-hidden whitespace-nowrap select-none py-4 relative ${className}`}>
      {/* Ambient Edge Feathering / Fade Masks */}
      <div className="pointer-events-none absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

      <div
        ref={containerRef}
        className="inline-flex items-center gap-8 will-change-transform font-black tracking-[-0.04em] uppercase text-2xl sm:text-4xl md:text-5xl"
      >
        {repeatedItems.map((item, idx) => {
          const isOutline = idx % 2 !== 0;
          return (
            <div key={idx} className="inline-flex items-center gap-8 shrink-0">
              <span
                className={`transition-colors duration-300 ${
                  isOutline
                    ? 'text-transparent [-webkit-text-stroke:1.2px_rgba(15,23,42,0.25)] dark:[-webkit-text-stroke:1.2px_rgba(255,255,255,0.2)] hover:[-webkit-text-stroke:1.2px_rgba(249,115,22,0.9)]'
                    : 'text-foreground/85 hover:text-orange-500'
                }`}
              >
                {item}
              </span>
              <span className="text-muted-foreground/30 font-light select-none text-xl sm:text-3xl shrink-0">/</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VelocityMarquee;

