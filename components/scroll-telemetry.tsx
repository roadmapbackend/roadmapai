'use client';

import React, { useRef } from 'react';
import { useLenis } from '@/components/smooth-scroll';

export function ScrollTelemetry() {
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useLenis((lenis) => {
    // Lenis reports full progress when there is nothing to scroll
    const rawProgress = lenis.limit > 0 ? lenis.progress || 0 : 0;

    // 1. Hardware-accelerated GPU transform (Sub-pixel, 120Hz/60Hz buttery smooth)
    if (barRef.current) {
      barRef.current.style.transform = `scaleX(${rawProgress})`;
    }

    // 2. Trailing glowing laser tip
    if (glowRef.current) {
      glowRef.current.style.left = `${rawProgress * 100}%`;
      glowRef.current.style.opacity = rawProgress > 0.005 ? '1' : '0';
    }
  });

  return (
    <>
      {/* Top Hairline Telemetry Progress Bar with GPU ScaleX */}
      <div className="fixed top-0 inset-x-0 z-[100] h-[2.5px] bg-white/5 pointer-events-none overflow-hidden">
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-gradient-to-r from-orange-600 via-amber-400 to-orange-400 will-change-transform shadow-[0_0_12px_rgba(249,115,22,0.8)]"
          style={{ transform: 'scaleX(0)' }}
        />
        {/* Leading edge laser spark tip */}
        <div
          ref={glowRef}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-white shadow-[0_0_14px_4px_rgba(251,191,36,0.9),0_0_24px_8px_rgba(249,115,22,0.6)] pointer-events-none opacity-0 transition-opacity duration-150"
          style={{ left: '0%' }}
        />
      </div>
    </>
  );
}

export default ScrollTelemetry;
