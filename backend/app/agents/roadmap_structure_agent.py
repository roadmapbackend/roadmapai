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
            "You are the Roadmap Structure Agent (Root Planner) for Roadmap.ai. "
            "Your job is to take a domain or syllabus, total days, and daily hours, "
            "and create a master roadmap partitioned strictly into days (Day 1 ... Day N). "
            "Each day must have a clear title, description, and 3 key learning objectives. "
            "Return valid JSON matching the RoadmapStructurePlan schema."
        )
        human_prompt = (
            f"Domain / Syllabus: {domain_context}\n"
            f"Total Duration: {total_days} days\n"
            f"Daily Commitment: {daily_hours} hours/day\n"
            f"Learner Skill Level: {skill_level}\n\n"
            f"Generate a strict {total_days}-day chronological progression from fundamentals to production mastery."
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

    # Heuristic fallback if no LLM key or LLM error
    if not days:
        domain_clean = domain_context.strip()
        for i in range(1, total_days + 1):
            if i == 1:
                title = f"Day 1: Foundations & Core Architecture"
                desc = f"Baseline mental models, terminology, and setup for {domain_clean}."
                objectives = ["Core terminology", "Architectural paradigms", "Environment setup"]
            elif i == total_days:
                title = f"Day {i}: Capstone Integration & Real-World Milestone"
                desc = f"Building an end-to-end production-grade milestone for {domain_clean}."
                objectives = ["Capstone implementation", "Failure testing & benchmarks", "Production review"]
            elif i <= total_days // 2:
                title = f"Day {i}: Applied Implementation & Core Patterns (Part {i})"
                desc = f"Deep dive into design patterns and hands-on mechanics."
                objectives = [f"Master component {i}", "Implement practical workflows", "Handle error boundaries"]
            else:
                title = f"Day {i}: Advanced Scaling & System Hardening (Part {i})"
                desc = f"Performance tuning, concurrency boundaries, and trade-offs."
                objectives = ["Mitigate bottlenecks", "Evaluate architectural trade-offs", "Edge case resilience"]

            days.append({
                "day_number": i,
                "title": title,
                "description": desc,
                "learning_objectives": objectives
            })

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
