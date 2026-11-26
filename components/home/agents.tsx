import React from "react";
import { Reveal, Label } from "@/components/home/chapter";
import { BandFade, Topo } from "@/components/home/topo";

const AGENTS = [
  {
    number: "01",
    role: "The planner",
    line: "Splits your subject into days, in the order they make sense.",
    detail: "It starts from the ideas everything else rests on, and leaves out filler.",
    facts: ["1 to 90 days", "Builds on what came before"],
    color: "var(--saffron)",
  },
  {
    number: "02",
    role: "The timekeeper",
    line: "Fits each day's topics into the hours you said you have.",
    detail: "Every topic gets a share of the time: some reading, some practice, some tricky cases.",
    facts: ["Planned to the minute", "Changes with your hours"],
    color: "var(--emerald)",
  },
  {
    number: "03",
    role: "The teacher",
    line: "Writes each lesson, then asks you questions until it is sure you understood.",
    detail: "Lessons come with diagrams, practice and further reading, written for your level.",
    facts: ["Lessons for your level", "Questions, not quizzes"],
    color: "var(--cyan)",
  },
];

/** The three agents behind every path, on a dark band like the opening map */
export function Agents() {
  return (
    <>
    <BandFade to="dark" />
    <section
      id="agents"
      data-nav-dark
      className="relative scroll-mt-0 overflow-hidden bg-[#0d0b09] text-[#f6efe6]"
    >
      <Topo fadeTop fadeBottom className="opacity-25" />
      <div className="relative mx-auto w-full max-w-7xl px-6 py-24 sm:px-10 sm:py-32">
        <Reveal className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Label className="text-[#e9dfd2]/60 lg:col-span-3">( Behind every path )</Label>
          <h2 className="font-display text-4xl font-medium leading-[1.02] tracking-[-0.025em] text-balance sm:text-6xl lg:col-span-9">
            Three agents share the work, <span className="font-serif font-normal text-saffron">so you only do the learning.</span>
          </h2>
        </Reveal>

        <ol className="mt-16 grid grid-cols-1 border-t border-[#e9dfd2]/20 md:grid-cols-3 sm:mt-24">
          {AGENTS.map((a, i) => (
            <Reveal
              as="li"
              key={a.number}
              delay={i * 120}
              className="flex flex-col border-b border-[#e9dfd2]/20 py-10 md:border-b-0 md:border-l md:px-8 md:py-12 md:first:border-l-0 md:first:pl-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.18em] text-[#e9dfd2]/60">{a.number}</span>
                <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: a.color }} />
              </div>
              <h3 className="mt-10 font-serif text-4xl leading-none sm:text-5xl">{a.role}</h3>
              <p className="mt-6 text-lg leading-snug text-[#f6efe6]">{a.line}</p>
              <p className="mt-3 text-base leading-relaxed text-[#e9dfd2]/65">{a.detail}</p>
              <ul className="mt-auto space-y-2 pt-10">
                {a.facts.map((f) => (
                  <li
                    key={f}
                    className="border-t border-[#e9dfd2]/15 pt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#e9dfd2]/70"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
    <BandFade to="page" />
    </>
  );
}
