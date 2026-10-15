"use client";

import React, { useState } from "react";
import Link from "next/link";
import AntigravityCard from "@/components/AntigravityCard";

export default function BillingPage() {
  const [subscription] = useState({
    tier: "Free Starter",
    tokensUsed: 84200,
    tokenLimit: 250000,
    resetDate: "October 26, 2026",
  });

  const percent = Math.min(
    100,
    Math.round((subscription.tokensUsed / subscription.tokenLimit) * 100)
  );

  return (
    <div className="min-h-screen bg-[#06070a] text-zinc-100 p-6 sm:p-10 font-sans relative overflow-hidden bg-dot-grid">
      {/* Ambient Lighting */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none fixed -bottom-40 right-10 w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[150px]" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/" className="text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors mb-4 inline-block">
          ← Back to Overview
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Billing & Token Quota Management</h1>
        <p className="text-xs text-zinc-400 mt-1 font-mono">
          Monitor your AI agent token consumption and manage plan subscriptions.
        </p>

        {/* Current Usage Card with Antigravity Card */}
        <div className="mt-8">
          <AntigravityCard intensity={8} glowColor="rgba(99, 102, 241, 0.2)">
            <div className="p-6 sm:p-8 rounded-3xl glass-panel-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">Current Active Tier</span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{subscription.tier}</h2>
                </div>
                <span className="px-3.5 py-1.5 rounded-full glass-pill text-indigo-300 text-xs font-mono border border-indigo-500/30">
                  Active Cycle
                </span>
              </div>

              <div className="mt-7">
                <div className="flex justify-between text-xs text-zinc-300 mb-2 font-mono">
                  <span>Monthly Agent Token Allowance</span>
                  <span className="font-semibold text-white">
                    {subscription.tokensUsed.toLocaleString()} / {subscription.tokenLimit.toLocaleString()} ({percent}%)
                  </span>
                </div>
                <div className="w-full bg-black/60 h-3.5 rounded-full overflow-hidden border border-white/[0.08] p-0.5 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-md shadow-indigo-500/50"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-2.5 font-mono">
                  Quota resets automatically on {subscription.resetDate}.
                </p>
              </div>
            </div>
          </AntigravityCard>
        </div>

        {/* Plan Upgrade Options with 3D Depth */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AntigravityCard intensity={10} glowColor="rgba(255, 255, 255, 0.05)">
            <div className="p-6 sm:p-8 rounded-3xl glass-panel flex flex-col justify-between h-full">
              <div>
                <h3 className="font-bold text-white text-base">Free Starter</h3>
                <p className="text-xs text-zinc-400 mt-1 font-mono">250,000 monthly agent tokens</p>
                <div className="text-3xl font-extrabold text-white mt-5">$0</div>
                <ul className="mt-5 space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">✓ 1 Active Roadmap Tree</li>
                  <li className="flex items-center gap-2">✓ 250k AI Agent Tokens / mo</li>
                  <li className="flex items-center gap-2">✓ Agent 1, 2 & 3 Standard Access</li>
                </ul>
              </div>
              <button
                disabled
                className="mt-8 w-full py-3 rounded-xl bg-white/[0.04] text-zinc-500 text-xs font-semibold cursor-default border border-white/[0.04]"
              >
                Current Active Plan
              </button>
            </div>
          </AntigravityCard>

          <AntigravityCard intensity={10} glowColor="rgba(99, 102, 241, 0.3)">
            <div className="p-6 sm:p-8 rounded-3xl glass-panel-elevated relative flex flex-col justify-between h-full border-indigo-500/40">
              <div className="absolute -top-3 right-6 text-[10px] font-mono uppercase bg-indigo-600 text-white px-3 py-0.5 rounded-full font-bold shadow-md shadow-indigo-500/50 border border-indigo-400/40">
                Recommended
              </div>

              <div>
                <h3 className="font-bold text-white text-base">Pro Learner</h3>
                <p className="text-xs text-indigo-300 mt-1 font-mono">2,500,000 monthly agent tokens + Unlimited Tracks</p>
                <div className="text-3xl font-extrabold text-white mt-5">$29 <span className="text-xs font-normal text-zinc-400 font-mono">/ month</span></div>
                <ul className="mt-5 space-y-2.5 text-xs text-zinc-200">
                  <li className="flex items-center gap-2">✓ Unlimited Active Roadmap Trees</li>
                  <li className="flex items-center gap-2">✓ 2.5M AI Agent Tokens / mo</li>
                  <li className="flex items-center gap-2">✓ Priority LLM Reasoning Engine</li>
                  <li className="flex items-center gap-2">✓ Deep Code Diagnostics & Citations</li>
                </ul>
              </div>

              <button className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 border border-indigo-400/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                Upgrade to Pro
              </button>
            </div>
          </AntigravityCard>
        </div>
      </div>
    </div>
  );
}
