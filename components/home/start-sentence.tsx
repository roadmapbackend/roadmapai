"use client";

import React, { useState } from "react";
import { startPath } from "@/components/create-roadmap-dialog";
import { NumberStepper } from "@/components/ui/number-stepper";
import { ArrowRight } from "@/components/ui/icons";

const FIELD =
  "leading-tight border-0 border-b-2 border-saffron/50 bg-transparent px-1 text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-saffron";

/** "I want to learn ___ in __ days" */
export function StartSentence() {
  const [subject, setSubject] = useState("");
  const [days, setDays] = useState(14);
  const [hours, setHours] = useState(2);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startPath({ subject: subject.trim(), days, hours });
      }}
      className="text-2xl font-medium leading-[1.9] text-foreground sm:text-3xl sm:leading-[1.9]"
    >
      <p className="text-balance">
        I want to learn{" "}
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="classical guitar"
          aria-label="Subject"
          required
          className={`${FIELD} w-full sm:w-[12em]`}
        />{" "}
        in <NumberStepper variant="inline" label="Number of days" value={days} onChange={setDays} min={1} max={90} /> days,
        with{" "}
        <NumberStepper variant="inline" label="Hours a day" value={hours} onChange={setHours} min={0.5} max={12} step={0.5} />{" "}
        hours a day.
      </p>
      <button
        type="submit"
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-orange-500 px-7 text-base font-semibold text-black transition-colors hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 cursor-pointer"
      >
        Start
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
