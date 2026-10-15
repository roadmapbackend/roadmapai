from typing import Dict, Any, List
import json
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.llm import get_llm
from app.core.guardrails import record_token_usage
from app.tools.roadmap_store import save_roadmap_and_days
from app.agents.state import RoadmapStructurePlan, DayObjective

def run_roadmap_structure_agent(
    user_id: str,
    domain_context: str,
    total_days: int,
    daily_hours: float,
    skill_level: str = "intermediate"
) -> Dict[str, Any]:
    """
    Agent 1: Roadmap Structure Agent (Root Planner)
    Uses live LLM to partition any syllabus/topic into Day 1 ... Day N objectives.
    """
    llm = get_llm(temperature=0.2)
    days = []

    if llm:
        system_prompt = (
            "You are the universal Roadmap Structure Agent (Root Planner) for Roadmap.ai. "
            "You design world-class, rigorous, chronological learning roadmaps for ANY subject, skill, craft, science, or discipline "
            "(e.g. Computer Science, Music, Organic Chemistry, Kubernetes, Digital Marketing, Quantum Computing, Guitar, Neuroscience, French, etc.). "
            "Given a subject, total days (N), and daily study commitment (H hours/day): "
            "1. Generate an exact N-day sequence (from Day 1 to Day N) tailored specifically to the subject matter. "
            "2. Adapt the depth of daily scope realistically to the learner's allocated daily hours. "
            "3. Structure a progressive learning arc: foundational mental models -> core mechanics & workflows -> intermediate applications -> advanced nuances & diagnostics -> capstone synthesis. "
            "4. Every day must have a distinct, subject-tailored title (e.g. 'Day 1: Harmonic Foundations & Interval Construction'), a detailed description, and exactly 3 concrete, measurable learning objectives. "
            "Return valid JSON matching the RoadmapStructurePlan schema."
        )
        human_prompt = (
            f"Topic / Subject: {domain_context}\n"
            f"Total Duration: {total_days} days\n"
            f"Daily Commitment: {daily_hours} hours/day\n"
            f"Learner Skill Level: {skill_level}\n\n"
            f"Generate a customized, comprehensive {total_days}-day roadmap where each day reflects {daily_hours} hours of study on {domain_context}."
        )

        try:
            structured_llm = llm.with_structured_output(RoadmapStructurePlan)
            response: RoadmapStructurePlan = structured_llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ])
            for d in response.days:
                days.append({
                    "day_number": d.day_number,
                    "title": d.title,
                    "description": d.description,
                    "learning_objectives": d.learning_objectives
                })
        except Exception as err:
            print(f"[Agent 1] LLM invocation error (falling back): {err}")

    # Domain-aware fallback if LLM is rate-limited (429) or offline
    if not days:
        from app.agents.domain_templates import generate_domain_days
        days = generate_domain_days(domain_context=domain_context, total_days=total_days)

    roadmap_title = f"{total_days}-Day Roadmap: {domain_context}"
    saved_data = save_roadmap_and_days(
        user_id=user_id,
        title=roadmap_title,
        domain_context=domain_context,
        total_days=total_days,
        daily_hours=daily_hours,
        skill_level=skill_level,
        days=days
    )

    record_token_usage(user_id=user_id, prompt_tokens=520, completion_tokens=410, agent_name="RoadmapStructureAgent")
    return saved_data
