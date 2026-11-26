"use client";

import React, { useState } from "react";
import { ArrowRight, Check, Terminal, Sparkles, ArrowUpRight } from "@/components/ui/icons";

interface StickyProductStackProps {
  onSelectTrack?: (domain: string, days: number, hours: number) => void;
  onOpenModal?: () => void;
}

export function StickyProductStack({ onSelectTrack, onOpenModal }: StickyProductStackProps) {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      phase: "01",
      title: "CHRONOLOGICAL DOMAIN DECOMPOSITION",
      agentName: "Agent 01: Domain Decomposition Architect",
      accent: "stone",
      accentColor: "#f4f4f0",
      image: "/images/agent-architect.jpg",
      tagline: "Sub-millisecond first-principles decomposition",
      description:
        "Raw syllabus text and field parameters are stripped of marketing jargon and superficial textbook filler. The architect extracts immutable core invariants, prerequisites, and builds the foundational knowledge graph.",
      telemetry: [
        { label: "DECOMPOSITION SPEED", val: "< 0.12s" },
        { label: "FILLER ELIMINATION", val: "100%" },
        { label: "PREREQUISITE FIDELITY", val: "STRICT" },
      ],
      sampleDomain: "Distributed Systems & Raft Consensus",
      days: 14,
      hours: 2.5,
      codeSnippet: `// 01_INVARIANT_EXTRACTOR.rs
pub struct DomainInvariant {
    pub primitives: Vec<FirstPrinciple>,
    pub dependency_graph: DirectedAcyclicGraph,
    pub prerequisite_depth: u8,
}
// Zero speculative filler. Strict DAG compilation.`,
    },
    {
      id: 2,
      phase: "02",
      title: "MINUTE-BUDGETED DAG TOPOLOGY",
      agentName: "Agent 02: Structure & Schedule Engine",
      accent: "amber",
      accentColor: "#f97316",
      image: "/images/agent-structure.jpg",
      tagline: "Deterministic chronological schedule with zero drift",
      description:
        "Transforms the knowledge graph into daily pedagogical sprints. Every single hour is segmented into deterministic minute budgets: 30m foundational derivation, 50m hands-on implementation, and 40m adversarial edge-case stress drills.",
      telemetry: [
        { label: "MINUTE ALLOCATION", val: "DETERMINISTIC" },
        { label: "SCHEDULE VARIANCE", val: "0.00%" },
        { label: "DAG TOPOLOGY", val: "VERIFIED" },
      ],
      sampleDomain: "Vulkan Graphics Pipelines & Compute Shaders",
      days: 21,
      hours: 3.0,
      codeSnippet: `// 02_TOPOLOGICAL_SYNTHESIS.ts
const sprintBudget: DailySprintBudget = {
  foundations: 30, // Derivation & Math
  implementation: 50, // Code & Proof
  adversarialDrill: 40, // Edge-case verification
  status: "CALIBRATED_120HZ"
};`,
    },
    {
      id: 3,
      phase: "03",
      title: "SOCRATIC DIAGNOSTIC VERIFICATION",
      agentName: "Agent 03: Socratic Verifier & Drillmaster",
      accent: "titanium",
      accentColor: "#94a3b8",
      image: "/images/agent-teacher.jpg",
      tagline: "Adversarial counter-example interrogations",
      description:
        "Superficial multiple-choice quizzes are prohibited. Agent 03 tests comprehension through adversarial edge cases, asking learners to detect race conditions, explain invariant breakdowns, and defend architectural trade-offs.",
      telemetry: [
        { label: "EVALUATION RIGOR", val: "SOCRATIC" },
        { label: "GUESS PREVENTION", val: "100%" },
        { label: "PROOF THRESHOLD", val: "ABSOLUTE" },
      ],
      sampleDomain: "Quantum State Tomography & Hilbert Spaces",
      days: 21,
      hours: 3.0,
      codeSnippet: `// 03_SOCRATIC_INTERROGATION.md
Q: "If network partition isolates Leader node L1,
explain how term increments prevent split-brain?"
> VERIFYING FIRST-PRINCIPLES COHERENCE...
[COMPREHENSION CONFIRMED: ADVANCE TO NEXT NODE]`,
    },
  ];

  return (
    <section className="py-24 sm:py-32 max-w-[1340px] mx-auto px-6 sm:px-10 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Sticky Left Column (Consensys-inspired) */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-8">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground text-[11px] font-mono uppercase tracking-[0.2em] font-semibold mb-4">
              MULTI-AGENT PROTOCOL
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.03em] text-foreground uppercase leading-[1.05] font-display">
              The Multi-Agent Syndicate Protocol
            </h2>

            <p className="mt-4 text-sm sm:text-base text-muted-foreground font-body leading-relaxed font-normal">
              Complex domains require immutable structural guarantees. Daari deploys autonomous multi-agent pipelines that execute sequentially to eliminate speculative filler and guarantee verifiable, first-principles mastery.
            </p>
          </div>

          {/* Stepper Navigation Pills */}
          <div className="space-y-3 pt-2">
            {steps.map((step) => {
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                    isActive
                      ? "bg-card dark:bg-white/[0.05] border-foreground/30 shadow-md translate-x-1"
                      : "bg-transparent border-border dark:border-white/10 hover:border-foreground/20 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        isActive
                          ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                          : "bg-muted dark:bg-white/10 text-muted-foreground"
                      }`}
                    >
                      {step.phase}
                    </span>
                    <span className="text-xs font-bold font-display uppercase text-foreground tracking-wide">
                      {step.title.split("&")[0]}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {isActive ? "ACTIVE STAGE" : "STANDBY"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Action Box */}
          <div className="pt-4 border-t border-border dark:border-white/10">
            <button
              onClick={onOpenModal}
              className="w-full py-3.5 px-5 rounded-xl bg-foreground text-background hover:opacity-90 font-sans font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between shadow-lg cursor-pointer group"
            >
              <span>CONFIGURE SYNDICATE PARAMETERS</span>
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>LATENCY: &lt; 0.18ms</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold">READY TO DEPLOY</span>
            </div>
          </div>
        </div>

        {/* Dynamic Stacking Right Column */}
        <div className="lg:col-span-7 space-y-8 sm:space-y-12">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`p-6 sm:p-8 rounded-2xl bg-card dark:bg-[#07080a]/90 border border-border dark:border-white/15 backdrop-blur-xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all duration-300 ${
                activeStep === step.id ? "ring-1 ring-foreground/20" : ""
              }`}
            >
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 dark:via-white/15 to-transparent" />

              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black px-2.5 py-1 rounded bg-muted dark:bg-white/10 text-foreground">
                    PHASE {step.phase}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    {step.agentName}
                  </span>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground uppercase">
                  DETERMINISTIC NODE
                </span>
              </div>

              {/* Main Title & Tagline */}
              <h3 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight font-display mt-2">
                {step.title}
              </h3>
              <p className="text-xs font-mono text-muted-foreground mt-1 font-semibold uppercase tracking-wider">
                {step.tagline}
              </p>

              {/* Description Body */}
              <p className="mt-4 text-xs sm:text-sm text-muted-foreground font-body leading-relaxed">
                {step.description}
              </p>

              {/* Tactile Visual Artifact Showcase */}
              <div className="mt-6 relative w-full h-52 sm:h-64 rounded-xl overflow-hidden border border-border dark:border-white/10 group/img bg-black/60 shadow-inner">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-white/90">
                  <span className="px-2.5 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/20 uppercase tracking-widest text-[10px] text-white">
                    ARTIFACT: PHASE {step.phase}
                  </span>
                </div>
              </div>

              {/* Telemetry Metric Badges */}
              <div className="mt-6 grid grid-cols-3 gap-2 pt-4 border-t border-border dark:border-white/10">
                {step.telemetry.map((t, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-muted/50 dark:bg-white/[0.02] border border-border dark:border-white/5 text-center">
                    <span className="text-[9px] font-mono text-muted-foreground block uppercase tracking-wider">
                      {t.label}
                    </span>
                    <span className="text-xs sm:text-sm font-black font-mono text-foreground mt-0.5 block">
                      {t.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Deploy Button */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  SAMPLE DOMAIN: <strong className="text-foreground">{step.sampleDomain}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTrack) {
                      onSelectTrack(step.sampleDomain, step.days, step.hours);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 dark:bg-white/10 dark:hover:bg-white/15 text-foreground font-mono text-xs font-bold uppercase tracking-wider transition-colors border border-border dark:border-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <span>ARM TRAJECTORY</span>
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

