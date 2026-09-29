"use client";

import React, { useState } from "react";
import Link from "next/link";

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
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-xs text-indigo-400 hover:underline mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-2xl font-bold text-white">Billing & Usage Management</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Monitor your AI agent token consumption and manage plan subscriptions.
        </p>

        {/* Current Usage Card */}
        <div className="mt-8 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-zinc-400">Current Plan</span>
              <h2 className="text-xl font-bold text-white mt-0.5">{subscription.tier}</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-mono border border-indigo-500/20">
              Active Cycle
            </span>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-zinc-400 mb-2">
              <span>Monthly Agent Tokens Used</span>
              <span>
                {subscription.tokensUsed.toLocaleString()} / {subscription.tokenLimit.toLocaleString()} ({percent}%)
              </span>
            </div>
            <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Cycles reset automatically on {subscription.resetDate}.
            </p>
          </div>
        </div>

        {/* Plan Upgrade Options */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-white">Free Starter</h3>
              <p className="text-xs text-zinc-400 mt-1">250k monthly agent tokens</p>
              <div className="text-2xl font-bold text-white mt-4">$0</div>
            </div>
            <button
              disabled
              className="mt-6 w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-medium cursor-default"
            >
              Current Active Plan
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-zinc-900/80 border border-indigo-500/40 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-white">Pro Learner</h3>
              <p className="text-xs text-indigo-300 mt-1">2,500,000 monthly agent tokens + Unlimited Tracks</p>
              <div className="text-2xl font-bold text-white mt-4">$29 / mo</div>
            </div>
            <button className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md transition-all">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
