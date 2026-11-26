"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getUserRoadmaps,
  getRoadmapById,
  getOrSaveLessonFromSupabase,
  generateDomainLesson,
  getDomainTopicsForDay,
  generateDomainDays,
  buildSampleDays,
  updateTopicStatusInSupabase,
  RoadmapSummary,
  TokenQuotaExceededError,
} from "@/lib/supabase-roadmap";
import { showTelemetryToast } from "@/components/ui/telemetry-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Loader2,
  ExternalLink,
  ChevronDown,
  Layers,
  ZoomIn,
  ZoomOut,
} from "@/components/ui/icons";
import { RoadmapRail } from "@/components/roadmap-rail";
import { MasterclassViewer } from "@/components/masterclass-viewer";

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

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRoadmapId = searchParams.get("id");
  const queryTopicId = searchParams.get("topic");
  const queryDomain = searchParams.get("domain");
  const queryDays = searchParams.get("days");
  const queryHours = searchParams.get("hours");

  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Active roadmap & portfolio state
  const [userRoadmaps, setUserRoadmaps] = useState<RoadmapSummary[]>([]);
  const [currentRoadmap, setCurrentRoadmap] = useState<any>(null);
  const [roadmapDays, setRoadmapDays] = useState<DayNode[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);

  // Navigation & View settings
  const [activeTab, setActiveTab] = useState<string>("lesson");
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(true);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // In-memory 0ms lesson cache
  const lessonCacheRef = useRef<{ [key: string]: LessonData }>({});
  const inFlightLessonRef = useRef<{ [key: string]: boolean }>({});

  // Custom trajectory switcher dropdown state
  const [trajectoryDropdownOpen, setTrajectoryDropdownOpen] = useState(false);
  const trajectoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close custom trajectory dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        trajectoryDropdownRef.current &&
        !trajectoryDropdownRef.current.contains(event.target as Node)
      ) {
        setTrajectoryDropdownOpen(false);
      }
    }
    if (trajectoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [trajectoryDropdownOpen]);

  // Masterclass reading text zoom percentage (default: 100%, range: 85% - 160%)
  const [textZoom, setTextZoom] = useState<number>(100);

  // Sync saved zoom preference from localStorage after client hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem("roadmap_text_zoom");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 85 && parsed <= 160) {
          setTextZoom(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("roadmap_text_zoom", textZoom.toString());
    } catch {}
  }, [textZoom]);

  // 1. Initialize user and roadmap
  useEffect(() => {
    let isMounted = true;

    async function initWorkspace() {
      setIsLoadingRoadmap(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        if (!user) {
          router.push(`/login?redirectedFrom=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }
        setCurrentUser(user);

        const roadmapsList = await getUserRoadmaps(user.id);
        if (!isMounted) return;
        setUserRoadmaps(roadmapsList);

        // Check if custom query params provided
        if (queryDomain) {
          const daysNum = queryDays ? parseInt(queryDays, 10) : 7;
          const hoursNum = queryHours ? parseFloat(queryHours) : 2.0;
          loadCustomDomainRoadmap(queryDomain, daysNum, hoursNum);
          return;
        }

        // Determine which roadmap to open
        let targetId = queryRoadmapId;
        if (!targetId && roadmapsList.length > 0) {
          targetId = roadmapsList[0].id;
        }

        if (targetId) {
          await loadRoadmap(targetId, user ? user.id : "guest");
        } else {
          loadDefaultGuestRoadmap();
        }
      } catch (err) {
        console.warn("Workspace initialization notice:", err);
        loadDefaultGuestRoadmap();
      } finally {
        if (isMounted) setIsLoadingRoadmap(false);
      }
    }

    initWorkspace();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT" || !session?.user) {
        router.push(`/login?redirectedFrom=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }
    });

    const handleAuthEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!isMounted) return;
      if (customEvent.detail?.event === "SIGNED_OUT") {
        router.push(`/login?redirectedFrom=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }
    };

    window.addEventListener("roadmap-auth-state-changed", handleAuthEvent);

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      window.removeEventListener("roadmap-auth-state-changed", handleAuthEvent);
    };
  }, [queryRoadmapId, queryTopicId, queryDomain, queryDays, queryHours, router, supabase]);

  function loadCustomDomainRoadmap(domain: string, totalDays: number = 7, dailyHours: number = 2.0) {
    const days = generateDomainDays(domain, totalDays);
    const mockDays: DayNode[] = days.map((d, idx) => ({
      id: `custom-day-${d.day_number}`,
      day_number: d.day_number,
      title: d.title,
      description: d.description,
      learning_objectives: d.learning_objectives,
      status: idx === 0 ? "in_progress" : "not_started",
      topics: getDomainTopicsForDay(domain, dailyHours, d.day_number, d.title, d.learning_objectives, d.description).map((t) => ({
        id: `custom-day-${d.day_number}-topic-${t.topic_number}`,
        topic_number: t.topic_number,
        title: t.title,
        description: t.description,
        estimated_minutes: t.estimated_minutes,
        status: idx === 0 && t.topic_number === 1 ? "in_progress" : "not_started",
      })),
    }));

    const customMeta: RoadmapSummary = {
      id: "custom-active",
      user_id: "guest",
      title: `${totalDays}-Day Intensive: ${domain}`,
      domain_context: domain,
      total_days: totalDays,
      daily_hours_commitment: dailyHours,
      skill_level: "intermediate",
      status: "active",
      progress_percentage: 0,
      created_at: new Date().toISOString(),
      days_count: totalDays,
    };

    setCurrentRoadmap(customMeta);
    setRoadmapDays(mockDays);

    if (mockDays.length > 0) {
      setSelectedDayId(mockDays[0].id);
      if (mockDays[0].topics.length > 0) {
        const firstT = mockDays[0].topics[0];
        setSelectedTopicId(firstT.id);
        fetchLesson(firstT.id, firstT.title, {
          domainCtx: domain,
          topicDesc: firstT.description,
          estimatedMinutes: firstT.estimated_minutes,
          dailyHours: dailyHours,
          skillLevel: "intermediate",
          dayNumber: mockDays[0].day_number,
          totalDays: totalDays,
        });
      }
    }
  }

  function loadDefaultGuestRoadmap() {
    const days = generateDomainDays("Distributed Systems & Consensus Engines", 7);
    const mockDays: DayNode[] = days.map((d, idx) => ({
      id: `guest-day-${d.day_number}`,
      day_number: d.day_number,
      title: d.title,
      description: d.description,
      learning_objectives: d.learning_objectives,
      status: idx === 0 ? "in_progress" : "not_started",
      topics: getDomainTopicsForDay("Distributed Systems & Consensus Engines", 2.0, d.day_number, d.title, d.learning_objectives, d.description, "intermediate").map((t) => ({
        id: `guest-day-${d.day_number}-topic-${t.topic_number}`,
        topic_number: t.topic_number,
        title: t.title,
        description: t.description,
        estimated_minutes: t.estimated_minutes,
        status: idx === 0 && t.topic_number === 1 ? "in_progress" : "not_started",
      })),
    }));

    setCurrentRoadmap({
      id: "guest-default",
      title: "7-Day Intensive: Distributed Systems & Consensus Engines",
      domain_context: "Distributed Systems & Consensus Engines",
      total_days: 7,
      daily_hours_commitment: 2.0,
      skill_level: "intermediate",
      status: "active",
    });
    setRoadmapDays(mockDays);

    if (mockDays.length > 0) {
      setSelectedDayId(mockDays[0].id);
      if (mockDays[0].topics.length > 0) {
        const firstT = mockDays[0].topics[0];
        setSelectedTopicId(firstT.id);
        fetchLesson(firstT.id, firstT.title, {
          domainCtx: "Distributed Systems & Consensus Engines",
          topicDesc: firstT.description,
          estimatedMinutes: firstT.estimated_minutes,
          dailyHours: 2.0,
          skillLevel: "intermediate",
          dayNumber: mockDays[0].day_number,
          totalDays: 7,
        });
      }
    }
  }

  async function loadRoadmap(roadmapId: string, userId: string) {
    if (roadmapId.startsWith("demo-")) {
      const demoList = await getUserRoadmaps("guest");
      const matched = demoList.find((d) => d.id === roadmapId) || demoList[0];
      const mockDays: DayNode[] = buildSampleDays({ ...matched, id: roadmapId });

      setCurrentRoadmap(matched);
      setRoadmapDays(mockDays);
      const startDay = mockDays.find((d) => d.topics.some((t) => t.id === queryTopicId)) ?? mockDays[0];
      const startTopic = startDay?.topics.find((t) => t.id === queryTopicId) ?? startDay?.topics[0];
      if (startDay && startTopic) {
        setSelectedDayId(startDay.id);
        setSelectedTopicId(startTopic.id);
        fetchLesson(startTopic.id, startTopic.title, {
          domainCtx: matched.domain_context,
          topicDesc: startTopic.description,
          estimatedMinutes: startTopic.estimated_minutes,
          dailyHours: matched.daily_hours_commitment,
          skillLevel: matched.skill_level,
          dayNumber: startDay.day_number,
          totalDays: matched.total_days,
        });
      }
      return;
    }

    try {
      const result = await getRoadmapById(roadmapId);
      if (result && result.roadmap) {
        setCurrentRoadmap(result.roadmap);
        setRoadmapDays(result.days as DayNode[]);
        if (result.days.length > 0) {
          // Find where user stopped: first topic with status !== 'completed'
          let resumeDay = result.days[0];
          let resumeTopic = resumeDay.topics && resumeDay.topics.length > 0 ? resumeDay.topics[0] : null;

          dayLoop: for (const day of result.days) {
            if (day.topics && day.topics.length > 0) {
              for (const topic of day.topics) {
                if (topic.status !== "completed") {
                  resumeDay = day;
                  resumeTopic = topic;
                  break dayLoop;
                }
              }
            }
          }

          // A link to a specific topic wins over resuming
          const linkedDay = result.days.find((d) => d.topics?.some((t) => t.id === queryTopicId));
          if (linkedDay) {
            resumeDay = linkedDay;
            resumeTopic = linkedDay.topics.find((t) => t.id === queryTopicId) ?? resumeTopic;
          }

          setSelectedDayId(resumeDay.id);
          if (resumeTopic) {
            setSelectedTopicId(resumeTopic.id);
            fetchLesson(resumeTopic.id, resumeTopic.title, {
              domainCtx: result.roadmap.domain_context,
              topicDesc: resumeTopic.description,
              estimatedMinutes: resumeTopic.estimated_minutes,
              dailyHours: result.roadmap.daily_hours_commitment,
              skillLevel: result.roadmap.skill_level,
              dayNumber: resumeDay.day_number,
              totalDays: result.roadmap.total_days,
            });
          }
        }
      } else {
        loadDefaultGuestRoadmap();
      }
    } catch (e) {
      console.warn("Failed loading roadmap by id:", e);
      loadDefaultGuestRoadmap();
    }
  }

  // 2. Fetch Lesson with 0ms in-memory cache
  async function fetchLesson(
    topicId: string, 
    topicTitle: string, 
    options?: {
      domainCtx?: string;
      topicDesc?: string;
      estimatedMinutes?: number;
      dailyHours?: number;
      skillLevel?: string;
      dayNumber?: number;
      totalDays?: number;
    }
  ) {
    if (!topicId) return;

    // Zero-latency cache hit (only for authentic non-generic lessons)
    if (lessonCacheRef.current[topicId]) {
      const cached = lessonCacheRef.current[topicId];
      const isCachedGeneric =
        !cached.content_markdown ||
        cached.content_markdown.includes("In this institutional module on") ||
        cached.content_markdown.includes("Foundational Invariants: Rather than treating") ||
        cached.content_markdown.includes("Pre-Execution Audit: Enumerate all initial assumptions") ||
        cached.content_markdown.includes("Pre-Flight Input Audit") ||
        cached.content_markdown.includes("Superficial Pattern Transfer");
      if (!isCachedGeneric) {
        setCurrentLesson(cached);
        return;
      }
    }

    if (inFlightLessonRef.current[topicId]) return;
    inFlightLessonRef.current[topicId] = true;

    setIsLoadingLesson(true);
    const domain = options?.domainCtx || currentRoadmap?.domain_context || "Computer Science";
    const lessonOptions = {
      topicDesc: options?.topicDesc || "",
      dailyHours: options?.dailyHours || currentRoadmap?.daily_hours_commitment || 2.0,
      skillLevel: options?.skillLevel || currentRoadmap?.skill_level || "intermediate",
      estimatedMinutes: options?.estimatedMinutes,
      dayNumber: options?.dayNumber,
      totalDays: options?.totalDays || currentRoadmap?.total_days || 7,
    };

    try {
      const lesson = await getOrSaveLessonFromSupabase(topicId, topicTitle, domain, lessonOptions);
      const isGeneric =
        !lesson.content_markdown ||
        lesson.content_markdown.includes("In this institutional module on") ||
        lesson.content_markdown.includes("Foundational Invariants: Rather than treating") ||
        lesson.content_markdown.includes("Pre-Flight Input Audit") ||
        lesson.content_markdown.includes("Superficial Pattern Transfer");
      if (!isGeneric) {
        lessonCacheRef.current[topicId] = lesson;
      }
      setCurrentLesson(lesson);
    } catch (err: any) {
      if (
        err instanceof TokenQuotaExceededError ||
        err?.name === "TokenQuotaExceededError" ||
        err?.message?.toLowerCase().includes("ai usage is used up") ||
        err?.message?.toLowerCase().includes("quota")
      ) {
        showTelemetryToast({
          type: "error",
          title: "Monthly limit reached",
          message: err.message || "There isn't enough AI usage left this month.",
        });
      }
      console.warn("Using offline fallback lesson:", err);
      const fallback = generateDomainLesson(topicId, topicTitle, domain, lessonOptions);
      setCurrentLesson(fallback);
    } finally {
      setIsLoadingLesson(false);
      delete inFlightLessonRef.current[topicId];
    }
  }

  const handleSelectTopic = (dayId: string, topic: Topic) => {
    setSelectedDayId(dayId);
    setSelectedTopicId(topic.id);
    const currentDay = roadmapDays.find((d) => d.id === dayId);
    fetchLesson(topic.id, topic.title, {
      domainCtx: currentRoadmap?.domain_context,
      topicDesc: topic.description,
      estimatedMinutes: topic.estimated_minutes,
      dailyHours: currentRoadmap?.daily_hours_commitment,
      skillLevel: currentRoadmap?.skill_level,
      dayNumber: currentDay?.day_number,
      totalDays: currentRoadmap?.total_days,
    });
  };

  const handleToggleTopicCompleted = async (topicId: string, dayId: string) => {
    setRoadmapDays((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        const updatedTopics = day.topics.map((t) => {
          if (t.id === topicId) {
            const nextStatus = t.status === "completed" ? "not_started" : "completed";
            return { ...t, status: nextStatus as any };
          }
          return t;
        });
        const allCompleted = updatedTopics.every((t) => t.status === "completed");
        const anyCompleted = updatedTopics.some((t) => t.status === "completed" || t.status === "in_progress");
        return {
          ...day,
          status: allCompleted ? "completed" : anyCompleted ? "in_progress" : "not_started",
          topics: updatedTopics,
        };
      })
    );

    if (currentUser && !topicId.startsWith("guest-") && !topicId.startsWith("demo-") && !topicId.startsWith("custom-")) {
      try {
        const { data: current } = await supabase.from("roadmap_topics").select("status").eq("id", topicId).single();
        const nextStatus = current?.status === "completed" ? "not_started" : "completed";
        await updateTopicStatusInSupabase(topicId, nextStatus as any);
      } catch (e) {
        console.warn("Topic completion sync notice:", e);
      }
    }
  };

  const totalTopics = roadmapDays.reduce((acc, d) => acc + (d.topics?.length || 0), 0);
  const completedTopics = roadmapDays.reduce(
    (acc, d) => acc + (d.topics?.filter((t) => t.status === "completed").length || 0),
    0
  );
  const selectedDay = roadmapDays.find((d) => d.id === selectedDayId);
  const selectedTopic = selectedDay?.topics.find((t) => t.id === selectedTopicId);
  const selectedLabel = selectedDay && selectedTopic ? `Day ${selectedDay.day_number}, topic ${selectedTopic.topic_number}` : "Lesson";
  const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden selection:bg-orange-500/30 selection:text-orange-950 dark:selection:text-orange-100 transition-colors duration-200">
      {/* Progressive Gradient Blur at Top of Studio - Seamlessly fades into clear content */}
      <div className="fixed top-0 inset-x-0 h-32 sm:h-36 pointer-events-none z-40 bg-gradient-to-b from-background via-background/70 to-transparent backdrop-blur-xl transition-all duration-300 [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)]" />

      {/* Main Workspace Layout - Scaled safely between left/right fixed navbars */}
      <main className="pt-32 sm:pt-36 lg:pt-40 pb-16 max-w-[1420px] 2xl:max-w-[1460px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Trajectory Switcher Bar */}
        {userRoadmaps.length > 1 && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-2.5 relative" ref={trajectoryDropdownRef}>
              <span className="text-sm text-muted-foreground">Path</span>

              {/* Bespoke Trajectory Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setTrajectoryDropdownOpen((open) => !open)}
                className="bg-card dark:bg-[#121418] border border-border/80 dark:border-white/10 hover:border-orange-500/50 rounded-xl px-3.5 py-1.5 text-xs font-mono font-medium text-foreground transition-all cursor-pointer flex items-center gap-2.5 shadow-xs group"
                aria-haspopup="listbox"
                aria-expanded={trajectoryDropdownOpen}
              >
                <Layers className="size-3.5 text-orange-500" />
                <span className="font-semibold truncate max-w-[220px] sm:max-w-[320px]">
                  {currentRoadmap?.title || "Choose a path"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  {currentRoadmap?.total_days || 7}d
                </span>
                <ChevronDown
                  className={`size-3.5 text-muted-foreground transition-transform duration-200 group-hover:text-foreground ${
                    trajectoryDropdownOpen ? "rotate-180 text-orange-500" : ""
                  }`}
                />
              </button>

              {/* Bespoke Trajectory Popover Menu */}
              {trajectoryDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-72 sm:w-84 rounded-2xl bg-card/95 dark:bg-[#121418]/95 backdrop-blur-xl border border-border/80 dark:border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95"
                  role="listbox"
                >
                  <div 
                    className="max-h-60 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin"
                    data-lenis-prevent
                  >
                    {userRoadmaps.map((r) => {
                      const isActive = r.id === currentRoadmap?.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            router.push(`/workspace?id=${r.id}`);
                            setTrajectoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                            isActive
                              ? "bg-orange-500/15 text-foreground font-bold border border-orange-500/30"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          }`}
                          role="option"
                          aria-selected={isActive}
                        >
                          <span className="truncate">{r.title}</span>
                          <span className="text-[10px] shrink-0 font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {r.total_days}d
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Metric Bar Card using Shadcn Card */}
        <Card className="mb-8 p-6 idle-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-[-0.02em] [word-spacing:0.1em]">
              {currentRoadmap?.title || "Your path"}
            </CardTitle>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {currentRoadmap?.total_days || 7} days, {currentRoadmap?.daily_hours_commitment || 2} hours a day
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold tabular-nums text-foreground">{completionPercentage}% done</div>
              <div className="text-sm tabular-nums text-muted-foreground">
                {completedTopics} of {totalTopics} topics
              </div>
            </div>
            <div className="w-32 sm:w-44">
              <Progress
                value={completionPercentage}
                indicatorClassName="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500"
                className="h-2"
              />
            </div>
          </div>
        </Card>

        {/* Split View: Left = Compact Architecture Sidebar (3 cols), Right = Ultra-Wide Masterclass Studio (9 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Day Tree - Sticky alongside Masterclass below navbar */}
          <div className="lg:col-span-4 xl:col-span-3 2xl:col-span-3 lg:sticky lg:top-32 xl:top-36 space-y-3 self-start">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <h2 className="text-base font-semibold">Days</h2>
              <span className="text-sm tabular-nums text-muted-foreground">{roadmapDays.length}</span>
            </div>

            <RoadmapRail
              days={roadmapDays}
              label={currentRoadmap?.title || "Roadmap"}
              selectedTopicId={selectedTopicId}
              onSelectTopic={(day, topic) => handleSelectTopic(day.id, topic)}
              onToggleComplete={(day, topic) => handleToggleTopicCompleted(topic.id, day.id)}
              className="max-h-[calc(100vh-190px)] overflow-y-auto pr-1 scrollbar-thin"
            />
          </div>

          {/* Right Column: Agent 3 Masterclass Panel - Ultra-Wide (9 cols) */}
          <div className="lg:col-span-8 xl:col-span-9 2xl:col-span-9 min-w-0">
            <Card className="idle-card p-6 sm:p-8 shadow-xs relative min-h-[700px]">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Header Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedLabel}</span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <TabsList>
                      <TabsTrigger value="lesson">Lesson</TabsTrigger>
                      <TabsTrigger value="code">Code</TabsTrigger>
                      <TabsTrigger value="citations">Citations</TabsTrigger>
                      <TabsTrigger value="courses">Courses</TabsTrigger>
                    </TabsList>

                    {/* Masterclass Text Zoom Controls */}
                    <div className="flex items-center gap-1 bg-muted/60 dark:bg-white/5 border border-border/80 dark:border-white/10 rounded-xl px-1.5 py-1 text-xs font-mono shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTextZoom((prev) => Math.max(85, prev - 15))}
                        disabled={textZoom <= 85}
                        className="size-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Zoom out text (Smaller)"
                        aria-label="Zoom out text"
                      >
                        <ZoomOut className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setTextZoom(100)}
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold text-foreground hover:bg-background/80 dark:hover:bg-white/10 transition-all cursor-pointer select-none"
                        title="Click to reset zoom to 100%"
                      >
                        {textZoom}%
                      </button>

                      <button
                        type="button"
                        onClick={() => setTextZoom((prev) => Math.min(160, prev + 15))}
                        disabled={textZoom >= 160}
                        className="size-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Zoom in text (Larger for easier viewing)"
                        aria-label="Zoom in text"
                      >
                        <ZoomIn className="size-3.5" />
                      </button>
                    </div>

                    {selectedTopicId && (() => {
                      const curDay = roadmapDays.find((d) => d.id === selectedDayId);
                      const curTopic = curDay?.topics.find((t) => t.id === selectedTopicId);
                      const params = new URLSearchParams();
                      if (curTopic?.title) params.set("title", curTopic.title);
                      if (currentRoadmap?.domain_context) params.set("domain", currentRoadmap.domain_context);
                      if (curTopic?.description) params.set("desc", curTopic.description);
                      if (curDay?.day_number) params.set("day", String(curDay.day_number));
                      if (curTopic?.estimated_minutes) params.set("minutes", String(curTopic.estimated_minutes));
                      const queryString = params.toString() ? `?${params.toString()}` : "";
                      return (
                        <Link href={`/classroom/${selectedTopicId}${queryString}`}>
                          <Button variant="orange" size="sm" className="h-8 px-3 text-[11px] flex items-center gap-1 font-mono">
                            <span>Socratic AI</span>
                            <ArrowUpRight className="size-3" />
                          </Button>
                        </Link>
                      );
                    })()}
                  </div>
                </div>

                {/* Lesson Body with Zoom capability */}
                <div 
                  className="mt-6 transition-[zoom] duration-200 origin-top-left"
                  style={{ zoom: textZoom / 100 }}
                >
                  {isLoadingLesson ? (
                    <div className="py-24 text-center">
                      <Loader2 className="size-6 text-orange-500 animate-spin mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Writing your lesson. The first time can take a minute.</p>
                    </div>
                  ) : currentLesson ? (
                    <div>
                      {/* Tab 1: Lesson Markdown */}
                      <TabsContent value="lesson">
                        <div className="max-w-none text-muted-foreground text-sm leading-relaxed">
                          <MasterclassViewer 
                            markdown={currentLesson.content_markdown} 
                            skillLevel={currentRoadmap?.skill_level}
                            dailyHours={currentRoadmap?.daily_hours_commitment}
                            estimatedMinutes={
                              roadmapDays
                                .find((d) => d.id === selectedDayId)
                                ?.topics.find((t) => t.id === selectedTopicId)
                                ?.estimated_minutes
                            }
                          />
                        </div>
                      </TabsContent>

                      {/* Tab 2: Implementation Code */}
                      <TabsContent value="code">
                        <div className="space-y-6">
                          {currentLesson.practical_examples.map((ex, idx) => (
                            <div key={idx} className="rounded-xl border border-border bg-background overflow-hidden shadow-xs">
                              <div className="px-4 py-2.5 bg-card border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="amber" className="text-[10px] py-0 px-2 font-mono">
                                    {ex.language || "CODE"}
                                  </Badge>
                                  <span className="text-xs font-mono font-semibold text-foreground">{ex.title}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(ex.code);
                                    setCopiedCodeIndex(idx);
                                    setTimeout(() => setCopiedCodeIndex(null), 2000);
                                  }}
                                  className="text-[11px] font-mono h-7 px-2.5"
                                >
                                  {copiedCodeIndex === idx ? "✓ Copied" : "Copy Code"}
                                </Button>
                              </div>
                              <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
                                <code>{ex.code}</code>
                              </pre>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      {/* Tab 3: Citations */}
                      <TabsContent value="citations">
                        <div className="space-y-4">
                          {currentLesson.citations.map((cite, idx) => (
                            <Card
                              key={idx}
                              className="idle-card p-4 hover:border-foreground/30 transition-all shadow-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="cyan">
                                  {cite.source_type}
                                </Badge>
                                {cite.url && (
                                  <a
                                    href={cite.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 font-mono"
                                  >
                                    <span>Source</span>
                                    <ExternalLink className="size-3" />
                                  </a>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-foreground mt-2">{cite.title}</h4>
                              {cite.snippet && <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed">{cite.snippet}</p>}
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      {/* Tab 4: Courses */}
                      <TabsContent value="courses">
                        <div className="space-y-4">
                          {currentLesson.recommended_courses.map((course, idx) => {
                            const level = (course.level || "").toLowerCase();
                            const levelVariant = level.includes("beg")
                              ? "emerald"
                              : level.includes("adv")
                              ? "rose"
                              : "amber";

                            return (
                              <Card
                                key={idx}
                                className="idle-card p-4 flex items-center justify-between gap-4 shadow-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="purple">
                                      {course.platform}
                                    </Badge>
                                    <Badge variant={levelVariant}>
                                      {course.level}
                                    </Badge>
                                  </div>
                                  <h4 className="text-sm font-semibold text-foreground mt-2">{course.title}</h4>
                                </div>
                              {course.url && (
                                <a
                                  href={course.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                                    <span>Enroll</span>
                                    <ExternalLink className="size-3" />
                                  </Button>
                                </a>
                              )}
                            </Card>
                          );
                        })}
                        </div>
                      </TabsContent>
                    </div>
                  ) : (
                    <div className="py-24 text-center text-muted-foreground font-mono text-xs">
                      Choose a topic to start.
                    </div>
                  )}
                </div>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-xs">
          Loading your workspace
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}
