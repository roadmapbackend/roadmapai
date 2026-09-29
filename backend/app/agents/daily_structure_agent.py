from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.llm import get_llm
from app.core.guardrails import record_token_usage
from app.tools.roadmap_store import save_day_topics
from app.agents.state import DailyStructurePlan

def run_daily_structure_agent(
    user_id: str,
    roadmap_id: str,
    day_id: str,
    day_number: int,
    day_title: str,
    daily_hours: float
) -> List[Dict[str, Any]]:
    """
    Agent 2: Daily Structure Agent (Daily Curriculum Designer)
    Uses live LLM to break down a day into discrete subtopics with exact time budgets.
    """
    llm = get_llm(temperature=0.2)
    topics = []

    if llm:
        system_prompt = (
            "You are the Daily Structure Agent for Roadmap.ai. "
            "Your job is to take a specific day title and the user's daily study hours, "
            "and break that day down into 2-4 discrete subtopics (Topic 1 ... Topic N). "
            "Each topic must have a title, short description, and estimated study time in minutes. "
            f"The sum of all estimated_minutes should closely match {int(daily_hours * 60)} minutes total. "
            "Return valid JSON matching the DailyStructurePlan schema."
        )
        human_prompt = (
            f"Day Number: {day_number}\n"
            f"Day Objective: {day_title}\n"
            f"Allocated Study Time: {daily_hours} hours ({int(daily_hours * 60)} minutes)\n\n"
            "Generate the structured list of subtopics."
        )

        try:
            structured_llm = llm.with_structured_output(DailyStructurePlan)
            response: DailyStructurePlan = structured_llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ])
            for t in response.topics:
                topics.append({
                    "topic_number": t.topic_number,
                    "title": t.title,
                    "description": t.description,
                    "estimated_minutes": t.estimated_minutes
                })
        except Exception as err:
            print(f"[Agent 2] LLM invocation error (falling back): {err}")

    # Heuristic fallback if no LLM key or LLM error
    if not topics:
        total_minutes = int(daily_hours * 60)
        topic_count = max(2, min(4, int(daily_hours * 1.5)))
        mins_per_topic = total_minutes // topic_count

        topic_templates = [
            ("Core Theory & Mental Model", f"Deep dive into the fundamental mechanics of {day_title}."),
            ("Hands-On Implementation & Patterns", "Writing working code, exploring design patterns, and exercises."),
            ("Edge Cases, Failure Modes & Diagnostics", "Debugging common failure states, concurrency issues, and benchmarks."),
            ("Synthesis & Milestone Challenge", "Validating retention and building a mini-project checkpoint.")
        ]

        for idx in range(topic_count):
            suffix, desc = topic_templates[idx % len(topic_templates)]
            topics.append({
                "topic_number": idx + 1,
                "title": f"Topic {idx + 1}: {suffix}",
                "description": desc,
                "estimated_minutes": mins_per_topic
            })

    saved_topics = save_day_topics(
        day_id=day_id,
        roadmap_id=roadmap_id,
        topics=topics
    )

    record_token_usage(user_id=user_id, prompt_tokens=420, completion_tokens=310, agent_name="DailyStructureAgent")
    return saved_topics
