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
    domain_context: str
) -> Dict[str, Any]:
    """
    Agent 3: Daily Teacher Agent (Content Delivery, Pedagogy & Resource Curator)
    Uses live LLM to generate in-depth lessons, code examples, verified citations, and course recommendations.
    """
    supabase = get_supabase_admin()

    # Check database cache first to avoid re-generating
    cached = supabase.table("topic_lessons").select("*").eq("topic_id", topic_id).execute()
    if cached.data and len(cached.data) > 0:
        return cached.data[0]

    llm = get_llm(temperature=0.3)
    lesson_data = None

    if llm:
        system_prompt = (
            "You are the universal Daily Teacher Agent for Roadmap.ai. "
            "Your objective is to provide a comprehensive, master-class technical or conceptual lesson for ANY subject "
            "(computer science, mathematics, music, physics, biology, literature, arts, languages, business, etc.). "
            "You must return:\n"
            "1. `content_markdown`: In-depth, well-structured Markdown tutorial containing:\n"
            "   - Conceptual Framework & Mental Models (foundational intuition and domain invariants)\n"
            "   - Technical / Theoretical Breakdown (mechanics, principles, or formulas)\n"
            "   - Step-by-Step Practical Methodology (how to execute or apply this knowledge)\n"
            "   - Best Practices, Edge Cases & Common Pitfalls\n"
            "2. `practical_examples`: Concrete, applied implementation:\n"
            "   - For programming/technical subjects: Complete, working, commented code snippet.\n"
            "   - For non-programming subjects (music, languages, sciences, arts, business): A concrete, hands-on applied exercise, worked problem, study protocol, or case study with `language` set appropriately (e.g. 'text', 'markdown', 'python', 'music').\n"
            "3. `citations`: 2-3 genuine, verified citation sources (seminal textbooks, academic papers, official specifications, RFCs, authoritative manuals).\n"
            "4. `recommended_courses`: 2-3 top-rated real courses or academic lecture series (Coursera, edX, MIT OpenCourseWare, Stanford, etc.) specifically relevant to this topic.\n"
            "Return valid JSON matching the LessonDelivery schema."
        )
        human_prompt = (
            f"Subject: {domain_context}\n"
            f"Topic Title: {topic_title}\n"
            f"Topic Description: {topic_desc}\n\n"
            f"Deliver an authoritative, comprehensive lesson, practical exercises, verified citations, and course recommendations for {topic_title} in {domain_context}."
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
