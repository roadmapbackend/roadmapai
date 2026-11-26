"use client";

import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getTopicByIdFromSupabase,
  updateTopicStatusInSupabase,
  consumeTokensInDb,
  assertUserTokenBudget,
  TokenQuotaExceededError,
} from "@/lib/supabase-roadmap";
import {
  CONFIDENCE_LABEL,
  DIMENSIONS,
  MASTERY_TARGET,
  MOVES,
  calibrationGap,
  emptyState,
  type Confidence,
  type Dimension,
  type Move,
  type SocraticState,
  type Verdict,
} from "@/lib/socratic";
import { parseUsage } from "@/lib/usage";
import { cn } from "@/lib/utils";
import { showTelemetryToast } from "@/components/ui/telemetry-toast";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Check, Loader2, RotateCcw } from "@/components/ui/icons";
import { MasterclassViewer } from "@/components/masterclass-viewer";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  move?: Move;
  confidence?: Confidence;
  verdict?: Verdict;
  isNudge?: boolean;
}

interface TopicInfo {
  title: string;
  description: string;
  domain: string;
  skillLevel: string;
  day: number;
  minutes: number;
  roadmapId: string | null;
  completed: boolean;
}

type Action = "start" | "answer" | "switch" | "nudge";

const VERDICT_LABEL: Record<Verdict, string> = {
  strong: "Held up",
  partial: "Partly",
  weak: "Did not hold",
  off_topic: "Not graded",
};
const VERDICT_VARIANT: Record<Verdict, "emerald" | "amber" | "rose" | "secondary"> = {
  strong: "emerald",
  partial: "amber",
  weak: "rose",
  off_topic: "secondary",
};
const CLAIM_DOT = { solid: "bg-emerald-500", shaky: "bg-amber-500", wrong: "bg-rose-500" } as const;
const CLAIM_LABEL = { solid: "Survived a test", shaky: "Not proven yet", wrong: "Contradicted" } as const;

/** Rough size of each request, only to check there is room for it */
const TOKENS: Record<Action, number> = { start: 1800, answer: 2800, switch: 2500, nudge: 2200 };

function ClassroomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = params?.id as string;
  const storageKey = `roadmap_socratic_${topicId}`;

  const [userId, setUserId] = useState<string | null>(null);
  const [topic, setTopic] = useState<TopicInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<SocraticState>(emptyState);
  const [mastered, setMastered] = useState(false);
  const [input, setInput] = useState("");
  const [confidence, setConfidence] = useState<Confidence>(2);
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<{ message: string; action: Action; move?: Move } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (
      action: Action,
      ctx: { topic: TopicInfo; userId: string; state: SocraticState; messages: ChatMessage[] },
      extra: { message?: string; confidence?: Confidence; move?: Move } = {}
    ): Promise<boolean> => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setBusy(action);
      setError(null);

      try {
        await assertUserTokenBudget(ctx.userId, TOKENS[action]);
        const res = await fetch("/api/socratic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            action,
            topicTitle: ctx.topic.title,
            topicDescription: ctx.topic.description,
            domain: ctx.topic.domain,
            skillLevel: ctx.topic.skillLevel,
            message: extra.message,
            confidence: extra.confidence,
            requestedMove: extra.move,
            state: ctx.state,
            history: ctx.messages.map(({ role, content }) => ({ role, content })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "The Socratic AI did not respond.");
        if (controller.signal.aborted) return false;

        const stamp = Date.now();
        const log = [...ctx.messages];
        if (action === "answer") {
          log.push({
            id: `u-${stamp}`,
            role: "user",
            content: extra.message ?? "",
            confidence: extra.confidence,
            verdict: data.verdict ?? undefined,
          });
        }
        log.push({ id: `a-${stamp}`, role: "assistant", content: data.reply, move: data.move, isNudge: action === "nudge" });
        setMessages(log);
        setState(data.state);

        if (data.passed) {
          setMastered(true);
          await updateTopicStatusInSupabase(topicId, "completed");
        }
        await consumeTokensInDb(ctx.userId, parseUsage(data.usage), "Agent 3: Socratic Examiner");
        return true;
      } catch (err) {
        if (controller.signal.aborted) return false;
        const message = err instanceof Error ? err.message : "The Socratic AI did not respond.";
        if (err instanceof TokenQuotaExceededError) {
          showTelemetryToast({ type: "error", title: "Monthly limit reached", message });
        }
        setError({ message, action, move: extra.move });
        return false;
      } finally {
        if (requestRef.current === controller) setBusy(null);
      }
    },
    [topicId]
  );

  // Load the topic, then resume the saved session or open a new one
  useEffect(() => {
    let active = true;

    async function init() {
      if (!topicId) return;
      const {
        data: { user },
      } = await createClient().auth.getUser();
      if (!active) return;
      if (!user) {
        router.push(`/login?redirectedFrom=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }

      const saved = await getTopicByIdFromSupabase(topicId);
      if (!active) return;
      const roadmap = saved?.roadmap_days?.roadmaps;
      const title = saved?.title || searchParams.get("title") || "First-Principles Conceptual Inquiry";
      const info: TopicInfo = {
        title: title.replace(/^Topic\s+\d+:\s*/i, ""),
        description: saved?.description || searchParams.get("desc") || "",
        domain: roadmap?.domain_context || searchParams.get("domain") || "General Knowledge",
        skillLevel: roadmap?.skill_level || "intermediate",
        day: saved?.roadmap_days?.day_number || Number(searchParams.get("day")) || 1,
        minutes: saved?.estimated_minutes || Number(searchParams.get("minutes")) || 30,
        roadmapId: roadmap?.id ?? null,
        completed: saved?.status === "completed",
      };
      setUserId(user.id);
      setTopic(info);
      setMastered(info.completed);

      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (stored?.userId === user.id && stored.messages?.length > 0) {
          setMessages(stored.messages);
          setState({ ...emptyState(), ...stored.state });
          return;
        }
      } catch {
        // unreadable session: start fresh
      }
      await send("start", { topic: info, userId: user.id, state: emptyState(), messages: [] });
    }

    init();
    return () => {
      active = false;
      requestRef.current?.abort();
    };
  }, [topicId, searchParams, router, send, storageKey]);

  // Keep the session on this device, so a refresh does not lose progress
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ userId, messages: messages.slice(-40), state }));
    } catch {
      // storage full or blocked
    }
  }, [userId, messages, state, storageKey]);

  useEffect(() => {
    const el = scrollRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy, error]);

  const ctx = topic && userId ? { topic, userId, state, messages } : null;

  const submit = async () => {
    const message = input.trim();
    if (!ctx || busy || !message) return;
    // The draft is cleared only once it has been graded
    if (await send("answer", ctx, { message, confidence })) setInput("");
  };

  const retry = () => {
    if (!ctx || !error || busy) return;
    if (error.action === "answer") submit();
    else send(error.action, ctx, { move: error.move });
  };

  const restart = () => {
    if (!ctx || busy) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // nothing saved
    }
    setMessages([]);
    setState(emptyState());
    setInput("");
    send("start", { ...ctx, state: emptyState(), messages: [] });
  };

  const overall = Math.round(Object.values(state.mastery).reduce((a, b) => a + b, 0) / 4);
  const gap = calibrationGap(state);
  const lastMove = state.move;
  const started = messages.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-clip transition-colors duration-200">
      <div className="fixed top-0 inset-x-0 h-32 sm:h-36 pointer-events-none z-40 bg-gradient-to-b from-background via-background/70 to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)]" />

      <main className="pt-32 sm:pt-36 lg:pt-40 pb-16 max-w-[1420px] 2xl:max-w-[1460px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Card className="mb-8 p-6 idle-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-[-0.02em] [word-spacing:0.1em]">
              {topic?.title ?? "Loading topic"}
            </CardTitle>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Socratic AI{topic && `, day ${topic.day}, ${topic.minutes} min`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {mastered && (
              <Badge variant="emerald" className="gap-1">
                <Check className="size-3" />
                Mastered
              </Badge>
            )}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold tabular-nums">{overall}% mastered</div>
            </div>
            <Progress
              value={overall}
              indicatorClassName="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500"
              className="h-2 w-28 sm:w-36"
            />
            <Link href={topic?.roadmapId ? `/workspace?id=${topic.roadmapId}&topic=${topicId}` : "/workspace"}>
              <Button variant="outline" size="sm">Exit</Button>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* What the examiner thinks you believe */}
          <aside className="order-2 lg:order-1 lg:col-span-4 xl:col-span-3 lg:sticky lg:top-36 space-y-6">
            <section>
              <h2 className="pb-2.5 border-b border-border text-base font-semibold font-sans! tracking-normal!">
                Understanding
              </h2>
              <dl className="mt-3 space-y-3">
                {(Object.keys(DIMENSIONS) as Dimension[]).map((d) => (
                  <div key={d}>
                    <div className="flex justify-between text-xs">
                      <dt>{DIMENSIONS[d]}</dt>
                      <dd className="font-mono tabular-nums text-muted-foreground">{state.mastery[d]}</dd>
                    </div>
                    <div className="relative mt-1.5 h-1.5 rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-700",
                          state.mastery[d] >= MASTERY_TARGET ? "bg-emerald-500" : "bg-orange-500"
                        )}
                        style={{ width: `${state.mastery[d]}%` }}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute -inset-y-0.5 w-px bg-foreground/50"
                        style={{ left: `${MASTERY_TARGET}%` }}
                      />
                    </div>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Pass every line with no contradicted ideas to master this topic.
              </p>
            </section>

            <section>
              <h2 className="pb-2.5 border-b border-border text-base font-semibold font-sans! tracking-normal!">
                Your beliefs
              </h2>
              {state.claims.length === 0 ? (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Ideas you state will appear here, and each one gets tested.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {state.claims.map((c) => (
                    <li key={c.id} className="rounded-lg border border-border bg-card p-3">
                      <p className="flex gap-2 text-xs leading-relaxed">
                        <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", CLAIM_DOT[c.status])} />
                        <span className={c.status === "wrong" ? "line-through decoration-rose-500/60" : undefined}>{c.text}</span>
                      </p>
                      <p className="mt-1.5 pl-4 text-[11px] leading-relaxed text-muted-foreground">
                        {CLAIM_LABEL[c.status]}
                        {c.note && `: ${c.note}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {gap !== null && (
              <section>
                <h2 className="pb-2.5 border-b border-border text-base font-semibold font-sans! tracking-normal!">
                  Confidence check
                </h2>
                <p className="mt-3 text-xs leading-relaxed">
                  {gap > 0.2
                    ? "You are surer than your answers justify. Slow down on the ones that feel easy."
                    : gap < -0.2
                    ? "You know more than you think. Trust your reasoning a little more."
                    : "Your confidence matches how right you are."}
                </p>
              </section>
            )}
          </aside>

          {/* The session */}
          <Card className="idle-card order-1 lg:order-2 lg:col-span-8 xl:col-span-9 flex h-[calc(100svh-18.5rem)] min-h-[540px] flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
              <span className="text-sm text-muted-foreground">
                {lastMove ? `Challenge: ${MOVES[lastMove].label}` : "Preparing a challenge"}
              </span>
              <Button variant="ghost" size="sm" onClick={restart} disabled={!ctx || busy !== null || !started} className="gap-1.5">
                <RotateCcw className="size-3.5" />
                Restart
              </Button>
            </div>

            <div ref={scrollRef} data-lenis-prevent aria-live="polite" className="flex-1 space-y-5 overflow-y-auto px-5 py-5 scrollbar-thin">
              {messages.map((m) =>
                m.role === "assistant" ? (
                  <div key={m.id} className="max-w-3xl">
                    {m.move && (
                      <Badge variant="orange" className="mb-2">
                        {m.isNudge ? "Nudge" : MOVES[m.move].label}
                      </Badge>
                    )}
                    <div className="text-sm leading-relaxed">
                      <MasterclassViewer markdown={m.content} />
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="ml-auto w-fit max-w-[85%]">
                    <p className="whitespace-pre-line rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed">
                      {m.content}
                    </p>
                    <div className="mt-1.5 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                      {m.confidence && CONFIDENCE_LABEL[m.confidence]}
                      {m.verdict && <Badge variant={VERDICT_VARIANT[m.verdict]}>{VERDICT_LABEL[m.verdict]}</Badge>}
                    </div>
                  </div>
                )
              )}

              {busy && (
                <p className="flex items-center gap-2.5 text-xs font-mono text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-orange-500" />
                  {busy === "answer" ? "Testing your reasoning..." : busy === "nudge" ? "Finding a nudge..." : "Building a challenge..."}
                </p>
              )}

              {error && !busy && (
                <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1">{error.message}</span>
                  <Button variant="outline" size="sm" onClick={retry}>Try again</Button>
                </div>
              )}

              {mastered && started && !busy && (
                <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
                  <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  This topic is marked as completed. You can keep going for practice.
                </p>
              )}
            </div>

            <div className="space-y-3 border-t border-border px-5 py-4">
              <div role="group" aria-label="Change the challenge" className="flex flex-wrap gap-1.5">
                {(Object.keys(MOVES) as Move[]).map((move) => (
                  <button
                    key={move}
                    type="button"
                    title={MOVES[move].hint}
                    disabled={!ctx || busy !== null || !started}
                    onClick={() => ctx && send("switch", ctx, { move })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-default",
                      move === lastMove
                        ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {MOVES[move].label}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  rows={3}
                  maxLength={4000}
                  aria-label="Your answer"
                  placeholder="Commit to an answer and say why..."
                  disabled={!started || busy === "answer"}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/40 disabled:opacity-60"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div role="radiogroup" aria-label="How sure are you?" className="inline-flex rounded-full border border-border p-0.5">
                    {([1, 2, 3] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        role="radio"
                        aria-checked={confidence === level}
                        onClick={() => setConfidence(level)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs transition-colors cursor-pointer",
                          confidence === level ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {CONFIDENCE_LABEL[level]}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!ctx || busy !== null || !started}
                      onClick={() => ctx && send("nudge", ctx)}
                    >
                      Nudge me
                    </Button>
                    <Button type="submit" variant="orange" size="sm" disabled={!ctx || busy !== null || !input.trim()} className="gap-1.5">
                      Commit
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function ClassroomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="size-8 text-orange-500 animate-spin" />
        </div>
      }
    >
      <ClassroomContent />
    </Suspense>
  );
}
