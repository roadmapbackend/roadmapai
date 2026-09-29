from typing import Dict, Any
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.core.config import settings
from app.services.db import get_supabase_admin

def check_user_token_budget(user_id: str, estimated_tokens: int = 2000) -> bool:
    """
    Ensures the user has not exceeded their monthly token quota in Supabase.
    Raises HTTP 402 Payment Required if limit reached.
    """
    supabase = get_supabase_admin()
    res = supabase.table("token_budgets").select("*").eq("user_id", user_id).execute()
    
    if not res.data:
        supabase.table("token_budgets").insert({
            "user_id": user_id,
            "tokens_used_current_cycle": 0,
            "max_tokens_monthly": settings.DEFAULT_MONTHLY_TOKEN_BUDGET
        }).execute()
        return True
        
    budget = res.data[0]
    used = budget.get("tokens_used_current_cycle", 0)
    max_tokens = budget.get("max_tokens_monthly", settings.DEFAULT_MONTHLY_TOKEN_BUDGET)
    
    if used + estimated_tokens > max_tokens:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Monthly AI learning token budget exhausted. Please upgrade to Pro."
        )
    return True

def record_token_usage(user_id: str, prompt_tokens: int, completion_tokens: int, agent_name: str, latency_ms: int = 0):
    """
    Increments token usage in Supabase and records an agent audit log.
    """
    supabase = get_supabase_admin()
    total_tokens = prompt_tokens + completion_tokens
    
    # 1. Increment token budget atomically
    try:
        supabase.rpc("increment_token_budget", {
            "p_user_id": user_id,
            "p_tokens": total_tokens
        }).execute()
    except Exception:
        # Fallback direct update
        current = supabase.table("token_budgets").select("tokens_used_current_cycle").eq("user_id", user_id).execute()
        current_used = current.data[0]["tokens_used_current_cycle"] if current.data else 0
        supabase.table("token_budgets").upsert({
            "user_id": user_id,
            "tokens_used_current_cycle": current_used + total_tokens
        }).execute()
    
    # 2. Insert audit execution log
    supabase.table("agent_execution_logs").insert({
        "user_id": user_id,
        "agent_name": agent_name,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_cost_usd": (prompt_tokens * 0.0000015) + (completion_tokens * 0.000002),
        "latency_ms": latency_ms,
        "status": "success"
    }).execute()

def enforce_iteration_and_token_budget(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph Graph Node: Enforces hard iteration limits to avoid runaway agent loops.
    """
    current_iterations = state.get("iteration_count", 0) + 1
    max_iterations = settings.MAX_LOOP_ITERATIONS
    
    is_terminated = current_iterations >= max_iterations
        
    return {
        "iteration_count": current_iterations,
        "is_terminated": is_terminated
    }
