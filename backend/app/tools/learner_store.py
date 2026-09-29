from typing import Optional, Dict, Any, List
from app.services.db import get_supabase_admin

def get_learner_profile(user_id: str) -> Optional[Dict[str, Any]]:
    supabase = get_supabase_admin()
    res = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if res.data:
        return res.data[0]
    return {
        "id": user_id,
        "subscription_tier": "free",
        "learning_goal": "Distributed Systems",
        "prior_knowledge_level": "intermediate"
    }

def record_evaluation_result(
    session_id: str,
    module_id: str,
    user_id: str,
    score: float,
    is_passed: bool,
    misconceptions: List[str],
    remediation_topics: List[str],
    feedback_summary: str,
    raw_rubric: Dict[str, Any]
) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    
    # 1. Store evaluation
    eval_insert = supabase.table("evaluations").insert({
        "session_id": session_id,
        "module_id": module_id,
        "user_id": user_id,
        "score": score,
        "is_passed": is_passed,
        "misconceptions": misconceptions,
        "remediation_topics": remediation_topics,
        "feedback_summary": feedback_summary,
        "raw_rubric": raw_rubric
    }).execute()
    
    # 2. Update module status
    new_status = "mastered" if is_passed else "remediation_needed"
    supabase.table("curriculum_modules").update({
        "status": new_status,
        "score": score
    }).eq("id", module_id).execute()
    
    return eval_insert.data[0] if eval_insert.data else {}
