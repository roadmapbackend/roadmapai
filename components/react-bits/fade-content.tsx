'use client';

import React, { useRef, useEffect, useState } from 'react';

interface FadeContentProps {
  children: React.ReactNode;
  blur?: boolean;
  duration?: number;
  easing?: string;
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  className?: string;
}

export function FadeContent({
  children,
  blur = true,
  duration = 800,
  easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  className = '',
}: FadeContentProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : initialOpacity,
        filter: blur ? (inView ? 'blur(0px)' : 'blur(10px)') : 'none',
        transform: inView ? 'translateY(0px)' : 'translateY(20px)',
        transition: `opacity ${duration}ms ${easing} ${delay}ms, filter ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default FadeContent;

