"use client";

import React, { useRef, useState } from "react";

interface AntigravityCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: string;
  onClick?: () => void;
}

export default function AntigravityCard({
  children,
  className = "",
  intensity = 15,
  glowColor = "rgba(99, 102, 241, 0.15)",
  onClick,
}: AntigravityCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -intensity;
    const rotY = ((x - centerX) / centerX) * intensity;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlowPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`perspective-1000 transition-all duration-300 ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${
          isHovered ? "translateZ(8px)" : "translateZ(0px)"
        }`,
        transition: isHovered
          ? "transform 0.1s ease-out, box-shadow 0.2s ease-out"
          : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease-out",
        willChange: "transform",
      }}
    >
      <div className="relative overflow-hidden h-full rounded-2xl">
        {/* Ambient Mouse Glow Overlay */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor} 0%, transparent 60%)`,
          }}
        />
        {children}
      </div>
    </div>
  );
}
