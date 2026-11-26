"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getUserRoadmaps,
  deleteRoadmap,
  RoadmapSummary,
} from "@/lib/supabase-roadmap";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  Layers,
  Sparkles,
} from "@/components/ui/icons";
import { TiltedCard } from "@/components/react-bits";
import { TelemetryConfirmDialog } from "@/components/ui/telemetry-confirm-dialog";
import { showTelemetryToast } from "@/components/ui/telemetry-toast";
import { startPath } from "@/components/create-roadmap-dialog";
import { usePageTransition } from "@/components/page-transition";

/** Built-in examples, shown until there is something saved */
const isSample = (r: RoadmapSummary) => r.id.startsWith("demo-");

function progressNote(r: RoadmapSummary): string {
  const total = r.total_topics_count ?? 0;
  const done = r.completed_topics_count ?? 0;
  if (total === 0) return "Ready to start";
  if (done >= total) return "All topics done";
  return `${done} of ${total} topics done`;
}

// Longest the greeting waits for a name before going straight to the roadmaps
const NAME_WAIT_MS = 2500;

function getMetadataName(
  user: { user_metadata?: Record<string, unknown> } | null
): string {
  const meta = user?.user_metadata;
  const name = meta?.full_name || meta?.name || meta?.first_name;
  return typeof name === "string" ? name.trim() : "";
}

