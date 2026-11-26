from typing import Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from app.core.config import settings
from app.services.db import get_supabase_admin

def check_user_token_budget(user_id: str, estimated_tokens: int = 2000) -> bool:
    """
    Ensures the user has not exceeded their monthly token quota in Supabase.
    Raises HTTP 402 Payment Required if limit reached.
    """
    # Bypass for guest, demo, or unauthenticated users to avoid violating profiles foreign key
    if not user_id or user_id == "00000000-0000-0000-0000-000000000001" or user_id.startswith("00000000") or user_id == "guest":
        return True

    try:
        supabase = get_supabase_admin()
        res = supabase.table("token_budgets").select("*").eq("user_id", user_id).execute()
        
        if not res.data:
            # Check if profile exists before attempting insert to prevent foreign key violation
            try:
                prof = supabase.table("profiles").select("id").eq("id", user_id).execute()
                if not prof.data:
                    # User profile doesn't exist in DB yet, bypass budget check gracefully
                    return True
                supabase.table("token_budgets").insert({
                    "user_id": user_id,
                    "tokens_used_current_cycle": 0,
                    "max_tokens_monthly": settings.DEFAULT_MONTHLY_TOKEN_BUDGET
                }).execute()
            except Exception as e:
                print(f"[Guardrails] Could not insert initial token budget for user {user_id}: {e}")
                return True
            return True
            
        budget = res.data[0]
        used = budget.get("tokens_used_current_cycle", 0)
        max_tokens = budget.get("max_tokens_monthly", settings.DEFAULT_MONTHLY_TOKEN_BUDGET)
        
        # Check if billing cycle has expired and perform automatic rollover
        cycle_resets_at_str = budget.get("cycle_resets_at")
        if cycle_resets_at_str:
            try:
                cycle_resets_at = datetime.fromisoformat(cycle_resets_at_str.replace("Z", "+00:00"))
                now_utc = datetime.now(timezone.utc)
                if now_utc >= cycle_resets_at:
                    new_reset_iso = (now_utc + timedelta(days=30)).isoformat()
                    supabase.table("token_budgets").update({
                        "tokens_used_current_cycle": 0,
                        "cycle_resets_at": new_reset_iso,
                        "updated_at": now_utc.isoformat()
                    }).eq("user_id", user_id).execute()
                    used = 0
            except Exception as e:
                print(f"[Guardrails] Cycle rollover notice: {e}")

        if used + estimated_tokens > max_tokens:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Monthly AI learning token budget exhausted ({used} / {max_tokens} tokens). Please upgrade to Pro."
            )
        return True
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[Guardrails] check_user_token_budget notice (non-fatal): {exc}")
        return True

def record_token_usage(user_id: str, prompt_tokens: int, completion_tokens: int, agent_name: str, latency_ms: int = 0):
    """
    Increments token usage in Supabase and records an agent audit log.
    """
    # Bypass for guest, demo, or unauthenticated users to avoid foreign key violations
    if not user_id or user_id == "00000000-0000-0000-0000-000000000001" or user_id.startswith("00000000") or user_id == "guest":
        return

    try:
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
            try:
                current = supabase.table("token_budgets").select("tokens_used_current_cycle").eq("user_id", user_id).execute()
                current_used = current.data[0]["tokens_used_current_cycle"] if current.data else 0
                supabase.table("token_budgets").upsert({
                    "user_id": user_id,
                    "tokens_used_current_cycle": current_used + total_tokens
                }).execute()
            except Exception:
                pass
        
        # 2. Insert audit execution log
        try:
            supabase.table("agent_execution_logs").insert({
                "user_id": user_id,
                "agent_name": agent_name,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_cost_usd": (prompt_tokens * 0.0000015) + (completion_tokens * 0.000002),
                "latency_ms": latency_ms,
                "status": "success"
            }).execute()
        except Exception:
            pass
    except Exception as exc:
        print(f"[Guardrails] record_token_usage notice (non-fatal): {exc}")

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
