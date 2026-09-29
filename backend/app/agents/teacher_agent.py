from typing import Dict, Any, List
from app.agents.state import ClassroomState
from app.core.guardrails import record_token_usage

def teacher_node(state: ClassroomState) -> Dict[str, Any]:
    """
    LangGraph Node: Delivers progressive Socratic teaching, analogies, and checkpoint questions.
    """
    current_idx = state.get("current_concept_index", 0)
    dialogue_history = state.get("dialogue_history", [])
    module_title = state.get("module_title", "Foundations")
    
    # Check if there is a learner message to respond to
    last_user_message = dialogue_history[-1]["content"] if dialogue_history and dialogue_history[-1]["role"] == "user" else ""
    
    if current_idx == 0 and not last_user_message:
        teacher_reply = (
            f"Welcome to **{module_title}**.\n\n"
            "To build real intuition, let's explore the core mechanism step-by-step rather than memorizing syntax.\n\n"
            "**Core Concept 1: The Mental Model**\n"
            "Imagine your system as a distributed postal service with strict delivery guarantees. "
            "What do you think happens when a node fails before acknowledging receipt of a message?"
        )
        new_concept_index = 1
        quiz_questions = [{
            "id": "q1",
            "question": "What happens when a node fails before acknowledgement?",
            "expected_key_concepts": ["idempotency", "retry mechanism", "at-least-once delivery"]
        }]
    else:
        teacher_reply = (
            f"Insightful analysis! Notice how that ties directly into state consistency.\n\n"
            "When dealing with failure modes, the system must choose between **availability** and **consistency**.\n\n"
            "Let's test this: How would you structure a rollback strategy if a transaction fails halfway through execution?"
        )
        new_concept_index = current_idx + 1
        quiz_questions = state.get("quiz_questions", []) + [{
            "id": f"q{new_concept_index}",
            "question": "How do you structure a rollback strategy?",
            "expected_key_concepts": ["compensating transactions", "saga pattern", "two-phase commit"]
        }]
        
    record_token_usage(
        user_id=state["user_id"],
        prompt_tokens=500,
        completion_tokens=250,
        agent_name="TeacherAgent"
    )
    
    return {
        "dialogue_history": [{"role": "assistant", "content": teacher_reply}],
        "current_concept_index": new_concept_index,
        "quiz_questions": quiz_questions
    }
