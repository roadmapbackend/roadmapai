"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/*
 * The site's shared visual: one line down the page with stops on it.
 * Orange is the main path, cyan is a branch, green is something proven.
 */

type StopKind = "main" | "branch" | "done";

interface PathStopProps {
  id?: string;
  title?: React.ReactNode;
  kind?: StopKind;
  /** The path ends here */
  last?: boolean;
  /** Shown beside the text on wide screens */
  aside?: React.ReactNode;
  /** Shown below the text at full width */
  below?: React.ReactNode;
  children: React.ReactNode;
}

/** How far down the screen the line has been drawn */
const DRAW_AT = 0.62;

const NODE: Record<StopKind, string> = {
  main: "left-1 border-saffron data-[reached=true]:bg-saffron",
  branch: "left-[28px] border-cyan data-[reached=true]:bg-cyan",
  done: "left-1 border-emerald data-[reached=true]:bg-emerald",
};

const BRANCH_PATH = "M 0 0 C 0 12 24 6 24 20 V 80 C 24 94 0 88 0 100";

/** Draws the line as the stop scrolls by. Without it (no script, reduced motion) the line is simply complete. */
function useDrawOnScroll() {
  const stopRef = useRef<HTMLElement>(null);
  const trunkRef = useRef<HTMLSpanElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;

    const draw = () => {
      frame = 0;
      const rect = stopRef.current?.getBoundingClientRect();
      if (!rect) return;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const line = atEnd ? window.innerHeight : window.innerHeight * DRAW_AT;
      const progress = Math.max(0, Math.min(1, (line - rect.top) / rect.height));
      if (trunkRef.current) trunkRef.current.style.transform = `scaleY(${progress})`;
      if (branchRef.current) branchRef.current.style.clipPath = `inset(0 -8px ${(1 - progress) * 100}% -8px)`;
      if (nodeRef.current) nodeRef.current.dataset.reached = String(line >= rect.top + 16);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return { stopRef, trunkRef, branchRef, nodeRef };
}

export function PathStop({ id, title, kind = "main", last, aside, below, children }: PathStopProps) {
  const { stopRef, trunkRef, branchRef, nodeRef } = useDrawOnScroll();

  return (
    <section
      ref={stopRef}
      id={id}
      className={cn("relative scroll-mt-32 pl-14 sm:pl-20", last ? "pb-8" : aside || below ? "pb-24 sm:pb-36" : "pb-16 sm:pb-20")}
    >
      {!last && (
        <span aria-hidden="true" className="absolute -bottom-4 left-[11px] top-4 w-0.5 bg-foreground/15">
          <span ref={trunkRef} className="block h-full w-full origin-top bg-saffron" />
        </span>
      )}
      {kind === "branch" && (
        <div
          ref={branchRef}
          aria-hidden="true"
          className="absolute -bottom-4 left-[12px] -top-12 w-6"
        >
          <svg viewBox="0 0 24 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <path d={BRANCH_PATH} fill="none" stroke="var(--cyan)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )}
      <span
        ref={nodeRef}
        aria-hidden="true"
        data-reached="true"
        className={cn(
          "absolute top-2 size-4 rounded-full border-[3px] bg-background transition-colors duration-300",
          NODE[kind]
        )}
      />

      <div className={aside ? "grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16" : undefined}>
        <div>
          {title && (
            <h2 className="mb-4 text-2xl font-bold tracking-tight [word-spacing:0.12em] text-foreground text-balance sm:text-3xl">
              {title}
            </h2>
          )}
          <div className="max-w-[60ch] space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {children}
          </div>
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
      {below && <div className="mt-10">{below}</div>}
    </section>
  );
}
