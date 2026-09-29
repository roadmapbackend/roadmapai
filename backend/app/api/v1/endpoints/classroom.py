from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.security import get_current_user_id
from app.core.guardrails import check_user_token_budget
from app.agents.graph import adaptive_learning_graph
from app.services.db import get_supabase_admin

router = APIRouter()

class SendMessageRequest(BaseModel):
    module_id: str
    message: str
    session_id: Optional[str] = None

@router.post("/interact", response_model=Dict[str, Any])
async def interact_with_teacher(
    req: SendMessageRequest,
    user_id: str = Depends(get_current_user_id)
):
    check_user_token_budget(user_id, estimated_tokens=1000)
    supabase = get_supabase_admin()
    
    # Query module info
    mod_res = supabase.table("curriculum_modules").select("*, curricula!inner(user_id)").eq("id", req.module_id).execute()
    if not mod_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
        
    module = mod_res.data[0]
    
    # Initialize / retrieve session
    if not req.session_id:
        sess_res = supabase.table("classroom_sessions").insert({
            "module_id": req.module_id,
            "user_id": user_id,
            "messages": [{"role": "user", "content": req.message}] if req.message else []
        }).execute()
        session_id = sess_res.data[0]["id"]
        history = [{"role": "user", "content": req.message}] if req.message else []
    else:
        session_id = req.session_id
        sess_res = supabase.table("classroom_sessions").select("messages").eq("id", session_id).execute()
        history = sess_res.data[0]["messages"] if sess_res.data else []
        if req.message:
            history.append({"role": "user", "content": req.message})

    # Prepare LangGraph state
    initial_state = {
        "user_id": user_id,
        "curriculum_id": module["curriculum_id"],
        "module_id": req.module_id,
        "module_title": module["title"],
        "dialogue_history": history,
        "current_concept_index": len(history) // 2,
        "total_concepts": 3,
        "quiz_questions": [],
        "learner_responses": [{"response": req.message}] if req.message else [],
        "evaluation_result": None,
        "remediation_required": False,
        "adaptation_actions": [],
        "iteration_count": 0,
        "total_tokens_spent": 0,
        "is_terminated": False
    }
    
    # Run through LangGraph
    final_state = adaptive_learning_graph.invoke(initial_state)
    
    # Persist updated dialogue
    updated_messages = final_state.get("dialogue_history", [])
    supabase.table("classroom_sessions").update({
        "messages": updated_messages
    }).eq("id", session_id).execute()
    
    latest_reply = updated_messages[-1]["content"] if updated_messages else ""
    
    return {
        "session_id": session_id,
        "reply": latest_reply,
        "evaluation": final_state.get("evaluation_result"),
        "adaptation_actions": final_state.get("adaptation_actions", [])
    }
