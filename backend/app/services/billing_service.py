from typing import Dict, Any, Optional
from app.services.db import get_supabase_admin
from app.core.config import settings

def get_user_subscription(user_id: str) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    profile_res = supabase.table("profiles").select("subscription_tier, stripe_customer_id, stripe_subscription_id").eq("id", user_id).execute()
    budget_res = supabase.table("token_budgets").select("*").eq("user_id", user_id).execute()
    
    tier = profile_res.data[0]["subscription_tier"] if profile_res.data else "free"
    budget = budget_res.data[0] if budget_res.data else {"tokens_used_current_cycle": 0, "max_tokens_monthly": 250000}
    
    tokens_used = budget.get("tokens_used_current_cycle", 0)
    tokens_limit = budget.get("max_tokens_monthly", settings.DEFAULT_MONTHLY_TOKEN_BUDGET)
    
    return {
        "tier": tier,
        "tokens_used": tokens_used,
        "tokens_limit": tokens_limit,
        "percentage_used": min(100.0, (tokens_used / max(1, tokens_limit)) * 100.0)
    }

def update_user_tier(user_id: str, tier: str, stripe_customer_id: Optional[str] = None, stripe_subscription_id: Optional[str] = None):
    supabase = get_supabase_admin()
    max_tokens = settings.PRO_MONTHLY_TOKEN_BUDGET if tier == "pro" else settings.DEFAULT_MONTHLY_TOKEN_BUDGET
    
    # 1. Update Profile in Supabase
    supabase.table("profiles").update({
        "subscription_tier": tier,
        "stripe_customer_id": stripe_customer_id,
        "stripe_subscription_id": stripe_subscription_id
    }).eq("id", user_id).execute()
    
    # 2. Update Token Quota
    supabase.table("token_budgets").update({
        "max_tokens_monthly": max_tokens
    }).eq("user_id", user_id).execute()
