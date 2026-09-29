from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Agent 1: Roadmap Structure Schemas
class DayObjective(BaseModel):
    day_number: int
    title: str
    description: str
    learning_objectives: List[str]

class RoadmapStructurePlan(BaseModel):
    title: str
    domain_context: str
    total_days: int
    daily_hours: float
    days: List[DayObjective]

# Agent 2: Daily Structure Schemas
class TopicBreakdown(BaseModel):
    topic_number: int
    title: str
    description: str
    estimated_minutes: int

class DailyStructurePlan(BaseModel):
    day_number: int
    day_title: str
    daily_hours: float
    topics: List[TopicBreakdown]

# Agent 3: Daily Teacher & Resource Schemas
class CitationSource(BaseModel):
    title: str
    url: Optional[str] = None
    source_type: str = "Documentation / Academic / Book"
    snippet: Optional[str] = None

class RecommendedCourse(BaseModel):
    title: str
    platform: str
    url: Optional[str] = None
    level: str = "Intermediate"

class LessonDelivery(BaseModel):
    topic_title: str
    content_markdown: str
    practical_examples: List[Dict[str, str]]
    citations: List[CitationSource]
    recommended_courses: List[RecommendedCourse]
