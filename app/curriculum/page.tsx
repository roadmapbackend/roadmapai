"use client";

import React, { useState } from "react";
import Link from "next/link";
import AntigravityCard from "@/components/AntigravityCard";

export default function CurriculumTreePage() {
  const [activeMode, setActiveMode] = useState<"sequential" | "nonlinear">("nonlinear");

  const roadmap = {
    title: "14-Day Intensive: Distributed Systems & Consensus Engines",
    domain: "Distributed Systems",
    totalDays: 14,
    dailyHours: 2.5,
    progress: 35,
    days: [
      {
        dayNumber: 1,
        title: "Distributed State & Failure Domains",
        desc: "Foundational network boundaries, crash-stop vs Byzantine faults, and CAP trade-offs.",
        status: "completed",
        topics: [
          { number: 1, title: "Network Partitions & Asynchrony", minutes: 50, status: "completed" },
          { number: 2, title: "Logical Clocks (Lamport & Vector)", minutes: 45, status: "completed" },
          { number: 3, title: "State Machine Replication", minutes: 55, status: "completed" },
        ],
      },
      {
        dayNumber: 2,
        title: "Consensus Algorithms (Raft & Multi-Paxos)",
        desc: "Leader election invariants, log replication, terms, and quorum intersection.",
        status: "in_progress",
        topics: [
          { number: 1, title: "Leader Election State Machine", minutes: 60, status: "completed" },
          { number: 2, title: "Log Matching & Commit Invariants", minutes: 60, status: "in_progress" },
          { number: 3, title: "Cluster Membership Changes", minutes: 30, status: "not_started" },
        ],
      },
      {
        dayNumber: 3,
        title: "Storage Engine Internals & WAL",
        desc: "LSM-Trees, Write-Ahead Logs, fsync durability, and crash recovery checkpoints.",
        status: "not_started",
        topics: [
          { number: 1, title: "Sequential I/O & WAL Durability", minutes: 50, status: "not_started" },
          { number: 2, title: "SSTable Compactions & Bloom Filters", minutes: 60, status: "not_started" },
        ],
      },
      {
        dayNumber: 4,
        title: "Capstone: Distributed Key-Value Engine",
        desc: "End-to-end implementation with linearizable reads and automated failover.",
        status: "not_started",
        topics: [
          { number: 1, title: "Cluster RPC Mesh & Membership", minutes: 75, status: "not_started" },
          { number: 2, title: "Jepsen Partition Chaos Benchmarks", minutes: 75, status: "not_started" },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-zinc-100 p-6 sm:p-10 font-sans relative overflow-hidden bg-dot-grid">
      {/* Ambient Lighting */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/12 rounded-full blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none fixed top-1/3 -right-40 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[150px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/[0.08] gap-4">
          <div>
            <Link href="/" className="text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors mb-1.5 inline-block">
              ← Back to Overview
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{roadmap.title}</h1>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Spatial Roadmap Tree: {roadmap.totalDays} Days · {roadmap.dailyHours} hrs/day
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right glass-panel px-4 py-2 rounded-xl">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Mastery Progress</span>
              <div className="text-lg font-bold text-emerald-400">{roadmap.progress}%</div>
            </div>
          </div>
        </div>

        {/* Navigation Mode Bar */}
        <div className="mt-6 flex items-center justify-between p-3.5 rounded-2xl glass-panel">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">Mode:</span>
            <button
              onClick={() => setActiveMode("nonlinear")}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all font-semibold ${
                activeMode === "nonlinear"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Node-Select Mode (Arbitrary)
            </button>
            <button
              onClick={() => setActiveMode("sequential")}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all font-semibold ${
                activeMode === "sequential"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sequential Mode (Linear)
            </button>
          </div>

          <span className="text-xs font-mono text-zinc-400 hidden sm:inline-block glass-pill px-3 py-1 rounded-lg">
            Agent 1 (Days) & Agent 2 (Topics)
          </span>
        </div>

        {/* Spatial Tree Container */}
        <div className="mt-8 space-y-6">
          {roadmap.days.map((day) => (
            <AntigravityCard
              key={day.dayNumber}
              intensity={8}
              glowColor={day.status === "in_progress" ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.05)"}
            >
              <div
                className={`p-6 sm:p-7 rounded-3xl transition-all duration-300 ${
                  day.status === "completed"
                    ? "glass-panel border-emerald-500/30"
                    : day.status === "in_progress"
                    ? "glass-panel-elevated ring-1 ring-indigo-500/40"
                    : "glass-panel opacity-70"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <span
                      className={`h-9 w-9 rounded-xl text-xs font-mono font-bold flex items-center justify-center shrink-0 shadow-md ${
                        day.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : day.status === "in_progress"
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-indigo-500/20"
                          : "bg-white/[0.05] text-zinc-400 border border-white/10"
                      }`}
                    >
                      D{day.dayNumber}
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">
                        Day {day.dayNumber}: {day.title}
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">{day.desc}</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-zinc-300 glass-pill px-3 py-1 rounded-lg">
                    {day.topics.length} Subtopics
                  </span>
                </div>

                {/* Subtopics Grid (Agent 2 Output) */}
                <div className="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {day.topics.map((t) => (
                    <div
                      key={t.number}
                      className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-indigo-400/40 hover:bg-white/[0.02] transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                          <span className="text-indigo-300 font-semibold">Topic {t.number}</span>
                          <span className="glass-pill px-2 py-0.5 rounded text-[10px]">{t.minutes}m</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-200 line-clamp-2">
                          {t.title}
                        </h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${
                            t.status === "completed"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                              : t.status === "in_progress"
                              ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 animate-pulse"
                              : "bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>

                        <Link
                          href="/"
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Study Topic →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AntigravityCard>
          ))}
        </div>
      </div>
    </div>
  );
}
