"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  /** "inline" sits inside a sentence, "field" fills a form row */
  variant?: "inline" | "field";
}

/** A number with minus and plus buttons. Typing and the arrow keys work too. */
export function NumberStepper({ value, onChange, min, max, step = 1, label, variant = "field" }: NumberStepperProps) {
  // What is being typed; null when the field just shows the value
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n / step) * step));
  const move = (direction: 1 | -1) => {
    setDraft(null);
    onChange(clamp(value + direction * step));
  };
  const inline = variant === "inline";

  const button = (direction: 1 | -1) => (
    <button
      type="button"
      // Arrow keys do the same from the field, so these stay out of the tab order
      tabIndex={-1}
      aria-label={`${direction === 1 ? "More" : "Fewer"}: ${label}`}
      disabled={direction === 1 ? value >= max : value <= min}
      onClick={() => move(direction)}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full text-foreground transition-colors cursor-pointer disabled:cursor-default disabled:opacity-30",
        "after:absolute after:-inset-1.5",
        inline
          ? "size-7 border border-foreground/20 enabled:hover:border-saffron enabled:hover:bg-saffron enabled:hover:text-black"
          : "size-8 enabled:hover:bg-foreground/10"
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M3 8h10" />
        {direction === 1 && <path d="M8 3v10" />}
      </svg>
    </button>
  );

  return (
    <span
      className={cn(
        "items-center",
        inline
          ? "inline-flex gap-1.5 whitespace-nowrap align-baseline"
          : "flex h-10 w-full justify-between rounded-xl border border-border bg-background px-1 transition focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground"
      )}
    >
      {button(-1)}
      <input
        type="text"
        inputMode={step < 1 ? "decimal" : "numeric"}
        role="spinbutton"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        value={draft ?? String(value)}
        onFocus={(e) => e.currentTarget.select()}
        // A mouse click drops the selection made on focus, so make it again
        onClick={(e) => draft === null && e.currentTarget.select()}
        onChange={(e) => {
          const text = e.target.value.replace(",", ".").replace(/[^\d.]/g, "").slice(0, 4);
          setDraft(text);
          const n = parseFloat(text);
          if (n >= min && n <= max) onChange(clamp(n));
        }}
        onBlur={() => {
          const n = parseFloat(draft ?? "");
          if (Number.isFinite(n)) onChange(clamp(n));
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          move(e.key === "ArrowUp" ? 1 : -1);
        }}
        className={cn(
          "min-w-0 border-0 bg-transparent p-0 text-center tabular-nums text-foreground outline-none",
          inline
            ? "w-[2.1em] border-b-2 leading-tight border-saffron/50 transition-colors focus:border-saffron"
            : "flex-1 text-sm"
        )}
      />
      {button(1)}
    </span>
  );
}
