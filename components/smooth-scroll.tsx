'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import type { LenisRef } from 'lenis/react';
import { useRef } from 'react';

export { useLenis };

interface SmoothScrollProps {
  children: React.ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<LenisRef>(null);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        lerp: 0.085,
        duration: 1.3,
        smoothWheel: true,
        wheelMultiplier: 1.05,
        touchMultiplier: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      }}
    >
      {children}
    </ReactLenis>
  );
}

export default SmoothScroll;
