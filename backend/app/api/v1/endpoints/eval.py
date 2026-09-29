from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from app.core.security import get_current_user_id
from app.services.db import get_supabase_admin

router = APIRouter()

@router.get("/module/{module_id}", response_model=List[Dict[str, Any]])
async def get_module_evaluations(
    module_id: str,
    user_id: str = Depends(get_current_user_id)
):
    supabase = get_supabase_admin()
    eval_res = supabase.table("evaluations").select("*").eq("module_id", module_id).eq("user_id", user_id).order("created_at", desc=True).execute()
    return eval_res.data or []
