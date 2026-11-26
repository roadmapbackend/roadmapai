"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Terminal, Check, Sparkles, ArrowUpRight } from "@/components/ui/icons";
import { StarBorder } from "@/components/react-bits";

interface ConsensysOffsetCtaProps {
  onOpenModal?: () => void;
  onSelectTrack?: (domain: string, days: number, hours: number) => void;
}

export function ConsensysOffsetCta({ onOpenModal, onSelectTrack }: ConsensysOffsetCtaProps) {
  const [copied, setCopied] = useState(false);

  const curlCommand = `curl -X POST https://your-domain.com/api/v1/trajectories \\
  -H "Authorization: Bearer rm_live_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "domain": "Distributed Systems & Raft Consensus",
    "days": 14,
    "daily_hours": 2.5,
    "pedagogical_rigor": "deterministic"
  }'`;

  const handleCopy = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 sm:py-32 max-w-[1340px] mx-auto px-6 sm:px-10 relative z-10">
      <div className="relative rounded-3xl bg-card dark:bg-[#07080a] border border-border dark:border-white/15 p-8 sm:p-14 lg:p-20 overflow-hidden shadow-2xl dark:shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
        {/* Specular hairline top accent */}
        <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-[#d4f934] to-transparent" />
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-lime-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-orange-500/10 blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Vision Headline & Action */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-700 dark:text-[#d4f934] text-[11px] font-mono uppercase tracking-[0.2em] font-semibold">
              ENGINEERED COGNITION
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.04em] text-foreground uppercase leading-[1.05] font-display">
              “Engineering Cognitive Velocity From Day 0.”
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground font-mono leading-relaxed max-w-xl">
              Consensys builds infrastructure that makes decentralized protocols deterministic.
              Daari deploys the exact same engineering discipline to your cognition. No fluff, no hand-waving,
              no guesswork—just mathematically verified curriculum execution.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <StarBorder as="div" color="#d4f934" speed="3.5s">
                <button
                  type="button"
                  onClick={onOpenModal}
                  className="h-13 px-8 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-display font-black text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_24px_rgba(212,249,52,0.4)] active:scale-95"
                >
                  <span>DEPLOY TRAJECTORY</span>
                  <ArrowRight className="size-4 stroke-[3]" />
                </button>
              </StarBorder>

              <a
                href="#agents"
                className="h-13 px-6 rounded-xl bg-muted dark:bg-white/5 hover:bg-muted/80 dark:hover:bg-white/10 text-foreground font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold transition-colors border border-border dark:border-white/10 flex items-center gap-2"
              >
                <span>EXPLORE ARCHITECTURE</span>
                <ArrowUpRight className="size-4" />
              </a>
            </div>

            {/* Invariant Guarantees */}
            <div className="pt-6 border-t border-border dark:border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono text-muted-foreground">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  LATENCY
                </span>
                <span className="text-foreground font-bold">&lt; 0.18ms</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  STORAGE
                </span>
                <span className="text-foreground font-bold">SUPABASE RLS</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  SCROLL
                </span>
                <span className="text-lime-700 dark:text-[#d4f934] font-bold">120HZ LENIS</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Tech Offset Terminal Snippet */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-2xl bg-background dark:bg-black/90 border border-border dark:border-white/15 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-red-500/80" />
                  <div className="size-2.5 rounded-full bg-yellow-500/80" />
                  <div className="size-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] font-mono text-muted-foreground ml-2">
                    bash — 80x24
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-muted dark:bg-white/10 hover:bg-muted/80 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors border border-border dark:border-white/10 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-500" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="size-3" />
                      <span>COPY CURL</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="font-mono text-xs text-muted-foreground leading-relaxed overflow-x-auto p-1">
                <code className="text-foreground/90">{curlCommand}</code>
              </pre>

              <div className="mt-4 pt-3 border-t border-border dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center">
                  RUNTIME ACTIVE
                </span>
                <span className="text-lime-700 dark:text-[#d4f934] font-semibold">HTTP/2 200 OK</span>
              </div>
            </div>

            {/* Quick Track Chips */}
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() =>
                  onSelectTrack?.("Distributed Systems & Raft Consensus", 14, 2.5)
                }
                className="px-3 py-1.5 rounded-lg bg-card dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground hover:text-foreground hover:border-lime-500/50 transition-colors"
              >
                + Distributed Consensus
              </button>
              <button
                type="button"
                onClick={() =>
                  onSelectTrack?.("Vulkan Graphics & Shaders", 21, 3.0)
                }
                className="px-3 py-1.5 rounded-lg bg-card dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground hover:text-foreground hover:border-orange-500/50 transition-colors"
              >
                + Vulkan Engine
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

