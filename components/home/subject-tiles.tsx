"use client";

import React from "react";
import { startPath } from "@/components/create-roadmap-dialog";
import { ArrowRight } from "@/components/ui/icons";
import { Reveal } from "@/components/home/chapter";

// Earthy colours that read the same in light and dark mode
const SUBJECTS = [
  { subject: "Classical guitar", days: 14, hours: 1, bg: "#9a4a2a" },
  { subject: "Chess openings", days: 10, hours: 1, bg: "#2e3550" },
  { subject: "Kannada script", days: 21, hours: 0.5, bg: "#5b6436" },
  { subject: "Photosynthesis", days: 5, hours: 2, bg: "#2f5a55" },
  { subject: "Watercolour painting", days: 30, hours: 1, bg: "#a0742a" },
  { subject: "Public speaking", days: 7, hours: 1.5, bg: "#5e3047" },
];

const hoursText = (h: number) => (h < 1 ? `${h * 60} min` : `${h} h`);

/** Tiles that open the start dialog already filled in */
export function SubjectTiles() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {SUBJECTS.map((s, i) => (
        <Reveal as="li" key={s.subject} delay={(i % 3) * 90}>
          <button
            type="button"
            onClick={() => startPath({ subject: s.subject, days: s.days, hours: s.hours })}
            style={{ backgroundColor: s.bg }}
            className="group relative flex aspect-[4/5] w-full cursor-pointer flex-col overflow-hidden p-4 text-left text-[#f6efe6] transition-transform duration-500 ease-out hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-saffron sm:aspect-[5/6] sm:p-6"
          >
            <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#f6efe6]/75 sm:text-[11px]">
              <span>{s.days} days</span>
              <span>
                {hoursText(s.hours)}
                <span className="hidden xl:inline"> a day</span>
              </span>
            </span>

            {/* The days as stops on a line, filling in on hover */}
            <span aria-hidden="true" className="relative mt-auto block h-3">
              <span className="absolute inset-x-0 top-1/2 h-px bg-[#f6efe6]/35" />
              <span className="absolute left-0 top-1/2 h-px w-0 bg-[#f6efe6] transition-[width] duration-700 ease-out group-hover:w-full" />
              <span className="absolute inset-0 flex items-center justify-between">
                {Array.from({ length: Math.min(s.days, 10) }).map((_, d) => (
                  <span key={d} className="size-1.5 rounded-full bg-[#f6efe6]/80 sm:size-2" />
                ))}
              </span>
            </span>

            <span className="mt-5 block font-serif text-[1.05rem] leading-[1.05] sm:mt-8 sm:text-[clamp(1.2rem,1.55vw,1.7rem)]">{s.subject}</span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f6efe6]/80 transition-colors group-hover:text-[#f6efe6]">
              Start this path
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </Reveal>
      ))}
    </ul>
  );
}
