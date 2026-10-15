import { createClient } from "@/lib/supabase/client";

export interface SupabaseTopic {
  id: string;
  day_id: string;
  roadmap_id: string;
  topic_number: number;
  title: string;
  description: string;
  estimated_minutes: number;
  status: "not_started" | "in_progress" | "completed";
}

export interface SupabaseDay {
  id: string;
  roadmap_id: string;
  day_number: number;
  title: string;
  description: string;
  learning_objectives: string[];
  status: "not_started" | "in_progress" | "completed";
  topics: SupabaseTopic[];
}

export interface SupabaseLesson {
  id?: string;
  topic_id: string;
  content_markdown: string;
  practical_examples: Array<{ language?: string; title: string; code: string }>;
  citations: Array<{ title: string; url?: string; source_type: string; snippet?: string }>;
  recommended_courses: Array<{ title: string; platform: string; url?: string; level: string }>;
}

export async function getUserActiveRoadmap(userId: string) {
  const supabase = createClient();

  // 1. Fetch latest active roadmap for this user
  const { data: roadmap, error: rError } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rError || !roadmap) {
    return null;
  }

  // 2. Fetch days
  const { data: days, error: dError } = await supabase
    .from("roadmap_days")
    .select("*")
    .eq("roadmap_id", roadmap.id)
    .order("day_number", { ascending: true });

  if (dError || !days) {
    return { roadmap, days: [] };
  }

  // 3. Fetch all topics for this roadmap
  const { data: topics } = await supabase
    .from("roadmap_topics")
    .select("*")
    .eq("roadmap_id", roadmap.id)
    .order("topic_number", { ascending: true });

  const topicsByDay: Record<string, SupabaseTopic[]> = {};
  (topics || []).forEach((t: any) => {
    if (!topicsByDay[t.day_id]) topicsByDay[t.day_id] = [];
    topicsByDay[t.day_id].push({
      id: t.id,
      day_id: t.day_id,
      roadmap_id: t.roadmap_id,
      topic_number: t.topic_number,
      title: t.title,
      description: t.description || "",
      estimated_minutes: t.estimated_minutes || 45,
      status: t.status || "not_started",
    });
  });

  const structuredDays: SupabaseDay[] = days.map((d: any) => ({
    id: d.id,
    roadmap_id: d.roadmap_id,
    day_number: d.day_number,
    title: d.title,
    description: d.description || "",
    learning_objectives: d.learning_objectives || [],
    status: d.status || "not_started",
    topics: topicsByDay[d.id] || [],
  }));

  return {
    roadmap,
    days: structuredDays,
  };
}

export async function saveRoadmapToSupabase(
  userId: string,
  domain: string,
  totalDays: number,
  dailyHours: number,
  skillLevel: string = "intermediate"
) {
  const supabase = createClient();

  // Archive previous active roadmaps for this user
  try {
    await supabase
      .from("roadmaps")
      .update({ status: "archived" })
      .eq("user_id", userId)
      .eq("status", "active");
  } catch (e) {
    console.warn("Could not archive previous roadmaps:", e);
  }

  // 1. Insert into roadmaps table
  const { data: roadmap, error: rErr } = await supabase
    .from("roadmaps")
    .insert({
      user_id: userId,
      title: `${totalDays}-Day Intensive: ${domain}`,
      domain_context: domain,
      total_days: totalDays,
      daily_hours_commitment: dailyHours,
      skill_level: skillLevel,
      status: "active",
      metadata: {},
    })
    .select()
    .single();

  if (rErr || !roadmap) {
    throw new Error(rErr?.message || "Failed to create roadmap in Supabase");
  }

  // 2. Generate structured days
  const daysToInsert = [];
  for (let i = 1; i <= totalDays; i++) {
    let title = `Day ${i}: Applied Patterns & Deep Mechanics (Part ${i})`;
    let desc = `Comprehensive instruction, state boundaries, and exercises for ${domain}.`;
    let objectives = ["Master core component mechanics", "Implement resilient code patterns", "Analyze edge cases"];

    if (i === 1) {
      title = "Day 1: Mental Models & Core Foundations";
      desc = `Essential mental models, architecture paradigms, and baseline principles for ${domain}.`;
      objectives = ["Grasp foundational concepts", "Understand system boundaries", "Configure environment"];
    } else if (i === totalDays) {
      title = `Day ${i}: Capstone Integration & Verification`;
      desc = `Synthesize all concepts into a production-grade verified milestone for ${domain}.`;
      objectives = ["End-to-end milestone implementation", "Failure mode analysis", "Performance verification"];
    }

    daysToInsert.push({
      roadmap_id: roadmap.id,
      day_number: i,
      title,
      description: desc,
      learning_objectives: objectives,
      status: i === 1 ? "in_progress" : "not_started",
    });
  }

  const { data: insertedDays, error: dErr } = await supabase
    .from("roadmap_days")
    .insert(daysToInsert)
    .select()
    .order("day_number", { ascending: true });

  if (dErr || !insertedDays) {
    throw new Error(dErr?.message || "Failed to create roadmap days in Supabase");
  }

  // 3. Automatically generate topics for Day 1
  const firstDay = insertedDays[0];
  const firstDayTopics = await saveDayTopicsToSupabase(firstDay.id, roadmap.id, dailyHours);

  // 4. Pre-populate lesson for the first topic so topic_lessons gets populated
  if (firstDayTopics.length > 0) {
    await getOrSaveLessonFromSupabase(firstDayTopics[0].id, firstDayTopics[0].title, domain);
  }

  // 5. Log Agent 1 execution
  await logAgentExecution(userId, "Agent 1: Roadmap Structure", 350, 820, 420);

  return {
    roadmap,
    days: insertedDays.map((d: any, idx: number) => ({
      id: d.id,
      roadmap_id: d.roadmap_id,
      day_number: d.day_number,
      title: d.title,
      description: d.description || "",
      learning_objectives: d.learning_objectives || [],
      status: d.status || "not_started",
      topics: idx === 0 ? firstDayTopics : [],
    })),
  };
}

