"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "@/components/ui/icons";

export interface DropdownOption<T extends string | number = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface CustomDropdownProps<T extends string | number = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  accentColor?: "orange" | "lime" | "cyan";
  disabled?: boolean;
}

export function CustomDropdown<T extends string | number = string | number>({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  accentColor = "lime",
  disabled = false,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const accentStyles = {
    orange: {
      border: "focus:border-orange-500 focus:ring-orange-500/30",
      activeBg: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-l-2 border-orange-500",
      activeText: "text-orange-600 dark:text-orange-400",
      hover: "hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-orange-600 dark:hover:text-orange-300",
      pip: "bg-orange-500",
    },
    lime: {
      border: "focus:border-lime-500 dark:focus:border-[#d4f934] focus:ring-lime-500/30 dark:focus:ring-[#d4f934]/30",
      activeBg: "bg-lime-500/15 dark:bg-[#d4f934]/15 text-lime-700 dark:text-[#d4f934] border-l-2 border-lime-600 dark:border-[#d4f934]",
      activeText: "text-lime-700 dark:text-[#d4f934]",
      hover: "hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-lime-700 dark:hover:text-[#d4f934]",
      pip: "bg-lime-500 dark:bg-[#d4f934]",
    },
    cyan: {
      border: "focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/30 dark:focus:ring-cyan-400/30",
      activeBg: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-l-2 border-cyan-500",
      activeText: "text-cyan-700 dark:text-cyan-400",
      hover: "hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-cyan-700 dark:hover:text-cyan-300",
      pip: "bg-cyan-500 dark:bg-cyan-400",
    },
  }[accentColor];

  return (
    <div ref={containerRef} className={`relative inline-block text-left select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/60 border border-slate-200 dark:border-white/15 text-xs font-mono text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-white/30 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none ${
          isOpen ? `border-slate-400 dark:border-white/40 ring-1 ${accentStyles.border}` : ""
        } ${triggerClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              <span className={`size-1.5 rounded-full ${accentStyles.pip} shrink-0`} />
              <span className="font-medium">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-white/40">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={`size-3.5 text-slate-400 dark:text-white/50 group-hover:text-slate-700 dark:group-hover:text-white transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-slate-700 dark:text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 sm:right-auto sm:min-w-[210px] mt-1.5 py-1.5 rounded-xl bg-white/95 dark:bg-[#090b0e]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 shadow-[0_20px_45px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.85)] z-50 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden ${menuClassName}`}
        >
          {/* Specular Top Hairline Highlight */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300 dark:via-white/30 to-transparent" />

          <div className="max-h-60 overflow-y-auto py-0.5 space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left text-xs font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? `${accentStyles.activeBg} font-semibold`
                      : `text-slate-700 dark:text-white/70 ${accentStyles.hover}`
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2">
                      <span>{option.label}</span>
                      {option.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-slate-500 dark:text-white/50 uppercase tracking-widest">
                          {option.badge}
                        </span>
                      )}
                    </span>
                    {option.sublabel && (
                      <span className="text-[10px] text-slate-400 dark:text-white/40 mt-0.5">{option.sublabel}</span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className={`size-3.5 shrink-0 ${accentStyles.activeText}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
