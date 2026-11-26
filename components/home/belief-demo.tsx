"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

// Taken from a Socratic AI session on photosynthesis, shortened
const STEPS = [
  {
    tab: "First answer",
    belief: "The oxygen plants release comes from splitting carbon dioxide.",
    holds: false,
    reply:
      "If oxygen came from splitting carbon dioxide, a plant given water with heavy oxygen would still release normal oxygen. Experiments show the released oxygen is heavy. How do you reconcile this with your claim?",
  },
  {
    tab: "After thinking again",
    belief: "The oxygen comes from water. Light drives electrons out of chlorophyll, and splitting water replaces them.",
    holds: true,
    reply:
      "That held up. Now predict: a toxin stops electrons right after photosystem II, and the light stays on. What happens?",
  },
];

/** One belief, tested until it breaks or holds */
export function BeliefDemo() {
  const [step, setStep] = useState(0);
  const { belief, holds, reply } = STEPS[step];

  return (
    <figure>
      <div role="group" aria-label="Session steps" className="mb-6 flex gap-6 border-b border-border text-sm">
        {STEPS.map((s, i) => (
          <button
            key={s.tab}
            type="button"
            aria-pressed={i === step}
            onClick={() => setStep(i)}
            className={cn(
              "-mb-px border-b-2 pb-2.5 transition-colors cursor-pointer",
              i === step ? "border-foreground font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {s.tab}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="min-h-64">
        <p className="text-sm text-muted-foreground">What you believe</p>
        <p
          className={cn(
            "mt-1.5 text-lg leading-snug text-foreground sm:text-xl",
            !holds && "line-through decoration-rose decoration-2"
          )}
        >
          {belief}
        </p>
        <p
          className={cn(
            "mt-2 text-sm font-medium",
            holds ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
          )}
        >
          {holds ? "Survived a test" : "Contradicted"}
        </p>

        <p className="mt-6 text-sm text-muted-foreground">Socratic AI</p>
        <p className="mt-1.5 max-w-[56ch] text-base leading-relaxed text-foreground">{reply}</p>
      </div>

      <figcaption className="mt-4 text-sm text-muted-foreground">
        From a session on photosynthesis, shortened.
      </figcaption>
    </figure>
  );
}
