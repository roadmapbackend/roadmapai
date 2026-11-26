"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUsageSummary, type UsageSummary } from "@/lib/supabase-roadmap";
import { PathStop } from "@/components/path";
import { Loader2 } from "@/components/ui/icons";

const number = new Intl.NumberFormat();
const date = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long" });
const plural = (n: number, word: string) => `${number.format(n)} ${word}${n === 1 ? "" : "s"}`;

export function UsagePage() {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await createClient().auth.getUser();
      if (!data.user) {
        router.push(`/login?redirectedFrom=${encodeURIComponent("/billing")}`);
        return;
      }
      setUsage(await getUsageSummary(data.user.id));
      setFailed(false);
    } catch (err) {
      console.warn("Usage could not be loaded:", err);
      setFailed(true);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after the request
    load();
    window.addEventListener("roadmap-tokens-updated", load);
    return () => window.removeEventListener("roadmap-tokens-updated", load);
  }, [load]);

  const percent = usage ? Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100)) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-clip transition-colors duration-200">
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-44 sm:px-10 sm:pt-48">
        <h1 className="mb-16 text-5xl font-black tracking-[-0.03em] sm:text-6xl">Usage</h1>

        {failed ? (
          <p className="text-lg text-muted-foreground">
            Your usage could not be loaded.{" "}
            <button type="button" onClick={load} className="font-semibold text-foreground underline underline-offset-4 cursor-pointer">
              Try again
            </button>
          </p>
        ) : !usage ? (
          <p className="flex items-center gap-2.5 text-lg text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-orange-500" />
            Loading your usage
          </p>
        ) : (
          <>
            <PathStop title="This month">
              <p className="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
                {number.format(usage.used)}
                <span className="text-lg font-normal text-muted-foreground"> of {number.format(usage.limit)} tokens</span>
              </p>
              <div
                role="progressbar"
                aria-label="AI usage this month"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="relative my-6 h-4"
              >
                <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-foreground/15" />
                <span className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-saffron" style={{ width: `${percent}%` }} />
                <span className="absolute left-0 top-1/2 size-3 -translate-y-1/2 rounded-full bg-saffron" />
                <span className="absolute right-0 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-foreground/30 bg-background" />
                <span
                  className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-saffron bg-background"
                  style={{ left: `${Math.max(1, percent)}%` }}
                />
              </div>
              <p>
                {percent}% used.{usage.resetsAt && ` It starts again on ${date.format(usage.resetsAt)}.`}
              </p>
              {percent >= 90 && (
                <p className="text-foreground">
                  You are close to the limit. Lessons you already have stay open; new ones wait until it starts again.
                </p>
              )}
            </PathStop>

            <PathStop title="What you have done with it">
              <p>
                {usage.paths === 0
                  ? "No paths yet."
                  : `${plural(usage.paths, "path")} started and ${plural(usage.topicsDone, "topic")} done.`}
              </p>
            </PathStop>

            <PathStop title="What counts" last>
              <p>
                Tokens are how AI reading and writing is measured. Planning a path, writing a lesson and talking with the
                Socratic AI use them. Opening a lesson again doesn&rsquo;t.
              </p>
              <p>Daari is free for now, and there are no paid plans.</p>
            </PathStop>
          </>
        )}
      </main>
    </div>
  );
}
