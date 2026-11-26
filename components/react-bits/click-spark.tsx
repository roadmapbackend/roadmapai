'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  extraScale?: number;
  children?: React.ReactNode;
  className?: string;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

export function ClickSpark({
  sparkColor = '#f97316',
  sparkSize = 10,
  sparkRadius = 25,
  sparkCount = 8,
  duration = 450,
  extraScale = 1.0,
  children,
  className = '',
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const isAnimatingRef = useRef<boolean>(false);

  const startAnimationLoop = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (now: number) => {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (sparksRef.current.length === 0) {
        isAnimatingRef.current = false;
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = now - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const distance = easeOut * sparkRadius;
        const currentX = spark.x + Math.cos(spark.angle) * distance;
        const currentY = spark.y + Math.sin(spark.angle) * distance;

        const lineLength = sparkSize * (1 - progress) * extraScale;
        const opacity = 1 - progress;

        ctx.save();
        ctx.strokeStyle = sparkColor;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
        ctx.lineTo(
          currentX + Math.cos(spark.angle) * lineLength,
          currentY + Math.sin(spark.angle) * lineLength
        );
        ctx.stroke();
        ctx.restore();

        return true;
      });

      ctx.restore();

      if (sparksRef.current.length > 0) {
        requestAnimationFrame(draw);
      } else {
        isAnimatingRef.current = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    requestAnimationFrame(draw);
  }, [duration, extraScale, sparkColor, sparkRadius, sparkSize]);

  const createSparks = useCallback(
    (clientX: number, clientY: number) => {
      const now = performance.now();
      const newSparks: Spark[] = [];

      for (let i = 0; i < sparkCount; i++) {
        const angle = (2 * Math.PI * i) / sparkCount;
        newSparks.push({ x: clientX, y: clientY, angle, startTime: now });
      }

      sparksRef.current.push(...newSparks);
      startAnimationLoop();
    },
    [sparkCount, startAnimationLoop]
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // clientX and clientY are always the exact viewport coordinates under the user's cursor
    createSparks(e.clientX, e.clientY);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      onClick={handleClick}
      className={`relative w-full ${className}`}
    >
      {/* Fixed viewport canvas ensures sparks always burst precisely under the cursor, regardless of scroll position */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999] w-screen h-screen"
      />
      {children}
    </div>
  );
}

export default ClickSpark;
