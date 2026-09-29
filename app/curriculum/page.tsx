"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function CurriculumTreePage() {
  const [activeMode, setActiveMode] = useState<"sequential" | "nonlinear">("nonlinear");
  const [selectedDay, setSelectedDay] = useState(1);

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
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 p-6 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
          <div>
            <Link href="/" className="text-xs font-mono text-indigo-400 hover:underline mb-1 inline-block">
              ← Back to Overview
            </Link>
            <h1 className="text-2xl font-bold text-white">{roadmap.title}</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Hierarchical Roadmap Tree: {roadmap.totalDays} Days · {roadmap.dailyHours} hrs/day
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-mono text-zinc-400">Total Progress</span>
              <div className="text-lg font-bold text-emerald-400">{roadmap.progress}%</div>
            </div>
          </div>
        </div>

        {/* Navigation Mode Bar */}
        <div className="mt-6 flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Mode:</span>
            <button
              onClick={() => setActiveMode("nonlinear")}
              className={`px-3 py-1 rounded-md text-xs transition-all ${
                activeMode === "nonlinear"
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Node-Select Mode (Click any Topic)
            </button>
            <button
              onClick={() => setActiveMode("sequential")}
              className={`px-3 py-1 rounded-md text-xs transition-all ${
                activeMode === "sequential"
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sequential Mode (Linear Progress)
            </button>
          </div>

          <span className="text-xs font-mono text-zinc-400 hidden sm:inline-block">
            Powered by Agent 1 (Days) & Agent 2 (Topics)
          </span>
        </div>

        {/* Tree Container */}
        <div className="mt-8 space-y-6">
          {roadmap.days.map((day) => (
            <div
              key={day.dayNumber}
              className={`p-6 rounded-2xl border transition-all ${
                day.status === "completed"
                  ? "bg-zinc-950/90 border-emerald-500/30"
                  : day.status === "in_progress"
                  ? "bg-zinc-900/90 border-indigo-500/50 shadow-xl ring-1 ring-indigo-500/30"
                  : "bg-zinc-950/60 border-zinc-800/80 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3.5">
                  <span
                    className={`h-8 w-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                      day.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : day.status === "in_progress"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    D{day.dayNumber}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Day {day.dayNumber}: {day.title}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{day.desc}</p>
                  </div>
                </div>

                <span className="text-xs font-mono text-zinc-400">
                  {day.topics.length} Subtopics
                </span>
              </div>

              {/* Subtopics Grid (Agent 2 Output) */}
              <div className="mt-6 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {day.topics.map((t) => (
                  <div
                    key={t.number}
                    className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                        <span>Topic {t.number}</span>
                        <span>{t.minutes}m</span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200 line-clamp-2">
                        {t.title}
                      </h4>
                    </div>

                    <div className="mt-4 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          t.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : t.status === "in_progress"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>

                      <Link
                        href="/"
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                      >
                        Study →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