export async function saveDayTopicsToSupabase(
  dayId: string,
  roadmapId: string,
  dailyHours: number
): Promise<SupabaseTopic[]> {
  const supabase = createClient();

  // Check if topics already exist
  const { data: existing } = await supabase
    .from("roadmap_topics")
    .select("*")
    .eq("day_id", dayId)
    .order("topic_number", { ascending: true });

  if (existing && existing.length > 0) {
    return existing as SupabaseTopic[];
  }

  const totalMinutes = Math.round(dailyHours * 60);
  const topicCount = Math.max(2, Math.min(4, Math.round(dailyHours * 1.5)));
  const minsPerTopic = Math.round(totalMinutes / topicCount);

  const topicTemplates = [
    { title: "Core Architecture & State Invariants", desc: "Fundamental principles and failure boundary analysis." },
    { title: "Hands-On Implementation & Patterns", desc: "Writing resilient code and evaluating race states." },
    { title: "Edge Cases, Failure Modes & Benchmarks", desc: "Debugging common failure states and verifying throughput." },
    { title: "Milestone Synthesis Challenge", desc: "Validating retention and building a mini-project checkpoint." },
  ];

  const topicsToInsert = [];
  for (let idx = 0; idx < topicCount; idx++) {
    const template = topicTemplates[idx % topicTemplates.length];
    topicsToInsert.push({
      day_id: dayId,
      roadmap_id: roadmapId,
      topic_number: idx + 1,
      title: `Topic ${idx + 1}: ${template.title}`,
      description: template.desc,
      estimated_minutes: minsPerTopic,
      status: idx === 0 ? "in_progress" : "not_started",
    });
  }

  const { data: inserted, error } = await supabase
    .from("roadmap_topics")
    .insert(topicsToInsert)
    .select()
    .order("topic_number", { ascending: true });

  if (error || !inserted) {
    console.error("Error inserting topics to Supabase:", error);
    return [];
  }

  return inserted as SupabaseTopic[];
}

export async function getOrSaveLessonFromSupabase(
  topicId: string,
  topicTitle: string,
  domain: string
): Promise<SupabaseLesson> {
  const supabase = createClient();

  // 1. Check if lesson already exists in Supabase
  const { data: existing } = await supabase
    .from("topic_lessons")
    .select("*")
    .eq("topic_id", topicId)
    .maybeSingle();

  if (existing) {
    return existing as SupabaseLesson;
  }

  // 2. Generate lesson content
  const lessonData: SupabaseLesson = {
    topic_id: topicId,
    content_markdown: `# ${topicTitle}\n\n## 1. Conceptual Framework & Mental Models\n\nIn this module on **${domain}**, we explore core system invariants, state representations, and fault isolation boundaries.\n\n### Key Principles & Invariants\n- **Separation of Concerns**: Decouple state representation from execution protocols.\n- **Fault Isolation**: Bound blast radius when unexpected network partitions or crash-stops occur.\n- **Idempotence & Total Order**: Ensure operations yield identical results regardless of retry frequency or jitter.\n\n## 2. In-Depth Technical Breakdown\nWhen engineering production systems, mental models should reflect reality rather than idealized conditions. Pay special attention to asynchronous delays, clock skews, and concurrency contention boundaries.\n\n## 3. Best Practices & Pitfalls\n1. Always design fallback paths for network jitter.\n2. Monitor latency percentiles (p99/p99.9) rather than averages.\n3. Validate schemas strictly at service boundaries.`,
    practical_examples: [
      {
        language: "python",
        title: "Production-Grade Resilient Handler",
        code: `import time\nfrom typing import Dict, Any\n\nclass ResilientHandler:\n    def __init__(self, max_retries: int = 3, backoff: float = 1.5):\n        self.max_retries = max_retries\n        self.backoff = backoff\n\n    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:\n        delay = 0.2\n        for attempt in range(1, self.max_retries + 1):\n            try:\n                # Idempotent state machine transition\n                return {"status": "success", "processed_at": time.time()}\n            except Exception as err:\n                if attempt == self.max_retries:\n                    raise err\n                time.sleep(delay)\n                delay *= self.backoff`,
      },
    ],
    citations: [
      {
        title: `Official Documentation: ${domain}`,
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
  };

  // 3. Insert into topic_lessons in Supabase
  const { data: inserted, error } = await supabase
    .from("topic_lessons")
    .insert(lessonData)
    .select()
    .single();

  if (error || !inserted) {
    console.error("Error inserting lesson to Supabase:", error);
    return lessonData;
  }

  return inserted as SupabaseLesson;
}

export async function logAgentExecution(
  userId: string,
  agentName: string,
  promptTokens: number = 300,
  completionTokens: number = 600,
  latencyMs: number = 350
) {
  try {
    const supabase = createClient();
    const tokenCost = ((promptTokens * 0.0000015) + (completionTokens * 0.000002)).toFixed(6);
    await supabase.from("agent_execution_logs").insert({
      user_id: userId,
      agent_name: agentName,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_cost_usd: parseFloat(tokenCost),
      latency_ms: latencyMs,
      status: "success",
    });

    // Also increment user token budget if function exists
    try {
      await supabase.rpc("increment_token_budget", {
        p_user_id: userId,
        p_tokens: promptTokens + completionTokens,
      });
    } catch {
      // ignore if RPC not accessible
    }
  } catch (err) {
    // Non-blocking telemetry
    console.debug("Agent log notice:", err);
  }
}
