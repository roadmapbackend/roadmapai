"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Fades its children up the first time they scroll into view */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "p";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("home-reveal", shown && "is-shown", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/** Small editorial label: "( 01 )  Say where" */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

/**
 * One numbered step of how Daari works. A hairline on top, the number and title on the
 * left, and the working piece on the right.
 */
export function Chapter({
  id,
  number,
  label,
  title,
  children,
  aside,
  wide,
}: {
  id?: string;
  number: string;
  label: string;
  title: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
  /** Put the working piece under the text, across the full width */
  wide?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-foreground/15 py-14 sm:py-20">
      <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <div className="flex items-baseline gap-4">
            <span className="font-serif text-5xl leading-none text-saffron sm:text-6xl">{number}</span>
            <Label>{label}</Label>
          </div>
          <h3 className="mt-8 font-display text-3xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground text-balance sm:text-[2.75rem]">
            {title}
          </h3>
          <div className="mt-5 max-w-md space-y-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {children}
          </div>
        </Reveal>
        {aside && (
          <Reveal delay={120} className={cn(wide ? "lg:col-span-12" : "lg:col-span-6 lg:col-start-7")}>
            {aside}
          </Reveal>
        )}
      </div>
    </section>
  );
}
