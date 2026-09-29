from typing import List, Dict, Any, Optional
from app.services.db import get_supabase_admin

def insert_curriculum_trajectory(
    user_id: str,
    title: str,
    domain_category: str,
    modules: List[Dict[str, Any]],
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    supabase = get_supabase_admin()
    
    # 1. Create curriculum record
    curr_res = supabase.table("curricula").insert({
        "user_id": user_id,
        "title": title,
        "domain_category": domain_category,
        "status": "active",
        "metadata": metadata or {}
    }).execute()
    
    curriculum_id = curr_res.data[0]["id"]
    
    # 2. Bulk insert structured modules
    module_records = []
    for idx, mod in enumerate(modules):
        module_records.append({
            "curriculum_id": curriculum_id,
            "sequence_order": idx + 1,
            "title": mod["title"],
            "description": mod.get("description", ""),
            "mastery_threshold": mod.get("mastery_threshold", 0.80),
            "status": "in_progress" if idx == 0 else "locked"
        })
        
    supabase.table("curriculum_modules").insert(module_records).execute()
    return curriculum_id

def insert_remediation_module(
    curriculum_id: str,
    parent_module_id: str,
    title: str,
    description: str,
    adapted_reason: str
) -> Dict[str, Any]:
    """
    Slices a targeted remediation node right after the failed module
    """
    supabase = get_supabase_admin()
    
    # Query parent module sequence
    parent_res = supabase.table("curriculum_modules").select("sequence_order").eq("id", parent_module_id).execute()
    parent_seq = parent_res.data[0]["sequence_order"] if parent_res.data else 1
    
    # Shift forward subsequent modules using stored procedure
    try:
        supabase.rpc("shift_module_sequences", {
            "p_curriculum_id": curriculum_id,
            "p_after_seq": parent_seq
        }).execute()
    except Exception:
        # Fallback manual sequence shift
        subsequent = supabase.table("curriculum_modules").select("id, sequence_order").eq("curriculum_id", curriculum_id).gt("sequence_order", parent_seq).execute()
        for s in (subsequent.data or []):
            supabase.table("curriculum_modules").update({"sequence_order": s["sequence_order"] + 1}).eq("id", s["id"]).execute()
    
    # Insert new remediation node
    new_node = supabase.table("curriculum_modules").insert({
        "curriculum_id": curriculum_id,
        "parent_module_id": parent_module_id,
        "sequence_order": parent_seq + 1,
        "title": f"Adaptive Remediation: {title}",
        "description": description,
        "mastery_threshold": 0.80,
        "status": "remediation_needed",
        "adapted_reason": adapted_reason,
        "is_remediation": True
    }).execute()
    
    return new_node.data[0] if new_node.data else {}

def unlock_next_module(curriculum_id: str, current_module_id: str) -> Optional[Dict[str, Any]]:
    supabase = get_supabase_admin()
    
    current = supabase.table("curriculum_modules").select("sequence_order").eq("id", current_module_id).execute()
    if not current.data:
        return None
        
    current_seq = current.data[0]["sequence_order"]
    
    next_mod = supabase.table("curriculum_modules")\
        .select("*")\
        .eq("curriculum_id", curriculum_id)\
        .eq("sequence_order", current_seq + 1)\
        .execute()
        
    if next_mod.data:
        next_id = next_mod.data[0]["id"]
        supabase.table("curriculum_modules").update({"status": "in_progress"}).eq("id", next_id).execute()
        return next_mod.data[0]
        
    return None
