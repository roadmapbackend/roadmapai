'use client';

import React, { useRef, useState, MouseEvent } from 'react';

interface DockItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  tooltip?: string;
}

export function DockItem({ children, onClick, className = '', tooltip }: DockItemProps) {
  const [scale, setScale] = useState(1);
  const itemRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative group flex items-center justify-center">
      {tooltip && (
        <span className="absolute -top-9 px-2 py-1 rounded bg-neutral-900 border border-white/10 text-white text-[11px] font-mono tracking-tight pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
          {tooltip}
        </span>
      )}
      <button
        ref={itemRef}
        onClick={onClick}
        onMouseEnter={() => setScale(1.35)}
        onMouseLeave={() => setScale(1)}
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        className={`p-2.5 rounded-xl bg-white/5 hover:bg-white/15 dark:bg-neutral-800/80 dark:hover:bg-neutral-700/90 text-foreground border border-white/10 transition-colors duration-150 flex items-center justify-center ${className}`}
      >
        {children}
      </button>
    </div>
  );
}

interface DockProps {
  children: React.ReactNode;
  className?: string;
}

export function Dock({ children, className = '' }: DockProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/80 dark:bg-neutral-950/80 backdrop-blur-xl border border-white/10 shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export default Dock;

