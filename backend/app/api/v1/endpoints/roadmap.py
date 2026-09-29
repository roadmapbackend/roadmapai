from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.core.security import get_current_user_id
from app.core.guardrails import check_user_token_budget
from app.agents.roadmap_structure_agent import run_roadmap_structure_agent
from app.agents.daily_structure_agent import run_daily_structure_agent
from app.agents.daily_teacher_agent import run_daily_teacher_agent
from app.tools.roadmap_store import get_roadmap_tree
from app.services.db import get_supabase_admin

router = APIRouter()

class CreateRoadmapRequest(BaseModel):
    domain_context: str = Field(..., description="Field of study, syllabus outline, or topic")
    total_days: int = Field(..., ge=1, le=180, description="Total days allocated for the roadmap")
    daily_hours: float = Field(..., ge=0.5, le=16.0, description="Daily study hours available")
    skill_level: str = "intermediate"

class UpdateTopicStatusRequest(BaseModel):
    status: str = Field(..., description="not_started, in_progress, completed")

@router.post("/generate", response_model=Dict[str, Any])
async def generate_roadmap(
    req: CreateRoadmapRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Step 1: Activates Agent 1 (Roadmap Structure Agent) to create master roadmap and days.
    """
    check_user_token_budget(user_id, estimated_tokens=1500)
    result = run_roadmap_structure_agent(
        user_id=user_id,
        domain_context=req.domain_context,
        total_days=req.total_days,
        daily_hours=req.daily_hours,
        skill_level=req.skill_level
    )
    return result

@router.get("/{roadmap_id}/tree", response_model=Dict[str, Any])
async def get_tree(
    roadmap_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Returns the complete hierarchical tree representation of the roadmap.
    """
    tree = get_roadmap_tree(roadmap_id)
    if not tree:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")
    return tree

@router.post("/{roadmap_id}/day/{day_id}/structure", response_model=List[Dict[str, Any]])
async def structure_day(
    roadmap_id: str,
    day_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Step 2: Activates Agent 2 (Daily Structure Agent) to break down a specific day into topics.
    """
    check_user_token_budget(user_id, estimated_tokens=800)
    supabase = get_supabase_admin()
    
    # Query Day & Roadmap context
    day_res = supabase.table("roadmap_days").select("*, roadmaps!inner(daily_hours_commitment)").eq("id", day_id).execute()
    if not day_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Day not found")
        
    day = day_res.data[0]
    daily_hours = day.get("roadmaps", {}).get("daily_hours_commitment", 2.0)
    
    topics = run_daily_structure_agent(
        user_id=user_id,
        roadmap_id=roadmap_id,
        day_id=day_id,
        day_number=day["day_number"],
        day_title=day["title"],
        daily_hours=float(daily_hours)
    )
    return topics

@router.post("/topic/{topic_id}/teach", response_model=Dict[str, Any])
async def teach_topic(
    topic_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Step 3: Activates Agent 3 (Daily Teacher Agent) to generate comprehensive lesson, code, citations, and courses.
    """
    check_user_token_budget(user_id, estimated_tokens=1200)
    supabase = get_supabase_admin()
    
    topic_res = supabase.table("roadmap_topics").select("*, roadmaps!inner(domain_context)").eq("id", topic_id).execute()
    if not topic_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
        
    topic = topic_res.data[0]
    domain_context = topic.get("roadmaps", {}).get("domain_context", "Computer Science")
    
    lesson = run_daily_teacher_agent(
        user_id=user_id,
        topic_id=topic_id,
        topic_title=topic["title"],
        topic_desc=topic.get("description", ""),
        domain_context=domain_context
    )
    return lesson

@router.patch("/topic/{topic_id}/status", response_model=Dict[str, Any])
async def update_topic_status(
    topic_id: str,
    req: UpdateTopicStatusRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Updates completion status for non-linear or sequential tracking.
    """
    supabase = get_supabase_admin()
    res = supabase.table("roadmap_topics").update({"status": req.status}).eq("id", topic_id).execute()
    return res.data[0] if res.data else {}

@router.get("/list", response_model=List[Dict[str, Any]])
async def list_user_roadmaps(
    user_id: str = Depends(get_current_user_id)
):
    supabase = get_supabase_admin()
    res = supabase.table("roadmaps").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data or []
