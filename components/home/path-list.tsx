import React from "react";
import Link from "next/link";
import type { RoadmapSummary } from "@/lib/supabase-roadmap";
import { cn } from "@/lib/utils";

const isSample = (r: RoadmapSummary) => r.id.startsWith("demo-");

// "14-Day Intensive: Distributed Systems" reads better as just the subject here
const subject = (r: RoadmapSummary) => r.title.replace(/^\d+-Day\s+\w+:\s*/i, "");

/** Each path as a line, filled as far as the learner has walked */
export function PathList({ roadmaps, signedIn }: { roadmaps: RoadmapSummary[]; signedIn: boolean }) {
  return (
    <ul className="space-y-3">
      {roadmaps.map((r) => {
        const progress = Math.max(0, Math.min(100, Math.round(r.progress_percentage || 0)));
        const target = `/workspace?id=${r.id}`;
        return (
          <li key={r.id}>
            <Link
              href={signedIn ? target : `/login?redirectedFrom=${encodeURIComponent(target)}`}
              className="group -mx-3 block rounded-xl px-3 py-4 transition-colors hover:bg-foreground/[0.05] focus-visible:outline-2 focus-visible:outline-orange-500"
            >
              <span className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 text-lg font-semibold text-foreground">
                  {subject(r)}
                  {isSample(r) && <span className="ml-2 text-sm font-normal text-muted-foreground">Sample</span>}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{progress}%</span>
              </span>

              <span aria-hidden="true" className="relative mt-4 block h-4">
                <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-foreground/15" />
                <span
                  className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-saffron"
                  style={{ width: `${progress}%` }}
                />
                <span className="absolute left-0 top-1/2 size-3 -translate-y-1/2 rounded-full bg-saffron" />
                <span
                  className={cn(
                    "absolute right-0 top-1/2 size-3 -translate-y-1/2 rounded-full border-2",
                    progress === 100 ? "border-emerald bg-emerald" : "border-foreground/30 bg-background"
                  )}
                />
                {progress > 0 && progress < 100 && (
                  <span
                    className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-saffron bg-background transition-transform group-hover:scale-125"
                    style={{ left: `${progress}%` }}
                  />
                )}
              </span>

              <span className="mt-2.5 block text-sm text-muted-foreground">
                {r.total_days} days, {r.daily_hours_commitment} hours a day
                {r.total_topics_count ? `, ${r.completed_topics_count ?? 0} of ${r.total_topics_count} topics done` : ""}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
