'use client';

import React from 'react';

interface TiltedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxAngle?: number;
  scale?: number;
  perspective?: number;
  showGlare?: boolean;
  className?: string;
}

/**
 * Premium Static Card Container (Tilt and 3D movement completely disabled)
 */
export function TiltedCard({
  children,
  className = '',
  maxAngle: _maxAngle,
  scale: _scale,
  perspective: _perspective,
  showGlare: _showGlare,
  ...props
}: TiltedCardProps) {
  return (
    <div className={`w-full h-full ${className}`} {...props}>
      {children}
    </div>
  );
}

export default TiltedCard;
