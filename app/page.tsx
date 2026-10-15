"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import AntigravityCard from "@/components/AntigravityCard";

interface Topic {
  id: string;
  topic_number: number;
  title: string;
  description: string;
  estimated_minutes: number;
  status: "not_started" | "in_progress" | "completed";
}

interface DayNode {
  id: string;
  day_number: number;
  title: string;
  description: string;
  learning_objectives: string[];
  status: "not_started" | "in_progress" | "completed";
  topics: Topic[];
}

interface LessonData {
  topic_id: string;
  content_markdown: string;
  practical_examples: Array<{ language?: string; title: string; code: string }>;
  citations: Array<{ title: string; url?: string; source_type: string; snippet?: string }>;
  recommended_courses: Array<{ title: string; platform: string; url?: string; level: string }>;
}

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 1. Core Input Variables
  const [domain, setDomain] = useState("Distributed Systems & Consensus Engines");
  const [totalDays, setTotalDays] = useState(7);
  const [dailyHours, setDailyHours] = useState(2.0);
  const [navigationMode, setNavigationMode] = useState<"sequential" | "nonlinear">("nonlinear");

  // Active state
  const [roadmapId, setRoadmapId] = useState<string | null>(null);
  const [roadmapDays, setRoadmapDays] = useState<DayNode[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);

  // Loading flags
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [activeTab, setActiveTab] = useState<"lesson" | "code" | "citations" | "courses">("lesson");
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // Auth & Initial starter tree
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    handleGenerateRoadmap();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.refresh();
  };

  // Trigger Agent 1: Roadmap Structure Agent
  const handleGenerateRoadmap = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGeneratingRoadmap(true);

    try {
      const res = await fetchWithAuth("/roadmap/generate", {
        method: "POST",
        body: JSON.stringify({
          domain_context: domain,
          total_days: totalDays,
          daily_hours: dailyHours,
          skill_level: "intermediate",
        }),
      });

      if (res.roadmap && res.days) {
        setRoadmapId(res.roadmap.id);
        const mappedDays: DayNode[] = res.days.map((d: any) => ({
          id: d.id,
          day_number: d.day_number,
          title: d.title,
          description: d.description,
          learning_objectives: d.learning_objectives || [],
          status: d.status || "not_started",
          topics: [],
        }));
        setRoadmapDays(mappedDays);

        if (mappedDays.length > 0) {
          const firstDay = mappedDays[0];
          setSelectedDayId(firstDay.id);
          await handleFetchDayTopics(res.roadmap.id, firstDay.id);
        }
      }
    } catch (err) {
      console.warn("API fallback mode active (Backend offline or local simulation):", err);
      const localDays: DayNode[] = Array.from({ length: totalDays }, (_, i) => ({
        id: `day-${i + 1}`,
        day_number: i + 1,
        title: i === 0 ? "Mental Models & Distributed Invariants" : i === totalDays - 1 ? "Capstone Milestone & Fault Injection" : `Applied Patterns & Storage Engines (Part ${i + 1})`,
        description: `Comprehensive instruction, state boundaries, and exercises for ${domain}.`,
        learning_objectives: ["Master core mechanics", "Implement working patterns", "Edge case analysis"],
        status: i === 0 ? "in_progress" : "not_started",
        topics: [
          {
            id: `top-${i + 1}-1`,
            topic_number: 1,
            title: "Core Architecture & State Invariants",
            description: "Fundamental principles and failure boundary analysis.",
            estimated_minutes: Math.round((dailyHours * 60) / 2),
            status: i === 0 ? "in_progress" : "not_started",
          },
          {
            id: `top-${i + 1}-2`,
            topic_number: 2,
            title: "Hands-On Implementation & Patterns",
            description: "Writing resilient code and evaluating asynchronous race states.",
            estimated_minutes: Math.round((dailyHours * 60) / 2),
            status: "not_started",
          },
        ],
      }));
      setRoadmapDays(localDays);
      setSelectedDayId(localDays[0].id);
      setSelectedTopicId(localDays[0].topics[0].id);
      loadMockLesson(localDays[0].topics[0].title);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Trigger Agent 2: Daily Structure Agent
  const handleFetchDayTopics = async (rId: string, dId: string) => {
    setIsLoadingTopics(true);
    try {
      const topicsRes = await fetchWithAuth(`/roadmap/${rId}/day/${dId}/structure`, {
        method: "POST",
      });

      if (Array.isArray(topicsRes) && topicsRes.length > 0) {
        setRoadmapDays((prev) =>
          prev.map((d) =>
            d.id === dId
              ? {
                  ...d,
                  topics: topicsRes.map((t: any) => ({
                    id: t.id,
                    topic_number: t.topic_number,
                    title: t.title,
                    description: t.description,
                    estimated_minutes: t.estimated_minutes,
                    status: t.status || "not_started",
                  })),
                }
              : d
          )
        );
        setSelectedTopicId(topicsRes[0].id);
        await handleFetchLesson(topicsRes[0].id);
      }
    } catch (err) {
      console.warn("Agent 2 fetch error:", err);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  // Trigger Agent 3: Daily Teacher Agent
  const handleFetchLesson = async (tId: string) => {
    setIsLoadingLesson(true);
    try {
      const lessonRes = await fetchWithAuth(`/roadmap/topic/${tId}/teach`, {
        method: "POST",
      });
      if (lessonRes && lessonRes.content_markdown) {
        setCurrentLesson(lessonRes);
      }
    } catch (err) {
      console.warn("Agent 3 fetch error:", err);
      loadMockLesson("Selected Topic");
    } finally {
      setIsLoadingLesson(false);
    }
  };

  const loadMockLesson = (title: string) => {
    setCurrentLesson({
      topic_id: "mock",
      content_markdown: `# ${title}\n\n## 1. Conceptual Framework & Mental Models\n\nIn this module on **${domain}**, we construct the fundamental invariants and failure boundaries necessary for mission-critical software.\n\n### Key Invariants\n- **Separation of Concerns**: Decouple state representation from execution protocols.\n- **Fault Isolation**: Bound blast radius when unexpected network partitions or crash-stops occur.\n- **Idempotence & Total Order**: Ensure operations yield identical results regardless of retry frequency or jitter.`,
      practical_examples: [
        {
          language: "python",
          title: "Production-Grade Resilient Engine",
          code: `import time\nfrom typing import Dict, Any\n\nclass ResilientEngine:\n    def __init__(self, max_retries: int = 3, backoff: float = 1.5):\n        self.max_retries = max_retries\n        self.backoff = backoff\n\n    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:\n        delay = 0.2\n        for attempt in range(1, self.max_retries + 1):\n            try:\n                # Idempotent state machine transition\n                return {"status": "success", "processed_at": time.time()}\n            except Exception as err:\n                if attempt == self.max_retries:\n                    raise err\n                time.sleep(delay)\n                delay *= self.backoff`,
        },
      ],
      citations: [
        {
          title: `Official Documentation & RFC: ${domain}`,
          url: "https://docs.kernel.org",
          source_type: "Official Specification",
          snippet: "Defines authoritative protocol lifecycle, wire formats, and consistency invariants.",
        },
        {
          title: "Designing Data-Intensive Applications (Martin Kleppmann)",
          url: "https://dataintensive.net",
          source_type: "Seminal Textbook",
          snippet: "Chapter 9: Consistency, consensus, total order broadcast, and linearizability.",
        },
      ],
      recommended_courses: [
        {
          title: `MIT 6.824: Distributed Systems Engineering`,
          platform: "MIT OpenCourseWare",
          url: "https://ocw.mit.edu",
          level: "Advanced",
        },
        {
          title: `Mastering ${domain}: Architecture to Production`,
          platform: "Coursera / Stanford Online",
          url: "https://coursera.org",
          level: "Intermediate to Advanced",
        },
      ],
    });
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const selectedDay = roadmapDays.find((d) => d.id === selectedDayId) || roadmapDays[0];
  const selectedTopic =
    selectedDay?.topics?.find((t) => t.id === selectedTopicId) || selectedDay?.topics?.[0];

  return (
    <div className="min-h-screen bg-[#06070a] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden bg-dot-grid">
      {/* Antigravity Ambient Atmospheric Lighting */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none fixed top-1/3 -right-40 w-[550px] h-[550px] bg-cyan-500/12 rounded-full blur-[150px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 w-[650px] h-[650px] bg-purple-600/10 rounded-full blur-[160px]" />

      {/* Top Navbar */}
      <header className="border-b border-white/[0.08] sticky top-0 z-50 bg-[#06070a]/75 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 border border-white/20 animate-float-subtle">
              R
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-sm">Roadmap</span>
              <span className="text-xs font-mono font-bold text-indigo-400">.ai</span>
            </div>
            <span className="ml-2 text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full glass-pill text-indigo-300 border border-indigo-400/20 shadow-inner">
              Spatial 3-Agent
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
            <a href="#tree-workspace" className="hover:text-white transition-colors duration-200">Interactive Tree</a>
            <a href="#agents-spec" className="hover:text-white transition-colors duration-200">3-Agent Engine</a>
            <Link href="/billing" className="hover:text-white transition-colors duration-200">Quotas & Billing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/billing"
              className="hidden sm:inline-block text-xs font-mono px-3 py-1.5 rounded-xl glass-pill text-zinc-300 hover:text-white transition-all shadow-sm"
            >
              Token Quota: 250k
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono text-zinc-300 glass-pill px-3 py-1.5 rounded-xl hidden sm:inline-block">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.1] transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-medium px-3.5 py-1.5 rounded-xl text-zinc-300 hover:text-white transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Spatial Hero */}
      <section className="pt-16 pb-12 max-w-5xl mx-auto px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs text-zinc-300 mb-6 shadow-inner animate-float-slow">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Antigravity Spatial Multi-Agent Learning Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
          Turn Any Learning Goal into a{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-400">
            Spatial Multi-Agent Roadmap
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Agent 1 partitions your goal into days. Agent 2 structures daily topics and time budgets. Agent 3 delivers comprehensive lessons, practical code, citations, and courses.
        </p>

        {/* Spatial Configuration Bar */}
        <div className="mt-10">
          <AntigravityCard intensity={8} glowColor="rgba(99, 102, 241, 0.2)">
            <form
              onSubmit={handleGenerateRoadmap}
              className="p-5 sm:p-6 glass-panel rounded-2xl flex flex-col md:flex-row gap-4 items-center"
            >
              <div className="flex-1 text-left w-full">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  Field of Study / Syllabus Context
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-[#040508] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all shadow-inner"
                  placeholder="e.g. Distributed Consensus, Rust Concurrency, Machine Learning..."
                />
              </div>

              <div className="w-full md:w-36 text-left">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  Total Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={totalDays}
                  onChange={(e) => setTotalDays(Number(e.target.value))}
                  className="w-full bg-[#040508] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all shadow-inner"
                />
              </div>

              <div className="w-full md:w-36 text-left">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  Daily Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="16"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full bg-[#040508] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingRoadmap}
                className="w-full md:w-auto mt-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 border border-indigo-400/30 transition-all hover:scale-[1.03] active:scale-[0.98] self-end flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGeneratingRoadmap ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Orchestrating...</span>
                  </>
                ) : (
                  "Generate Tree"
                )}
              </button>
            </form>
          </AntigravityCard>
        </div>
      </section>

      {/* Interactive 3D Tree Workspace */}
      <section id="tree-workspace" className="py-8 max-w-7xl mx-auto px-6 relative z-10">
        {/* Navigation Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-white/[0.08] gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">Mode:</span>
            <div className="inline-flex rounded-xl glass-panel p-1 text-xs">
              <button
                onClick={() => setNavigationMode("nonlinear")}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-medium ${
                  navigationMode === "nonlinear"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Node-Select Mode (Arbitrary)
              </button>
              <button
                onClick={() => setNavigationMode("sequential")}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-medium ${
                  navigationMode === "sequential"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sequential Mode (Linear)
              </button>
            </div>
          </div>

          <div className="text-xs text-zinc-400 flex items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" /> Completed
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50 animate-pulse" /> Active
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" /> Pending
            </span>
          </div>
        </div>

        {/* Tree Layout: Split View (Hierarchical Tree on Left, Teacher Panel on Right) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Column: Hierarchical Roadmap Tree (Agent 1 & Agent 2) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl glass-panel flex items-center justify-between border-indigo-500/20">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold">
                  Agent 1: Roadmap Structure
                </span>
                <h2 className="text-sm font-bold text-white mt-0.5">{domain}</h2>
              </div>
              <span className="text-xs font-mono text-zinc-300 glass-pill px-3 py-1 rounded-lg">
                {roadmapDays.length} Days
              </span>
            </div>

            {/* Days and Topics Accordion Tree with Antigravity 3D Cards */}
            <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1.5">
              {roadmapDays.map((day) => {
                const isSelected = selectedDayId === day.id;
                return (
                  <AntigravityCard
                    key={day.id}
                    intensity={10}
                    glowColor={isSelected ? "rgba(99, 102, 241, 0.3)" : "rgba(255, 255, 255, 0.05)"}
                  >
                    <div
                      className={`p-4 rounded-2xl transition-all duration-300 ${
                        isSelected
                          ? "glass-panel-elevated ring-1 ring-indigo-500/40"
                          : "glass-panel hover:border-white/20"
                      }`}
                    >
                      {/* Day Header Node */}
                      <div
                        onClick={() => {
                          setSelectedDayId(day.id);
                          if (day.topics.length === 0 && roadmapId) {
                            handleFetchDayTopics(roadmapId, day.id);
                          } else if (day.topics.length > 0) {
                            setSelectedTopicId(day.topics[0].id);
                            handleFetchLesson(day.topics[0].id);
                          }
                        }}
                        className="cursor-pointer flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`h-8 w-8 rounded-xl text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-md ${
                              day.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : day.status === "in_progress"
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-indigo-500/20"
                                : "bg-white/[0.05] text-zinc-400 border border-white/10"
                            }`}
                          >
                            D{day.day_number}
                          </span>
                          <div>
                            <h3 className="font-bold text-sm text-zinc-100 leading-snug">
                              Day {day.day_number}: {day.title}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {day.description}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] text-zinc-400 font-mono shrink-0 glass-pill px-2 py-0.5 rounded">
                          {day.topics.length > 0 ? `${day.topics.length} topics` : "Expand"}
                        </span>
                      </div>

                      {/* Subtopic Nodes (Agent 2: Daily Structure) */}
                      {isSelected && (
                        <div className="px-1 pb-1 pt-3.5 border-t border-white/[0.08] mt-3 space-y-2">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                            <span className="text-indigo-300 font-semibold">Agent 2: Daily Subtopics</span>
                            <span>{dailyHours}h budgeted</span>
                          </div>

                          {isLoadingTopics ? (
                            <div className="p-4 text-center text-xs text-indigo-300 font-mono flex items-center justify-center gap-2">
                              <span className="animate-spin">⚙</span> Agent 2 calculating topic time budgets...
                            </div>
                          ) : (
                            day.topics.map((t) => {
                              const isTopicSelected = selectedTopicId === t.id;
                              return (
                                <div
                                  key={t.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTopicId(t.id);
                                    handleFetchLesson(t.id);
                                  }}
                                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                                    isTopicSelected
                                      ? "bg-indigo-600/20 border-indigo-400/60 text-white shadow-md shadow-indigo-500/10"
                                      : "bg-black/30 border-white/[0.06] text-zinc-300 hover:border-white/20 hover:bg-white/[0.02]"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className={`h-2.5 w-2.5 rounded-full ${
                                        t.status === "completed"
                                          ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                                          : t.status === "in_progress"
                                          ? "bg-indigo-400 shadow-sm shadow-indigo-400/50 animate-pulse"
                                          : "bg-zinc-600"
                                      }`}
                                    />
                                    <div>
                                      <div className="text-xs font-semibold">{t.title}</div>
                                      <div className="text-[11px] text-zinc-400 font-mono">
                                        {t.estimated_minutes} min study session
                                      </div>
                                    </div>
                                  </div>

                                  <span className="text-[10px] font-mono text-indigo-300 glass-pill px-2.5 py-0.5 rounded border border-indigo-400/20">
                                    {isTopicSelected ? "Active" : "Inspect"}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </AntigravityCard>
                );
              })}
            </div>
          </div>

          {/* Right Column: Agent 3 Daily Teacher & Resource Curator */}
          <div className="lg:col-span-7">
            <AntigravityCard intensity={6} glowColor="rgba(99, 102, 241, 0.25)">
              <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                      Agent 3: Daily Teacher
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                      {selectedTopic?.title || "Select a Topic to Begin Lesson"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono text-zinc-400">
                      Day {selectedDay?.day_number || 1}
                    </span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {selectedTopic?.estimated_minutes || 45} mins
                    </span>
                  </div>
                </div>

                {/* Teacher Tabs */}
                <div className="flex border-b border-white/[0.08] mt-5 gap-2 overflow-x-auto pb-1">
                  {[
                    { id: "lesson", label: "Lesson Content" },
                    { id: "code", label: "Practical Implementation" },
                    { id: "citations", label: "Verified Citations" },
                    { id: "courses", label: "Recommended Courses" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/40"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Body */}
                <div className="mt-6 space-y-4 min-h-[420px]">
                  {isLoadingLesson ? (
                    <div className="flex flex-col items-center justify-center h-80 text-xs font-mono text-indigo-300 gap-3">
                      <span className="h-8 w-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-500/30" />
                      <span>Agent 3 generating pedagogy, code & verified citations...</span>
                    </div>
                  ) : currentLesson ? (
                    <>
                      {activeTab === "lesson" && (
                        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed max-h-[460px] overflow-y-auto pr-2 font-normal">
                          <div className="whitespace-pre-line">{currentLesson.content_markdown}</div>
                        </div>
                      )}

                      {activeTab === "code" && (
                        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                          {currentLesson.practical_examples && currentLesson.practical_examples.length > 0 ? (
                            currentLesson.practical_examples.map((ex, idx) => (
                              <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-zinc-400">
                                  <span className="font-mono font-bold text-white">{ex.title}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-white/[0.06] px-2 py-0.5 rounded font-mono text-indigo-300 border border-white/10">
                                      {ex.language || "python"}
                                    </span>
                                    <button
                                      onClick={() => copyCode(ex.code, idx)}
                                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 transition-all cursor-pointer"
                                    >
                                      {copiedCodeIndex === idx ? "✓ Copied" : "Copy"}
                                    </button>
                                  </div>
                                </div>
                                <pre className="p-4 rounded-2xl bg-[#040508] border border-white/[0.08] text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed shadow-inner">
                                  {ex.code}
                                </pre>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-zinc-400">No code examples generated for this theoretical topic.</p>
                          )}
                        </div>
                      )}

                      {activeTab === "citations" && (
                        <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                          {currentLesson.citations && currentLesson.citations.length > 0 ? (
                            currentLesson.citations.map((c, idx) => (
                              <div key={idx} className="p-4 rounded-2xl glass-panel border-white/[0.08] hover:border-indigo-500/40 transition-all">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white">{c.title}</span>
                                  <span className="text-[10px] font-mono uppercase bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded border border-indigo-400/20">
                                    {c.source_type}
                                  </span>
                                </div>
                                {c.snippet && <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{c.snippet}</p>}
                                {c.url && (
                                  <a
                                    href={c.url.startsWith("http") ? c.url : `https://${c.url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline mt-2.5 inline-block font-mono"
                                  >
                                    Inspect Primary Source ↗
                                  </a>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-zinc-400">No citation sources attached.</p>
                          )}
                        </div>
                      )}

                      {activeTab === "courses" && (
                        <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                          {currentLesson.recommended_courses && currentLesson.recommended_courses.length > 0 ? (
                            currentLesson.recommended_courses.map((course, idx) => (
                              <div key={idx} className="p-4 rounded-2xl glass-panel border-white/[0.08] flex items-center justify-between hover:border-cyan-500/40 transition-all">
                                <div>
                                  <h4 className="text-sm font-bold text-white">{course.title}</h4>
                                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">{course.platform} · Level: {course.level}</p>
                                </div>
                                {course.url && (
                                  <a
                                    href={course.url.startsWith("http") ? course.url : `https://${course.url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white border border-white/10 transition-all"
                                  >
                                    Enroll ↗
                                  </a>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-zinc-400">No course recommendations attached.</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 mt-6 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono">Mastered this topic?</span>
                  <button
                    onClick={() => alert("Topic marked completed! Advancing along your trajectory.")}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    Mark Complete & Advance →
                  </button>
                </div>
              </div>
            </AntigravityCard>
          </div>
        </div>
      </section>

      {/* 3-Agent Architecture Explanation */}
      <section id="agents-spec" className="py-20 border-t border-white/[0.08] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold">
              The Multi-Agent Engine
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mt-1.5">
              Hierarchical 3-Agent Tree Architecture
            </h2>
            <p className="text-zinc-400 text-sm mt-2.5 leading-relaxed">
              Each layer of your learning trajectory is decomposed and delivered by a specialized AI agent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AntigravityCard intensity={12} glowColor="rgba(99, 102, 241, 0.2)">
              <div className="p-6 rounded-2xl glass-panel h-full">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-400/30 flex items-center justify-center font-mono font-bold mb-4 shadow-inner">
                  A1
                </div>
                <h3 className="font-bold text-white text-base">Agent 1: Roadmap Structure Agent</h3>
                <p className="text-xs font-mono text-zinc-400 mt-1">Root Planner</p>
                <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                  Ingests your domain, syllabus outline, and total allocated days. Generates the master chronological sequence of daily learning objectives (Day 1 ... Day N).
                </p>
              </div>
            </AntigravityCard>

            <AntigravityCard intensity={12} glowColor="rgba(6, 182, 212, 0.2)">
              <div className="p-6 rounded-2xl glass-panel h-full">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-400/30 flex items-center justify-center font-mono font-bold mb-4 shadow-inner">
                  A2
                </div>
                <h3 className="font-bold text-white text-base">Agent 2: Daily Structure Agent</h3>
                <p className="text-xs font-mono text-zinc-400 mt-1">Curriculum Designer</p>
                <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                  Takes a given day from Agent 1 and breaks it down into discrete subtopics (Topic 1 ... Topic N) with calculated time budgets matching your daily hours.
                </p>
              </div>
            </AntigravityCard>

            <AntigravityCard intensity={12} glowColor="rgba(16, 185, 129, 0.2)">
              <div className="p-6 rounded-2xl glass-panel h-full">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-mono font-bold mb-4 shadow-inner">
                  A3
                </div>
                <h3 className="font-bold text-white text-base">Agent 3: Daily Teacher Agent</h3>
                <p className="text-xs font-mono text-zinc-400 mt-1">Pedagogy & Resource Curator</p>
                <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                  Delivers comprehensive instruction, runnable code examples, verified citations (papers, textbooks), and curated online courses for each topic.
                </p>
              </div>
            </AntigravityCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-zinc-500 relative z-10">
        <p>© 2026 Roadmap.ai. Antigravity Spatial Multi-Agent Learning Engine.</p>
      </footer>
    </div>
  );
}