export default function StudioPage() {
  const { transitionTo } = usePageTransition();
  const supabase = createClient();

  // User & Data State
  const [currentUser, setCurrentUser] = useState<any>(null);
  // null until we know who is here, so the greeting never shows a placeholder name
  const [userName, setUserName] = useState<string | null>(null);
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Animation Stage Machine
  // 1. "greeting": Hey [Name] + Welcome to the studio (~2.55s)
  // 2. "question": "What are we doing today?" (2s)
  // 3. "repertoire": The roadmaps grid
  const [stage, setStage] = useState<"greeting" | "question" | "repertoire">("greeting");
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);

  // Animation timers tracking ref to prevent leaks or zombie stage triggers
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);
  // Set once the intro is skipped, so a late-arriving name cannot restart it
  const introDismissedRef = useRef(false);
  const nameReady = userName !== null;
  const [alwaysSkip, setAlwaysSkip] = useState<boolean>(false);

  // 1. Fetch User and Roadmaps with Safety Timeout & Instant Data Resolution
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Guarantee that after 2.5 seconds, the loading spinner is dismissed no matter what
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoadingData(false);
      }
    }, 2500);

    async function loadStudioData() {
      try {
        setIsLoadingData(true);

        // The saved session is stored in the browser, so the name is available
        // without waiting on the network. Display only: getUser() below verifies it.
        const { data: sessionData } = await supabase.auth.getSession();
        if (!isMounted) return;
        const sessionUser = sessionData?.session?.user ?? null;
        const sessionName = getMetadataName(sessionUser);
        if (!sessionUser) setUserName("there");
        else if (sessionName) setUserName(sessionName);

        const { data: authData } = await supabase.auth.getUser();
        if (!isMounted) return;

        const user = authData?.user ?? null;
        setCurrentUser(user);

        if (user && !sessionName) {
          let resolvedName = getMetadataName(user);

          if (!resolvedName) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .maybeSingle();
            if (!isMounted) return;
            resolvedName = profile?.full_name?.trim() || "";
          }

          if (!resolvedName && user.email) {
            const emailPrefix = user.email.split("@")[0].replace(/[._-]/g, " ");
            resolvedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          }

          setUserName(resolvedName || "there");
        }

        // Fetch User's Roadmaps directly without slow nested Promise.all loops
        const rawRoadmaps = await getUserRoadmaps(user ? user.id : "guest");
        if (!isMounted) return;

        setRoadmaps(rawRoadmaps);
      } catch (err) {
        console.warn("Studio data loading notice:", err);
      } finally {
        clearTimeout(safetyTimer);
        setIsLoadingData(false);
      }
    }

    loadStudioData();

    // Listen to Supabase auth state change events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setUserName("there");
        loadStudioData();
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        loadStudioData();
      }
    });

    const handleAuthEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!isMounted) return;
      if (customEvent.detail?.event === "SIGNED_OUT") {
        setCurrentUser(null);
        setUserName("there");
      }
      loadStudioData();
    };

    window.addEventListener("roadmap-auth-state-changed", handleAuthEvent);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
      window.removeEventListener("roadmap-auth-state-changed", handleAuthEvent);
    };
  }, []);

  // Cancellation function to purge all active animation timeouts and prevent zombie stage transitions
  const clearAllAnimationTimers = useCallback(() => {
    animationTimersRef.current.forEach((t) => clearTimeout(t));
    animationTimersRef.current = [];
    setGreetingVisible(false);
    setWelcomeVisible(false);
    setQuestionVisible(false);
  }, []);

  // Skip current intro sequence completely and permanently cancel all pending timers
  const handleSkipIntro = useCallback(() => {
    introDismissedRef.current = true;
    clearAllAnimationTimers();
    setStage("repertoire");
  }, [clearAllAnimationTimers]);

  // Persist skip preference in localStorage store and jump immediately to repertoire
  const handleAlwaysSkipIntro = useCallback(() => {
    introDismissedRef.current = true;
    clearAllAnimationTimers();
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("roadmap_always_skip_studio_intro", "true");
      }
      setAlwaysSkip(true);
    } catch {
      // ignore
    }
    setStage("repertoire");
    showTelemetryToast({
      type: "info",
      title: "Saved",
      message: "Studio will open straight to your paths.",
    });
  }, [clearAllAnimationTimers]);

  // Toggle stored always-skip preference from studio cockpit header
  const handleToggleAlwaysSkip = useCallback(() => {
    try {
      const next = !alwaysSkip;
      if (typeof window !== "undefined") {
        localStorage.setItem("roadmap_always_skip_studio_intro", next ? "true" : "false");
      }
      setAlwaysSkip(next);
      showTelemetryToast({
        type: "info",
        title: next ? "Greeting off" : "Greeting on",
        message: next
          ? "Studio will open straight to your paths."
          : "It will play on your next visit.",
      });
    } catch {
      // ignore
    }
  }, [alwaysSkip]);

  // Restore and replay the cinematic intro animation
  const handleRestoreIntro = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("roadmap_always_skip_studio_intro");
      }
      setAlwaysSkip(false);
    } catch {
      // ignore
    }

    clearAllAnimationTimers();
    setGreetingVisible(false);
    setWelcomeVisible(false);
    setQuestionVisible(false);
    setStage("greeting");

    // Stage 1: Hey [Name] blurs in at 100ms
    const t1 = setTimeout(() => {
      setGreetingVisible(true);
    }, 100);

    // Welcome to the studio blurs in at 500ms
    const t2 = setTimeout(() => {
      setWelcomeVisible(true);
    }, 500);

    // Hey [Name] and Welcome blur out after ~2.55s
    const t3 = setTimeout(() => {
      setGreetingVisible(false);
      setWelcomeVisible(false);
    }, 2550);

    // Stage 2: "What are we doing today?" blurs in at 3.05s
    const t4 = setTimeout(() => {
      setStage("question");
      setQuestionVisible(true);
    }, 3050);

    // "What are we doing today?" stays for 2.0s, then blurs out at 5.05s
    const t5 = setTimeout(() => {
      setQuestionVisible(false);
    }, 5050);

    // Stage 3: Transition to Repertoire at 5.45s
    const t6 = setTimeout(() => {
      setStage("repertoire");
    }, 5450);

    animationTimersRef.current = [t1, t2, t3, t4, t5, t6];
  }, [clearAllAnimationTimers]);

  // 2. Cinematic Animation Sequence Timer (Respects stored always-skip & registers in timer ref)
  useEffect(() => {
    // Check if user has chosen to always skip intro animation in store
    try {
      if (typeof window !== "undefined" && localStorage.getItem("roadmap_always_skip_studio_intro") === "true") {
        introDismissedRef.current = true;
        setAlwaysSkip(true);
        setStage("repertoire");
        return;
      }
    } catch {
      // ignore
    }

    if (introDismissedRef.current) return;

    // Hold the greeting until the name is known; if it never arrives, skip the intro
    if (!nameReady) {
      animationTimersRef.current = [setTimeout(handleSkipIntro, NAME_WAIT_MS)];
      return () => {
        clearAllAnimationTimers();
      };
    }

    // Stage 1: Hey [Name] blurs in at 100ms
    const t1 = setTimeout(() => {
      setGreetingVisible(true);
    }, 100);

    // Welcome to the studio blurs in at 500ms
    const t2 = setTimeout(() => {
      setWelcomeVisible(true);
    }, 500);

    // Hey [Name] and Welcome blur out after ~2.55s
    const t3 = setTimeout(() => {
      setGreetingVisible(false);
      setWelcomeVisible(false);
    }, 2550);

    // Stage 2: "What are we doing today?" blurs in at 3.05s
    const t4 = setTimeout(() => {
      setStage("question");
      setQuestionVisible(true);
    }, 3050);

    // "What are we doing today?" stays for 2.0s, then blurs out at 5.05s
    const t5 = setTimeout(() => {
      setQuestionVisible(false);
    }, 5050);

    // Stage 3: Transition to Repertoire at 5.45s
    const t6 = setTimeout(() => {
      setStage("repertoire");
    }, 5450);

    animationTimersRef.current = [t1, t2, t3, t4, t5, t6];

    return () => {
      clearAllAnimationTimers();
    };
  }, [nameReady, clearAllAnimationTimers, handleSkipIntro]);

  // Keyboard shortcut to skip intro animation immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        if (stage !== "repertoire") {
          handleSkipIntro();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, handleSkipIntro]);

  // Delete Roadmap Confirmation Dialog State
  const [roadmapToDelete, setRoadmapToDelete] = useState<RoadmapSummary | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const requestDeleteRoadmap = (roadmap: RoadmapSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRoadmapToDelete(roadmap);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roadmapToDelete) return;
    const id = roadmapToDelete.id;
    const title = roadmapToDelete.title;
    setDeletingId(id);

    try {
      const success = await deleteRoadmap(id);
      if (success) {
        setRoadmaps((prev) => prev.filter((r) => r.id !== id));
        showTelemetryToast({
          type: "success",
          title: "Path deleted",
          message: `"${title}" is gone.`,
        });
      } else {
        showTelemetryToast({
          type: "error",
          title: "Could not delete",
          message: "The path is still there. Please try again.",
        });
      }
    } catch (err: any) {
      showTelemetryToast({
        type: "error",
        title: "Could not delete",
        message: err.message || "Please try again.",
      });
    } finally {
      setDeletingId(null);
      setRoadmapToDelete(null);
      setConfirmDialogOpen(false);
    }
  };

  // Handle roadmap selection: takes user back to where they stopped
  const handleSelectRoadmap = (roadmapId: string) => {
    transitionTo(`/workspace?id=${roadmapId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden selection:bg-orange-500/30 selection:text-orange-950 dark:selection:text-orange-100 transition-colors duration-200">
      {/* Subtle Atmospheric Diffused Lighting Pools */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-orange-500/8 via-transparent to-transparent blur-[160px] rounded-full z-0 opacity-60 dark:opacity-80" />
      <div className="pointer-events-none fixed top-1/2 -left-48 w-[450px] h-[450px] bg-white/[0.02] blur-[160px] rounded-full z-0 opacity-40 dark:opacity-60" />

      {/* Top Header Blur Fade Mask */}
      <div className="fixed top-0 inset-x-0 h-32 sm:h-36 pointer-events-none z-40 bg-gradient-to-b from-background via-background/70 to-transparent backdrop-blur-xl transition-all duration-300 [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)]" />

      {/* =========================================================================
          ANIMATION STAGE 1: GREETING ("Hey [Name]" + "Welcome to the studio")
          ========================================================================= */}
      {stage === "greeting" && (
        <section className="min-h-screen flex flex-col items-center justify-center pb-16 sm:pb-24 px-6 relative z-30 select-none">
          <div className="text-center max-w-4xl mx-auto space-y-4 -translate-y-6 sm:-translate-y-10">
            {/* 1. Hey "name from the db" */}
            <h1
              className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-display tracking-[-0.03em] text-foreground transition-all duration-700 ease-out ${
                greetingVisible
                  ? "opacity-100 blur-0 translate-y-0"
                  : "opacity-0 blur-xl translate-y-6"
              }`}
            >
              Hey{userName ? ` ${userName}` : ""}
            </h1>

            {/* 2. Welcome to the studio (right after and below) */}
            <p
              className={`text-xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-medium text-muted-foreground tracking-tight transition-all duration-700 ease-out ${
                welcomeVisible
                  ? "opacity-100 blur-0 translate-y-0"
                  : "opacity-0 blur-lg translate-y-4"
              }`}
            >
              Welcome to the studio
            </p>
          </div>

          {/* Discreet Skip Controls */}
          <div className="absolute bottom-8 sm:bottom-10 right-6 sm:right-10 flex flex-wrap items-center justify-end gap-2.5 z-40">
            <button
              type="button"
              onClick={handleAlwaysSkipIntro}
              className="text-[11px] font-mono text-muted-foreground hover:text-orange-500 transition-colors uppercase tracking-wider px-3 py-1.5 rounded-lg border border-border/60 hover:border-orange-500/40 bg-card/60 backdrop-blur-md hover:bg-muted/40 cursor-pointer"
              title="Remember preference and always skip intro in future"
            >
              Always Skip Intro
            </button>
            <button
              type="button"
              onClick={handleSkipIntro}
              className="text-[11px] font-mono text-foreground hover:text-orange-500 transition-colors uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-border/80 hover:border-orange-500/50 bg-card/80 backdrop-blur-md hover:bg-muted/60 cursor-pointer font-bold shadow-sm"
            >
              Skip Intro →
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          ANIMATION STAGE 2: QUESTION ("What are we doing today?")
          ========================================================================= */}
      {stage === "question" && (
        <section className="min-h-screen flex flex-col items-center justify-center pb-16 sm:pb-24 px-6 relative z-30 select-none">
          <div className="text-center max-w-4xl mx-auto -translate-y-6 sm:-translate-y-10">
            <h2
              className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display tracking-[-0.03em] text-foreground transition-all duration-700 ease-out ${
                questionVisible
                  ? "opacity-100 blur-0 translate-y-0"
                  : "opacity-0 blur-xl translate-y-6"
              }`}
            >
              What are we doing today?
            </h2>
          </div>

          {/* Discreet Skip Controls */}
          <div className="absolute bottom-8 sm:bottom-10 right-6 sm:right-10 flex flex-wrap items-center justify-end gap-2.5 z-40">
            <button
              type="button"
              onClick={handleAlwaysSkipIntro}
              className="text-[11px] font-mono text-muted-foreground hover:text-orange-500 transition-colors uppercase tracking-wider px-3 py-1.5 rounded-lg border border-border/60 hover:border-orange-500/40 bg-card/60 backdrop-blur-md hover:bg-muted/40 cursor-pointer"
              title="Remember preference and always skip intro in future"
            >
              Always Skip Intro
            </button>
            <button
              type="button"
              onClick={handleSkipIntro}
              className="text-[11px] font-mono text-foreground hover:text-orange-500 transition-colors uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-border/80 hover:border-orange-500/50 bg-card/80 backdrop-blur-md hover:bg-muted/60 cursor-pointer font-bold shadow-sm"
            >
              Skip Intro →
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          STAGE 3: THE STUDIO REPERTOIRE (ROADMAP MATRIX)
          ========================================================================= */}
      {stage === "repertoire" && (
        <main className="pt-32 sm:pt-36 lg:pt-40 pb-24 max-w-[1420px] 2xl:max-w-[1460px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-20 animate-in fade-in duration-700">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border dark:border-white/10 mb-10">
            <div>
              <div className="inline-flex items-center mb-2 font-mono text-xs text-orange-600 dark:text-orange-400 font-semibold tracking-wider uppercase">
                <span>Studio</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.04em] text-foreground font-display">
                What are we doing today?
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl font-mono">
                Choose a path and pick up right where you stopped.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Restore / Replay Intro Button */}
              <button
                type="button"
                onClick={handleRestoreIntro}
                className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border/80 dark:border-white/10 bg-card dark:bg-[#121418] hover:border-orange-500/50 text-xs font-mono text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm select-none group"
                title="Play the greeting again"
              >
                <Sparkles className="size-3.5 text-orange-500 group-hover:rotate-12 transition-transform" />
                <span>Replay intro</span>
              </button>

              {/* Always Skip Intro Preference Toggle */}
              <button
                type="button"
                onClick={handleToggleAlwaysSkip}
                className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border/80 dark:border-white/10 bg-card dark:bg-[#121418] hover:border-orange-500/50 text-xs font-mono text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm select-none"
                title={
                  alwaysSkip
                    ? "The greeting is skipped. Click to play it on your next visit."
                    : "Click to skip the greeting from now on."
                }
              >
                <span>{alwaysSkip ? "Skip intro: on" : "Skip intro: off"}</span>
              </button>

              <Button
                variant="orange"
                size="sm"
                onClick={() => startPath()}
                className="font-mono text-xs uppercase tracking-wider font-bold h-10 px-5 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
                <span>Start a path</span>
              </Button>
            </div>
          </div>

          {/* Roadmaps Grid */}
          {isLoadingData ? (
            <div className="py-24 text-center rounded-2xl bg-card dark:bg-[#121418] border border-border dark:border-white/10 p-12">
              <Loader2 className="size-8 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-xs font-mono text-muted-foreground tracking-wider">
                Loading your paths
              </p>
            </div>
          ) : roadmaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {roadmaps.map((r) => {
                const progress = r.progress_percentage || 0;

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRoadmap(r.id)}
                    className="cursor-pointer group block w-full h-full text-left"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectRoadmap(r.id);
                      }
                    }}
                  >
                    <TiltedCard maxAngle={3} scale={1.01} showGlare={false} className="w-full h-full">
                      <div className="rounded-2xl bg-card dark:bg-[#0b0d10] border border-border dark:border-white/10 group-hover:border-foreground/40 dark:group-hover:border-white/30 flex flex-col justify-between h-full min-h-[240px] p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-200">
                        <div>
                          {/* Top Meta */}
                          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-4">
                            <span className="uppercase tracking-wider text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                              {r.domain_archetype?.replace(/_/g, " ") || "Path"}
                              {isSample(r) && <span className="ml-2 text-muted-foreground">Sample</span>}
                            </span>
                            <div className="flex items-center gap-2">
                              <span>{r.total_days}d · {r.daily_hours_commitment}h/day</span>
                              {!isSample(r) && (
                                <button
                                  type="button"
                                  onClick={(e) => requestDeleteRoadmap(r, e)}
                                  disabled={deletingId === r.id}
                                  className="text-muted-foreground/50 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                                  title="Delete path"
                                  aria-label={`Delete ${r.title}`}
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-xl font-bold text-foreground group-hover:text-orange-500 transition-colors font-display tracking-tight leading-snug line-clamp-2">
                            {r.title}
                          </h3>

                          {/* Subtitle */}
                          <p className="text-xs text-muted-foreground font-mono mt-2 truncate">
                            {progressNote(r)}
                          </p>
                        </div>

                        {/* Bottom: Progress + Action */}
                        <div className="mt-8 pt-4 border-t border-border/60 dark:border-white/10 flex items-center justify-between">
                          <span className="text-xs font-mono text-muted-foreground">
                            {progress}% done
                          </span>
                          <div className="text-xs font-mono text-foreground font-semibold flex items-center gap-1.5 group-hover:text-orange-500 transition-colors">
                            <span>{isSample(r) ? "Look around" : "Continue"}</span>
                            <ArrowRight className="size-3.5 stroke-[2] group-hover:translate-x-1 transition-transform text-orange-500" />
                          </div>
                        </div>
                      </div>
                    </TiltedCard>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="py-20 text-center rounded-2xl bg-card dark:bg-[#090b0e] border border-border dark:border-white/10 p-8 max-w-xl mx-auto">
              <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                <Layers className="size-6" />
              </div>
              <h2 className="text-xl font-bold font-display text-foreground">
                No paths yet
              </h2>
              <p className="text-xs font-mono text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                Pick a subject and the time you have, and Daari will lay out the way.
              </p>
              <div className="mt-6">
                <Button variant="orange" size="sm" onClick={() => startPath()} className="font-mono text-xs uppercase tracking-wider font-bold h-10 px-5">
                  <Plus className="size-3.5 mr-2 stroke-[2.5]" />
                  <span>Start a path</span>
                </Button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Confirm Dialog for Roadmap Delete */}
      <TelemetryConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Delete this path?"
        description={
          roadmapToDelete
            ? `"${roadmapToDelete.title}" and everything in it will be deleted: its days, topics, lessons and progress.`
            : ""
        }
        confirmText="Delete path"
        cancelText="Keep it"
        variant="danger"
        isLoading={deletingId !== null}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

