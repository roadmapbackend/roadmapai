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
    domain_context: str = "general",
    learning_objectives: List[str] = None,
    day_description: str = "",
    skill_level: str = "intermediate"
) -> List[Dict[str, Any]]:
    """
    Agent 2: Daily Structure Agent (Daily Curriculum Designer)
    Uses live LLM to dynamically architect organic, highly tailored subtopics
    with a natural learning progression (Intro -> Applied -> Advanced) and exact time budgets.
    """
    llm = get_llm(temperature=0.2)
    topics = []

    total_minutes = int(daily_hours * 60)
    level = (skill_level or "intermediate").lower()
    target_count = "2" if daily_hours <= 1.0 else "3" if daily_hours <= 2.5 else "3 to 4"

    objectives_str = ""
    if learning_objectives and len(learning_objectives) > 0:
        objectives_str = "\nLearning Objectives for Today:\n" + "\n".join(f"- {obj}" for obj in learning_objectives)

    lower_ctx = f"{domain_context} {day_title}".lower()
    is_gaming = any(k in lower_ctx for k in ["bgmi", "pubg", "battlegrounds", "valorant", "csgo", "counter-strike", "fortnite", "apex", "cod", "call of duty", "warzone", "gaming", "esports", "battle royale", "fps"])
    is_sports = any(k in lower_ctx for k in ["football", "soccer", "basketball", "tennis", "cricket", "boxing", "mma", "swimming", "running", "gym", "workout", "fitness", "bodybuilding", "yoga"])
    is_music = any(k in lower_ctx for k in ["guitar", "piano", "violin", "drums", "music", "singing", "vocals", "harmony"])

    domain_advice = ""
    if is_gaming:
        domain_advice = (
            "DISCIPLINE CONTEXT: COMPETITIVE GAMING & ESPORTS\n"
            "- Focus strictly on in-game mechanics: HUD layout & controls, sensitivity/gyro calibration, "
            "crosshair placement, spray pull-down & recoil patterns, weapon loadouts & throwables, "
            "map rotations & compound clearing, squad crossfire, and endgame clutch scenarios. "
            "DO NOT treat this as computer science or software engineering!"
        )
    elif is_sports:
        domain_advice = (
            "DISCIPLINE CONTEXT: ATHLETICS & SPORTS\n"
            "- Focus on biomechanics, proper form, kinetic chain transfer, drills, conditioning, and injury prevention."
        )
    elif is_music:
        domain_advice = (
            "DISCIPLINE CONTEXT: MUSIC & INSTRUMENTAL MASTERY\n"
            "- Focus on posture/ergonomics, hand technique, scale/chord transitions, metronome timing drills, and phrasing."
        )

    if llm:
        system_prompt = (
            "You are the universal Daily Structure Agent (Agent 2) for Daari. "
            f"Your objective is to architect an organic, highly tailored set of {target_count} subtopics "
            "for a single day of an intensive roadmap following a strict pedagogical learning progression.\n\n"
            f"{domain_advice}\n\n"
            "CRITICAL ARCHITECTURAL DIRECTIVES:\n"
            "1. NATURAL PEDAGOGICAL PROGRESSION:\n"
            f"   - Topic 1 (Intuitive Foundations & Setup): Introduce core mental models, intuition, terminology, and setup calibrated for a {level} learner.\n"
            "   - Intermediate Topic(s) (Applied Mechanics & Execution): Concrete workflows, step-by-step techniques, and applied practice drills.\n"
            "   - Final Topic (Nuance, Pitfall Prevention & Mastery): High-pressure scenarios, common amateur blunders, edge-case reactions, and skill synthesis.\n"
            "2. NO FORMULAIC BOILERPLATE: Never output generic placeholder titles like 'Topic 1: Foundations & Key Principles', 'Topic 2: Applied Hands-On Drills', 'Topic 3: Edge Cases', or 'Topic 4: Integration Milestone'.\n"
            "3. DEEP DOMAIN TAILORING: Every subtopic title and description must directly address real-world mechanisms of the subject.\n"
            f"4. TIME BUDGET: The sum of `estimated_minutes` across all topics must approximately equal {total_minutes} minutes ({daily_hours} hours total).\n"
            "5. Return valid JSON matching the DailyStructurePlan schema."
        )
        human_prompt = (
            f"Domain / Subject: {domain_context}\n"
            f"Day Number: {day_number}\n"
            f"Day Title: {day_title}\n"
            f"Day Summary: {day_description or 'Mastering core mechanisms for today.'}\n"
            f"{objectives_str}\n"
            f"Allocated Study Time: {daily_hours} hours ({total_minutes} minutes total)\n\n"
            f"Architect 2 to 5 organic, highly specific subtopics for Day {day_number} in {domain_context} that sum to {total_minutes} minutes."
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
            day_number=day_number,
            learning_objectives=learning_objectives,
            day_description=day_description
        )

    saved_topics = save_day_topics(
        day_id=day_id,
        roadmap_id=roadmap_id,
        topics=topics
    )

    record_token_usage(user_id=user_id, prompt_tokens=420, completion_tokens=310, agent_name="DailyStructureAgent")
    return saved_topics
