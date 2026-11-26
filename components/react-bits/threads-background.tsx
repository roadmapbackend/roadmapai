'use client';

import React, { useEffect, useRef } from 'react';

interface ThreadsBackgroundProps {
  color?: string;
  amplitude?: number;
  distance?: number;
  enableMouseInteraction?: boolean;
  className?: string;
}

export function ThreadsBackground({
  color = 'rgba(249, 115, 22, 0.15)',
  amplitude = 25,
  distance = 0.5,
  enableMouseInteraction = true,
  className = '',
}: ThreadsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    window.addEventListener('resize', handleResize);
    if (enableMouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    let t = 0;
    const lineCount = 18;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.008;

      for (let i = 0; i < lineCount; i++) {
        const lineOffset = (i / lineCount) * height;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;

        for (let x = 0; x <= width; x += 15) {
          const wave1 = Math.sin(x * 0.003 + t + i * distance) * amplitude;
          const wave2 = Math.cos(x * 0.006 - t * 0.8 + i * 0.2) * (amplitude * 0.5);

          let y = lineOffset + wave1 + wave2;

          if (enableMouseInteraction) {
            const dx = x - mouseRef.current.x;
            const dy = y - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              const force = (180 - dist) / 180;
              y -= Math.sin(force * Math.PI) * 35;
            }
          }

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (enableMouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [color, amplitude, distance, enableMouseInteraction]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none w-full h-full ${className}`}
    />
  );
}

export default ThreadsBackground;

