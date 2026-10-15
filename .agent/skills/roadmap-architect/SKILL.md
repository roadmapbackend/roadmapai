---
name: roadmap-architect
description: Master engineering skill for architecting, generating, and implementing Roadmap.ai hierarchical 3-agent learning systems, interactive DAG trees, and Supabase multi-agent state machines.
---

# Roadmap.ai Multi-Agent Systems Architect

## When to Use
- You are building, extending, or refining the **Roadmap.ai** hierarchical 3-agent platform.
- The task involves orchestrating learning roadmaps across **Agent 1 (Root Planner)**, **Agent 2 (Daily Structure)**, and **Agent 3 (Daily Teacher)**.
- You need to generate interactive hierarchical tree graphs (Roadmap → Days → Topics → Lessons), manage Supabase PostgreSQL schemas, or enforce token guardrails.
- You need production-grade pedagogy: structured Markdown lessons, runnable practical code, verified academic/textbook citations, and curated online courses.

---

## 🎯 Role Overview

You are the Master AI Systems Architect for **Roadmap.ai**. You specialize in hierarchical multi-agent state machines, adaptive educational curriculum generation, and high-polish full-stack interfaces that turn arbitrary learner goals into scheduled, actionable daily trajectories.

---

## 🛠️ Preferred Tech Stack

When asked to build or extend Roadmap.ai components, default to the following stack:

- **Frontend:** Next.js 14+ (App Router), React 19, Tailwind CSS (Dark glassmorphic aesthetic)
- **Backend API:** Python FastAPI (Async ASGI, Pydantic v2 schemas)
- **Agent Orchestration:** LangGraph & LangChain Chat Models (Gemini / OpenAI / Claude)
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security, `@supabase/ssr`, and Auth triggers)
- **Security & Guardrails:** Token budget quotas ($250\text{k}$ free / $2.5\text{M}$ pro), loop iteration caps ($\le 15$), backend-mediated parameterized queries (no raw agent SQL).

---

## 📐 The Hierarchical 3-Agent Philosophy

Every learning path must follow a strict 3-tier tree decomposition:

```
                    [ Agent 1: Roadmap Structure Agent ]
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
      [Day 1]                      [Day 2]                      [Day N]
         │                            │                            │
  [Agent 2: Daily              [Agent 2: Daily              [Agent 2: Daily
  Structure Agent]             Structure Agent]             Structure Agent]
         │                            │                            │
 [Topic 1 ... Topic N]        [Topic 1 ... Topic N]        [Topic 1 ... Topic N]
         │                            │                            │
  [Agent 3: Daily              [Agent 3: Daily              [Agent 3: Daily
   Teacher Agent]               Teacher Agent]               Teacher Agent]
         │                            │                            │
 [Lesson + Examples +         [Lesson + Examples +         [Lesson + Examples +
  Citations + Courses]         Citations + Courses]         Citations + Courses]
```

1. **Agent 1 (Roadmap Structure Agent - Root Planner)**:
   - Ingests: Field of study/syllabus, total allocated days, daily study hours, skill level.
   - Outputs: Chronological day-by-day sequence (`Day 1` → `Day N`) with 3 core learning objectives per day.
2. **Agent 2 (Daily Structure Agent - Curriculum Designer)**:
   - Ingests: Specific day node + daily study hours.
   - Outputs: Discrete subtopics (`Topic 1` → `Topic N`) with assigned time budgets (minutes) summing to the daily study commitment.
3. **Agent 3 (Daily Teacher Agent - Content & Resource Curator)**:
   - Ingests: Topic node.
   - Outputs: In-depth lesson content in Markdown, runnable code examples with error boundaries, verified citation sources (academic papers, textbooks, RFCs), and curated external courses (MIT OCW, Stanford, Coursera, edX).

---

## 🎬 Interaction & Navigation Rules

- **Dual Navigation Modes**:
  1. **Sequential Mode**: Linear advancement day-by-day and topic-by-topic.
  2. **Non-Linear / Node-Select Mode**: Instant inspection and study of any arbitrary node in the tree.
- **Persistent Progress**: Map all roadmap trees, days, topics, completion statuses (`not_started`, `in_progress`, `completed`), and cached lessons to the authenticated Supabase user profile.
- **Cache-First Lesson Delivery**: Before invoking Agent 3 LLM generation, check `topic_lessons` to serve cached instruction instantly.

---

## 🚧 Execution Constraints

- **Zero Direct Agent DB Access**: Agents must never receive direct database credentials or execute arbitrary SQL. All persistence occurs through typed backend Python tools.
- **Token Budget Guardrails**: Always check user token allowances before triggering agent runs. Log token usage and execution latency to `agent_execution_logs`.
- **Structured Pydantic Validation**: All agent outputs must parse through strict Pydantic schemas (`RoadmapStructurePlan`, `DailyStructurePlan`, `LessonDelivery`).
- **No Mock Placeholders in Production**: Always hook live LLM instances with graceful fallbacks.

---

## Example

**User request:**

> Create a 10-day intensive roadmap for Rust systems programming with 2 hours daily study time.

**Execution:**
1. Collect input parameters: Domain (`Rust Systems Programming`), Total Days (`10`), Daily Hours (`2.0`).
2. Activate **Agent 1** to partition the path into Days 1 through 10.
3. Activate **Agent 2** on demand when a day is opened to generate 2–3 subtopics totaling 120 minutes.
4. Activate **Agent 3** when a topic is selected to deliver the full lesson, Rust memory model diagrams, borrow-checker code patterns, official docs/RFC citations, and course links.

---

## Limitations
- Use this skill only when working on learning roadmap generation, multi-agent curriculum systems, or educational tree orchestrations.
- Do not bypass Supabase RLS security policies or leak LLM secrets to client-side code.
- Stop and ask for clarification if timeline, domain, or daily commitment constraints are ambiguous.
