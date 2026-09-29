from typing import List, Dict, Any, Optional
from app.services.db import get_supabase_admin

def save_roadmap_and_days(
    user_id: str,
    title: str,
    domain_context: str,
    total_days: int,
    daily_hours: float,
    skill_level: str,
    days: List[Dict[str, Any]],
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    
    # 1. Insert master roadmap record
    roadmap_res = supabase.table("roadmaps").insert({
        "user_id": user_id,
        "title": title,
        "domain_context": domain_context,
        "total_days": total_days,
        "daily_hours_commitment": daily_hours,
        "skill_level": skill_level,
        "status": "active",
        "metadata": metadata or {}
    }).execute()
    
    roadmap = roadmap_res.data[0]
    roadmap_id = roadmap["id"]
    
    # 2. Bulk insert days
    day_records = []
    for d in days:
        day_records.append({
            "roadmap_id": roadmap_id,
            "day_number": d["day_number"],
            "title": d["title"],
            "description": d.get("description", ""),
            "learning_objectives": d.get("learning_objectives", []),
            "status": "in_progress" if d["day_number"] == 1 else "not_started"
        })
        
    days_res = supabase.table("roadmap_days").insert(day_records).execute()
    
    return {
        "roadmap": roadmap,
        "days": days_res.data or []
    }

def save_day_topics(
    day_id: str,
    roadmap_id: str,
    topics: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    supabase = get_supabase_admin()
    
    # Check if topics already exist
    existing = supabase.table("roadmap_topics").select("*").eq("day_id", day_id).order("topic_number").execute()
    if existing.data and len(existing.data) > 0:
        return existing.data
        
    topic_records = []
    for t in topics:
        topic_records.append({
            "day_id": day_id,
            "roadmap_id": roadmap_id,
            "topic_number": t["topic_number"],
            "title": t["title"],
            "description": t.get("description", ""),
            "estimated_minutes": t.get("estimated_minutes", 45),
            "status": "not_started"
        })
        
    res = supabase.table("roadmap_topics").insert(topic_records).execute()
    return res.data or []

def save_topic_lesson(
    topic_id: str,
    content_markdown: str,
    practical_examples: List[Dict[str, Any]],
    citations: List[Dict[str, Any]],
    recommended_courses: List[Dict[str, Any]]
) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    
    res = supabase.table("topic_lessons").upsert({
        "topic_id": topic_id,
        "content_markdown": content_markdown,
        "practical_examples": practical_examples,
        "citations": citations,
        "recommended_courses": recommended_courses
    }, on_conflict="topic_id").execute()
    
    return res.data[0] if res.data else {}

def get_roadmap_tree(roadmap_id: str) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    
    roadmap_res = supabase.table("roadmaps").select("*").eq("id", roadmap_id).execute()
    if not roadmap_res.data:
        return {}
        
    roadmap = roadmap_res.data[0]
    days_res = supabase.table("roadmap_days").select("*").eq("roadmap_id", roadmap_id).order("day_number").execute()
    days = days_res.data or []
    
    topics_res = supabase.table("roadmap_topics").select("*").eq("roadmap_id", roadmap_id).order("topic_number").execute()
    topics = topics_res.data or []
    
    # Group topics by day_id
    topics_by_day = {}
    for t in topics:
        d_id = t["day_id"]
        if d_id not in topics_by_day:
            topics_by_day[d_id] = []
        topics_by_day[d_id].append(t)
        
    for d in days:
        d["topics"] = topics_by_day.get(d["id"], [])
        
    roadmap["days"] = days
    return roadmap
