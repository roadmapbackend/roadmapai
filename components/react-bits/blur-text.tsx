'use client';

import React, { useEffect, useRef, useState } from 'react';

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
}

export function BlurText({
  text = '',
  delay = 50,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
}: BlurTextProps) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-x-1.5 ${className}`}>
      {elements.map((item, index) => {
        const translateY = inView ? '0px' : direction === 'top' ? '-14px' : '14px';
        const filter = inView ? 'blur(0px)' : 'blur(10px)';
        const opacity = inView ? 1 : 0;

        return (
          <span
            key={index}
            className="inline-block transition-all duration-700 ease-out"
            style={{
              transitionDelay: `${index * delay}ms`,
              transform: `translate3d(0, ${translateY}, 0)`,
              filter,
              opacity,
            }}
          >
            {item === ' ' ? '\u00A0' : item}
          </span>
        );
      })}
    </span>
  );
}

export default BlurText;

