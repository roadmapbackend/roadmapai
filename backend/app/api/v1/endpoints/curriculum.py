from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.security import get_current_user_id
from app.core.guardrails import check_user_token_budget
from app.agents.curriculum_agent import generate_curriculum_trajectory
from app.services.db import get_supabase_admin

router = APIRouter()

class CreateCurriculumRequest(BaseModel):
    goal: str
    background: str
    weekly_hours: int = 5

@router.post("/generate", response_model=Dict[str, Any])
async def generate_trajectory(
    req: CreateCurriculumRequest,
    user_id: str = Depends(get_current_user_id)
):
    check_user_token_budget(user_id, estimated_tokens=1500)
    result = generate_curriculum_trajectory(
        user_id=user_id,
        goal=req.goal,
        background=req.background,
        weekly_hours=req.weekly_hours
    )
    return result

@router.get("/active", response_model=Dict[str, Any])
async def get_active_curriculum(
    user_id: str = Depends(get_current_user_id)
):
    supabase = get_supabase_admin()
    curr_res = supabase.table("curricula").select("*").eq("user_id", user_id).eq("status", "active").order("created_at", desc=True).limit(1).execute()
    
    if not curr_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active curriculum found.")
        
    curriculum = curr_res.data[0]
    modules_res = supabase.table("curriculum_modules").select("*").eq("curriculum_id", curriculum["id"]).order("sequence_order", desc=False).execute()
    
    return {
        "curriculum": curriculum,
        "modules": modules_res.data or []
    }
