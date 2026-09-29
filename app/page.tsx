"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

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
  const [domain, setDomain] = useState("Distributed Systems & Storage Engines");
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

  // Auth & Initial starter tree
  useEffect(() => {
    // Check initial user session
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
          // Automatically trigger Agent 2 for Day 1
          await handleFetchDayTopics(res.roadmap.id, firstDay.id);
        }
      }
    } catch (err) {
      console.warn("API fallback mode active (Backend offline or local simulation):", err);
      // Fallback local mockup for instant UI testing
      const localDays: DayNode[] = Array.from({ length: totalDays }, (_, i) => ({
        id: `day-${i + 1}`,
        day_number: i + 1,
        title: i === 0 ? "Mental Models & Core Foundations" : i === totalDays - 1 ? "Capstone Milestone & Verification" : `Applied Patterns & Mechanics (Part ${i + 1})`,
        description: `Comprehensive instruction and exercises for ${domain}.`,
        learning_objectives: ["Master core mechanics", "Implement working patterns", "Edge case analysis"],
        status: i === 0 ? "in_progress" : "not_started",
        topics: [
          {
            id: `top-${i + 1}-1`,
            topic_number: 1,
            title: "Core Architecture & Theory",
            description: "Fundamental principles and invariants.",
            estimated_minutes: Math.round((dailyHours * 60) / 2),
            status: i === 0 ? "in_progress" : "not_started",
          },
          {
            id: `top-${i + 1}-2`,
            topic_number: 2,
            title: "Hands-On Implementation & Patterns",
            description: "Writing code and evaluating failure states.",
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
        // Automatically trigger Agent 3 for Topic 1
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
      content_markdown: `# ${title}\n\n## 1. Conceptual Framework & Mental Models\n\nIn this module on **${domain}**, we explore core invariants and failure boundaries.\n\n### Key Principles\n- **Separation of Concerns**: Decouple state representation from execution protocols.\n- **Fault Isolation**: Bound blast radius when unexpected inputs occur.\n- **Idempotence**: Ensure operations yield identical results regardless of retry frequency.`,
      practical_examples: [
        {
          language: "python",
          title: "Production Implementation Example",
          code: `import time\n\nclass ResilientEngine:\n    def execute(self, payload):\n        # Idempotent execution logic\n        return {"status": "success", "processed_at": time.time()}`,
        },
      ],
      citations: [
        {
          title: `Official Documentation: ${domain}`,
          url: "https://docs.kernel.org",
          source_type: "Official Specification",
          snippet: "Defines state protocol guarantees and reliability invariants.",
        },
      ],
      recommended_courses: [
        {
          title: `Mastering ${domain}: Production Engineering`,
          platform: "MIT OpenCourseWare / Coursera",
          url: "https://ocw.mit.edu",
          level: "Intermediate to Advanced",
        },
      ],
    });
  };

  const selectedDay = roadmapDays.find((d) => d.id === selectedDayId) || roadmapDays[0];
  const selectedTopic =
    selectedDay?.topics?.find((t) => t.id === selectedTopicId) || selectedDay?.topics?.[0];

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 sticky top-0 z-50 bg-[#090a0f]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
              R
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">Roadmap</span>
              <span className="text-xs font-mono font-semibold text-indigo-400">.ai</span>
            </div>
            <span className="ml-2 text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live Multi-Agent
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#agents" className="hover:text-white transition-colors">3-Agent Architecture</a>
            <a href="#tree-demo" className="hover:text-white transition-colors">Interactive Tree</a>
            <Link href="/billing" className="hover:text-white transition-colors">Quotas & Billing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/billing"
              className="hidden sm:inline-block text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all"
            >
              Token Quota: 250k
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg hidden sm:inline-block">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-medium px-3.5 py-1.5 rounded-lg text-zinc-300 hover:text-white transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-medium px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header & Agent 1 Configuration */}
      <section className="pt-14 pb-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 mb-6">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Hierarchical Multi-Agent Tree Orchestration</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Turn Any Learning Goal into a{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-200">
            Scheduled Multi-Agent Roadmap
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
          Agent 1 partitions your roadmap into days. Agent 2 structures daily topics and time budgets. Agent 3 delivers deep lessons, practical code, citations, and courses.
        </p>

        {/* Configuration Bar */}
        <form onSubmit={handleGenerateRoadmap} className="mt-8 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 text-left w-full">
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Field of Study / Syllabus
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="e.g. Distributed Systems, Rust Concurrency, Machine Learning..."
            />
          </div>

          <div className="w-full md:w-36 text-left">
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Total Days
            </label>
            <input
              type="number"
              min="1"
              max="180"
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="w-full md:w-36 text-left">
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Daily Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="16"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={isGeneratingRoadmap}
            className="w-full md:w-auto mt-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all self-end flex items-center justify-center gap-2"
          >
            {isGeneratingRoadmap ? (
              <>
                <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Agent 1 Planning...</span>
              </>
            ) : (
              "Generate Tree"
            )}
          </button>
        </form>
      </section>

      {/* Interactive Tree Workspace Section */}
      <section id="tree-demo" className="py-8 max-w-7xl mx-auto px-6">
        {/* Navigation Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-zinc-800 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 uppercase">Navigation Mode:</span>
            <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-1 text-xs">
              <button
                onClick={() => setNavigationMode("nonlinear")}
                className={`px-3 py-1 rounded-md transition-all ${
                  navigationMode === "nonlinear"
                    ? "bg-indigo-600 text-white font-medium shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Node-Select Mode (Arbitrary Access)
              </button>
              <button
                onClick={() => setNavigationMode("sequential")}
                className={`px-3 py-1 rounded-md transition-all ${
                  navigationMode === "sequential"
                    ? "bg-indigo-600 text-white font-medium shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sequential Mode (Day 1 → Day N)
              </button>
            </div>
          </div>

          <div className="text-xs text-zinc-400 flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400" /> In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-zinc-600" /> Not Started
            </span>
          </div>
        </div>

        {/* Tree Layout: Split View */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Hierarchical Roadmap Tree (Agent 1 & Agent 2) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-mono tracking-wider text-indigo-400">
                  Agent 1: Roadmap Structure
                </span>
                <h2 className="text-sm font-bold text-white mt-0.5">{domain}</h2>
              </div>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded">
                {roadmapDays.length} Days
              </span>
            </div>

            {/* Days and Topics Accordion Tree */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {roadmapDays.map((day) => {
                const isSelected = selectedDayId === day.id;
                return (
                  <div
                    key={day.id}
                    className={`rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-zinc-900/90 border-indigo-500/50 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/30"
                        : "bg-zinc-950/70 border-zinc-800 hover:border-zinc-700"
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
                      className="p-4 cursor-pointer flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`h-7 w-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            day.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : day.status === "in_progress"
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          D{day.day_number}
                        </span>
                        <div>
                          <h3 className="font-semibold text-sm text-zinc-100">
                            Day {day.day_number}: {day.title}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                            {day.description}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs text-zinc-500 font-mono shrink-0">
                        {day.topics.length > 0 ? `${day.topics.length} topics` : "Expand"}
                      </span>
                    </div>

                    {/* Subtopic Nodes (Agent 2: Daily Structure) */}
                    {isSelected && (
                      <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 mt-1 space-y-2">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center justify-between">
                          <span>Agent 2: Daily Topics</span>
                          <span>{dailyHours}h budgeted</span>
                        </div>

                        {isLoadingTopics ? (
                          <div className="p-4 text-center text-xs text-indigo-400 font-mono flex items-center justify-center gap-2">
                            <span className="animate-spin">⚙</span> Agent 2 generating daily subtopics...
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
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                  isTopicSelected
                                    ? "bg-indigo-600/15 border-indigo-500/60 text-white shadow-sm"
                                    : "bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:border-zinc-700"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      t.status === "completed"
                                        ? "bg-emerald-400"
                                        : t.status === "in_progress"
                                        ? "bg-indigo-400 animate-pulse"
                                        : "bg-zinc-600"
                                    }`}
                                  />
                                  <div>
                                    <div className="text-xs font-medium">{t.title}</div>
                                    <div className="text-[11px] text-zinc-500">
                                      {t.estimated_minutes} min study session
                                    </div>
                                  </div>
                                </div>

                                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                  {isTopicSelected ? "Active" : "Inspect"}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Agent 3 Daily Teacher & Resource Curator */}
          <div className="lg:col-span-7 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                  Agent 3: Daily Teacher
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedTopic?.title || "Select a Topic to Begin Lesson"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">
                  Day {selectedDay?.day_number || 1}
                </span>
                <span className="text-zinc-600">|</span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {selectedTopic?.estimated_minutes || 45} mins
                </span>
              </div>
            </div>

            {/* Teacher Tabs */}
            <div className="flex border-b border-zinc-800 mt-4 gap-2">
              {[
                { id: "lesson", label: "Lesson Content" },
                { id: "code", label: "Practical Implementation" },
                { id: "citations", label: "Verified Citations" },
                { id: "courses", label: "Recommended Courses" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div className="mt-6 space-y-4 min-h-[380px]">
              {isLoadingLesson ? (
                <div className="flex flex-col items-center justify-center h-64 text-xs font-mono text-indigo-400 gap-3">
                  <span className="h-6 w-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Agent 3 crafting custom lesson, code, citations & courses...</span>
                </div>
              ) : currentLesson ? (
                <>
                  {activeTab === "lesson" && (
                    <div className="space-y-4 text-sm text-zinc-300 leading-relaxed max-h-[420px] overflow-y-auto pr-2">
                      <div className="whitespace-pre-line">{currentLesson.content_markdown}</div>
                    </div>
                  )}

                  {activeTab === "code" && (
                    <div className="space-y-4">
                      {currentLesson.practical_examples && currentLesson.practical_examples.length > 0 ? (
                        currentLesson.practical_examples.map((ex, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                              <span className="font-mono font-medium text-white">{ex.title}</span>
                              <span className="text-[11px] bg-zinc-800 px-2 py-0.5 rounded font-mono">
                                {ex.language || "code"}
                              </span>
                            </div>
                            <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
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
                    <div className="space-y-3">
                      {currentLesson.citations && currentLesson.citations.length > 0 ? (
                        currentLesson.citations.map((c, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white">{c.title}</span>
                              <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                                {c.source_type}
                              </span>
                            </div>
                            {c.snippet && <p className="text-xs text-zinc-400 mt-2">{c.snippet}</p>}
                            {c.url && (
                              <a
                                href={c.url.startsWith("http") ? c.url : `https://${c.url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-indigo-400 hover:underline mt-2 inline-block font-mono"
                              >
                                Source Link ↗
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
                    <div className="space-y-3">
                      {currentLesson.recommended_courses && currentLesson.recommended_courses.length > 0 ? (
                        currentLesson.recommended_courses.map((course, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-white">{course.title}</h4>
                              <p className="text-xs text-zinc-400 mt-0.5">{course.platform} · Level: {course.level}</p>
                            </div>
                            {course.url && (
                              <a
                                href={course.url.startsWith("http") ? course.url : `https://${course.url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-all"
                              >
                                View ↗
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
            <div className="pt-4 mt-6 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Ready to advance?</span>
              <button
                onClick={() => alert("Topic marked completed! Advancing along your trajectory.")}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
              >
                Mark Complete & Advance →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Agent Architecture Explanation */}
      <section id="agents" className="py-16 border-t border-zinc-800 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-mono tracking-widest text-indigo-400">
              The Multi-Agent Engine
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white mt-1">
              Hierarchical 3-Agent Tree Architecture
            </h2>
            <p className="text-zinc-400 text-sm mt-2">
              Each layer of your learning plan is constructed and delivered by a specialized AI agent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-mono font-bold mb-4">
                A1
              </div>
              <h3 className="font-semibold text-white text-base">Agent 1: Roadmap Structure Agent</h3>
              <p className="text-xs font-mono text-zinc-500 mt-1">Root Planner</p>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                Ingests your domain, syllabus outline, and total allocated days. Generates the master chronological sequence of daily learning objectives (Day 1 ... Day N).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="h-9 w-9 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-mono font-bold mb-4">
                A2
              </div>
              <h3 className="font-semibold text-white text-base">Agent 2: Daily Structure Agent</h3>
              <p className="text-xs font-mono text-zinc-500 mt-1">Curriculum Designer</p>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                Takes a given day from Agent 1 and breaks it down into discrete subtopics (Topic 1 ... Topic N) with calculated time budgets matching your daily hours.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold mb-4">
                A3
              </div>
              <h3 className="font-semibold text-white text-base">Agent 3: Daily Teacher Agent</h3>
              <p className="text-xs font-mono text-zinc-500 mt-1">Pedagogy & Resource Curator</p>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                Delivers comprehensive instruction, runnable code examples, verified citations (papers, textbooks), and curated online courses for each topic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-500">
        <p>© 2026 Roadmap.ai. Intelligent Hierarchical Multi-Agent Learning Engine.</p>
      </footer>
    </div>
  );
}
