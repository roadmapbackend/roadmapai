"use client";

import React, { useState } from "react";
import { buildSampleDays, getFeaturedDemoRoadmaps, type SupabaseDay } from "@/lib/supabase-roadmap";
import { RoadmapRail } from "@/components/roadmap-rail";

// The same planner output the app uses, so what people see here is what they get
const SAMPLE = getFeaturedDemoRoadmaps().find((r) => r.id === "demo-2")!;

/** A working plan: days open, topics can be ticked. Nothing is saved. */
export function SamplePlan() {
  const [days, setDays] = useState<SupabaseDay[]>(() => buildSampleDays(SAMPLE));
  const [selected, setSelected] = useState<string | null>(() => days[0]?.topics[0]?.id ?? null);

  return (
    <figure>
      <RoadmapRail
        days={days}
        label="Sample plan for classical guitar"
        selectedTopicId={selected}
        onSelectTopic={(_day, topic) => setSelected(topic.id)}
        onToggleComplete={(day, topic) =>
          setDays((prev) =>
            prev.map((d) =>
              d.id !== day.id
                ? d
                : {
                    ...d,
                    topics: d.topics.map((t) =>
                      t.id === topic.id ? { ...t, status: t.status === "completed" ? "not_started" : "completed" } : t
                    ),
                  }
            )
          )
        }
      />
      <figcaption className="mt-4 text-sm text-muted-foreground">
        A {SAMPLE.total_days}-day plan for classical guitar. Try it: open a day, pick a topic.
      </figcaption>
    </figure>
  );
}
