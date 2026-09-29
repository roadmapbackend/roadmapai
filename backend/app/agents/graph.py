from langgraph.graph import StateGraph, END
from app.agents.state import ClassroomState
from app.agents.curriculum_agent import adapt_curriculum_node
from app.agents.teacher_agent import teacher_node
from app.agents.evaluator_agent import evaluator_node
from app.core.guardrails import enforce_iteration_and_token_budget

def should_continue_or_evaluate(state: ClassroomState) -> str:
    """
    Routes between continued teaching dialogue, evaluator grading, or emergency termination.
    """
    if state.get("is_terminated", False) or state.get("iteration_count", 0) >= 15:
        return "terminate"
        
    responses = state.get("learner_responses", [])
    total_concepts = state.get("total_concepts", 2)
    
    if len(responses) >= total_concepts:
        return "evaluator"
    return "teacher"

def route_after_evaluation(state: ClassroomState) -> str:
    """
    Routes to Curriculum Agent for dynamic DAG remediation if gaps were found, otherwise completes loop.
    """
    if state.get("remediation_required", False):
        return "adapt_curriculum"
    return END

# Build the LangGraph StateGraph
builder = StateGraph(ClassroomState)

builder.add_node("guardrails", enforce_iteration_and_token_budget)
builder.add_node("teacher", teacher_node)
builder.add_node("evaluator", evaluator_node)
builder.add_node("adapt_curriculum", adapt_curriculum_node)

builder.set_entry_point("guardrails")
builder.add_edge("guardrails", "teacher")

builder.add_conditional_edges(
    "teacher",
    should_continue_or_evaluate,
    {
        "teacher": "teacher",
        "evaluator": "evaluator",
        "terminate": END
    }
)

builder.add_conditional_edges(
    "evaluator",
    route_after_evaluation,
    {
        "adapt_curriculum": "adapt_curriculum",
        END: END
    }
)

builder.add_edge("adapt_curriculum", END)

adaptive_learning_graph = builder.compile()
