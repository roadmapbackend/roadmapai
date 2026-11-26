from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.llm import get_llm
from app.core.guardrails import record_token_usage
from app.tools.roadmap_store import save_topic_lesson
from app.services.db import get_supabase_admin
from app.agents.state import LessonDelivery

def run_daily_teacher_agent(
    user_id: str,
    topic_id: str,
    topic_title: str,
    topic_desc: str,
    domain_context: str,
    daily_hours: float = 2.0,
    estimated_minutes: int = 40,
    skill_level: str = "intermediate"
) -> Dict[str, Any]:
    """
    Agent 3: Daily Teacher Agent (Content Delivery, Pedagogy & Resource Curator)
    Uses live LLM to generate adaptive lessons calibrated to the user's skill level and committed hours.
    """
    supabase = get_supabase_admin()

    # Check database cache first to avoid re-generating (bypass stale generic templates)
    cached = supabase.table("topic_lessons").select("*").eq("topic_id", topic_id).execute()
    if cached.data and len(cached.data) > 0:
        c = cached.data[0]
        md = c.get("content_markdown") or ""
        is_stale_generic = (
            len(md) < 300 or
            "In this institutional module on" in md or
            "Pre-Execution Audit: Enumerate all" in md or
            "Foundational Invariants: Rather than treating" in md or
            "Pre-Flight Input Audit" in md or
            "Superficial Pattern Matching: Applying solutions" in md
        )
        if not is_stale_generic:
            return c

    llm = get_llm(temperature=0.3)
    lesson_data = None
    level = (skill_level or "intermediate").lower()
    minutes = estimated_minutes or int(daily_hours * 60 / 3)

    if llm:
        if daily_hours <= 1.0 or minutes <= 25:
            volume_directive = (
                f"ALLOCATED STUDY TIME: {minutes} minutes ({daily_hours} hr/day - FOCUSED TRACK).\n"
                "Target a concise, crisp, and high-efficiency explanation of ~700-1,000 words. "
                "Provide clear intuition, 1 clean rounded Mermaid diagram, 3 key practical rules, 1 focused code drill, and 1 critical pitfall."
            )
        elif daily_hours <= 3.0 or minutes <= 55:
            volume_directive = (
                f"ALLOCATED STUDY TIME: {minutes} minutes ({daily_hours} hrs/day - BALANCED TRACK).\n"
                "Target a comprehensive explanation of ~1,500-2,200 words balancing concept intuition, "
                "multi-stage rounded Mermaid architecture diagram with subgraphs, operational mechanics, 2 production failure modes, and code drills."
            )
        else:
            volume_directive = (
                f"ALLOCATED STUDY TIME: {minutes} minutes ({daily_hours} hrs/day - INTENSIVE MASTERCLASS TRACK).\n"
                "Deliver an exhaustive, graduate-level masterclass of 2,600-4,000 words with deep first-principles formalisms, "
                "LaTeX math, multi-plane architecture diagram, 3+ failure modes, and enterprise-grade implementation test harnesses."
            )

        lower_ctx = f"{domain_context} {topic_title}".lower()
        is_gaming = any(k in lower_ctx for k in ["bgmi", "pubg", "battlegrounds", "valorant", "csgo", "counter-strike", "fortnite", "apex", "cod", "call of duty", "warzone", "gaming", "esports", "fps", "battle royale"])
        is_sports = any(k in lower_ctx for k in ["football", "soccer", "basketball", "tennis", "cricket", "boxing", "mma", "swimming", "running", "gym", "workout", "fitness", "bodybuilding", "yoga"])
        is_music = any(k in lower_ctx for k in ["guitar", "piano", "violin", "drums", "music", "singing", "vocals", "harmony"])

        discipline_directive = ""
        if is_gaming:
            discipline_directive = (
                "DISCIPLINE CONTEXT: COMPETITIVE GAMING & ESPORTS\n"
                "PERSONA & PEDAGOGY: Elite Tier-1 Esports Head Coach & Tournament Veteran.\n"
                "Teach authentic gameplay mastery of the game itself: HUD controls, gyroscope & finger sensitivity, "
                "crosshair centering, spray pull-down & recoil patterns, weapon loadouts & utility (grenades, smokes), "
                "map rotations, compound sieges, and high-pressure clutch decisions. DO NOT teach game engine programming or computer science!"
            )
        elif is_sports:
            discipline_directive = (
                "DISCIPLINE CONTEXT: ATHLETICS, SPORTS & BIOMECHANICS\n"
                "PERSONA & PEDAGOGY: Elite Sports Biomechanist & Conditioning Coach.\n"
                "Teach kinetic chain alignment, posture, movement economy, progressive drills, and injury prevention."
            )
        elif is_music:
            discipline_directive = (
                "DISCIPLINE CONTEXT: MUSIC & INSTRUMENTAL CRAFT\n"
                "PERSONA & PEDAGOGY: Master Conservatory Instructor.\n"
                "Teach instrument ergonomics, tone extraction, finger dexterity, chord transitions, and metronome timing."
            )

        system_prompt = (
            "You are the universal Daily Teacher Agent (Agent 3) for Daari. "
            "Your mandate is to deliver an adaptive educational module calibrated to the user's committed time and experience level.\n\n"
            f"{discipline_directive}\n"
            f"LEARNER EXPERIENCE LEVEL: {level.upper()}\n"
            f"{volume_directive}\n\n"
            "CRITICAL PEDAGOGICAL PROGRESSION:\n"
            "1. INTUITIVE INTRODUCTION & MENTAL MODEL: Start with the 'why', core challenge, and intuitive foundational concept.\n"
            "2. CORE MECHANICS & SYSTEMATIC BREAKDOWN: Deconstruct step-by-step techniques with at least one complete rounded Mermaid diagram (```mermaid\\ngraph TD\\n...```).\n"
            "3. REAL-WORLD PITFALLS & BLUNDERS: Detail common mistakes practitioners make, with root causes and corrective steps.\n"
            "4. SOCRATIC VERIFICATION: Diagnostic self-check questions testing mastery.\n"
            "5. PRACTICAL DRILLS / PROTOCOL: Structured practice routine, training drills, setup guide, or code with comments.\n"
            "6. CITATIONS & COURSES: Discipline-appropriate authoritative guides, pro VODs, textbooks, or accredited courses.\n"
            "Return valid JSON matching the LessonDelivery schema."
        )
        human_prompt = (
            f"Domain / Field: {domain_context}\n"
            f"Topic Title: {topic_title}\n"
            f"Topic Description: {topic_desc}\n"
            f"Allocated Study Time: {minutes} minutes ({daily_hours} hrs/day, {level} level)\n\n"
            f"Deliver an authentic, discipline-appropriate lesson for {topic_title} in {domain_context} matching this exact time budget and learner level."
        )

        try:
            structured_llm = llm.with_structured_output(LessonDelivery)
            response: LessonDelivery = structured_llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ])
            lesson_data = {
                "content_markdown": response.content_markdown,
                "practical_examples": [ex.model_dump() if hasattr(ex, "model_dump") else ex for ex in response.practical_examples],
                "citations": [c.model_dump() if hasattr(c, "model_dump") else c for c in response.citations],
                "recommended_courses": [rc.model_dump() if hasattr(rc, "model_dump") else rc for rc in response.recommended_courses]
            }
        except Exception as err:
            print(f"[Agent 3] LLM invocation error (falling back): {err}")

    # Domain-aware fallback if LLM is rate-limited (429) or offline
    if not lesson_data:
        from app.agents.domain_templates import generate_domain_lesson
        lesson_data = generate_domain_lesson(
            topic_title=topic_title,
            domain_context=domain_context,
            topic_desc=topic_desc
        )

    saved_lesson = save_topic_lesson(
        topic_id=topic_id,
        content_markdown=lesson_data["content_markdown"],
        practical_examples=lesson_data["practical_examples"],
        citations=lesson_data["citations"],
        recommended_courses=lesson_data["recommended_courses"]
    )

    record_token_usage(user_id=user_id, prompt_tokens=780, completion_tokens=620, agent_name="DailyTeacherAgent")
    return saved_lesson
