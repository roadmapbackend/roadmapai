"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ClassroomPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      agent: "Teacher Agent",
      content:
        "Welcome to your deep dive on **Consensus Foundations (Raft & Multi-Paxos)**.\n\n" +
        "Let's ground this with a real scenario:\n" +
        "You have a cluster of 5 Raft nodes. A network partition occurs, creating two isolated subnets:\n" +
        "• Subnet A has 2 nodes (including the current Leader).\n" +
        "• Subnet B has 3 nodes.\n\n" +
        "A client attempts to execute a `SET key=value` write against the Leader in Subnet A. Explain step-by-step what happens to that write and whether it can ever be committed.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", agent: "Learner", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          agent: "Evaluator & Teacher Loop",
          content:
            "**Analysis of your response:**\n\n" +
            "Your explanation correctly recognizes that the Leader in Subnet A will append the log entry to its local log. " +
            "However, when it broadcasts `AppendEntries` RPCs, it can only ever receive 1 acknowledgement (itself + 1 peer = 2 nodes total).\n\n" +
            "Because 2 is less than the required majority quorum of 3 (`floor(5/2) + 1 = 3`), the entry remains uncommitted. Meanwhile, Subnet B will time out its heartbeat and elect a new Leader with a higher term number!\n\n" +
            "**Follow-up Challenge:** What happens to this uncommitted entry once the partition heals and Subnet A reconnects to Subnet B?",
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/curriculum" className="text-xs text-zinc-400 hover:text-white">
            ← Exit Classroom
          </Link>
          <span className="text-zinc-600">|</span>
          <span className="text-sm font-semibold text-white">
            Module 2: Consensus Foundations (Raft & Multi-Paxos)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-zinc-400">LangGraph Agent Loop Active</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-between">
        <div className="space-y-6 overflow-y-auto pb-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role !== "user" && (
                <div className="h-8 w-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
              )}
              <div
                className={`max-w-2xl p-5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-900/80 border border-zinc-800 text-zinc-200"
                }`}
              >
                <div className="text-[11px] font-mono text-zinc-400 mb-1">{m.agent}</div>
                <div className="whitespace-pre-line">{m.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
              <span className="animate-spin">⚙</span> Teacher Agent generating Socratic feedback...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="pt-4 border-t border-zinc-800/80 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your explanation or response to the Socratic prompt..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
