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
    daily_hours: float,
    domain_context: str = "general"
) -> List[Dict[str, Any]]:
    """
    Agent 2: Daily Structure Agent (Daily Curriculum Designer)
    Uses live LLM to break down a day into discrete subtopics with exact time budgets.
    """
    llm = get_llm(temperature=0.2)
    topics = []

    total_minutes = int(daily_hours * 60)
    if llm:
        system_prompt = (
            "You are the universal Daily Structure Agent for Roadmap.ai. "
            "Your objective is to deconstruct a specific day's theme into 2 to 4 progressive, focused study sessions (topics) "
            "for ANY subject or craft (software, mathematics, arts, sciences, languages, humanities, business, etc.). "
            f"The learner has committed {daily_hours} hours today ({total_minutes} minutes total). "
            "Requirements:\n"
            f"1. Break the day into 2-4 subtopics where the sum of `estimated_minutes` across all topics strictly equals approx {total_minutes} minutes.\n"
            "2. Each topic title must be highly specific, professional, and directly relevant to the day's theme and subject.\n"
            "3. Each description must clearly explain the key principles, hands-on drills, or conceptual challenges covered in that session.\n"
            "Return valid JSON matching the DailyStructurePlan schema."
        )
        human_prompt = (
            f"Subject: {domain_context}\n"
            f"Day Number: {day_number}\n"
            f"Day Theme: {day_title}\n"
            f"Allocated Study Time: {daily_hours} hours ({total_minutes} minutes total)\n\n"
            f"Deconstruct Day {day_number} into 2-4 substantive subtopics tailored to {domain_context} that sum to {total_minutes} minutes."
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

    # Domain-aware fallback if LLM is rate-limited (429) or offline
    if not topics:
        from app.agents.domain_templates import generate_domain_topics
        topics = generate_domain_topics(
            day_title=day_title,
            daily_hours=daily_hours,
            domain_context=domain_context,
            day_number=day_number
        )

    saved_topics = save_day_topics(
        day_id=day_id,
        roadmap_id=roadmap_id,
        topics=topics
    )

    record_token_usage(user_id=user_id, prompt_tokens=420, completion_tokens=310, agent_name="DailyStructureAgent")
    return saved_topics
