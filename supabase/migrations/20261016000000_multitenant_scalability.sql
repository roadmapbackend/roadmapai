-- Roadmap.ai Multi-Tenant Scalability & Performance Migration
-- 1. Add metadata and tracking columns to public.roadmaps
ALTER TABLE public.roadmaps 
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC(5,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS domain_archetype TEXT DEFAULT 'general';

-- 2. Add denormalized user_id to child tables for O(1) direct Row Level Security (RLS)
ALTER TABLE public.roadmap_days 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.roadmap_topics 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.topic_lessons 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Backfill user_id on existing child records if any exist
UPDATE public.roadmap_days rd
SET user_id = r.user_id
FROM public.roadmaps r
WHERE rd.roadmap_id = r.id AND rd.user_id IS NULL;

UPDATE public.roadmap_topics rt
SET user_id = r.user_id
FROM public.roadmaps r
WHERE rt.roadmap_id = r.id AND rt.user_id IS NULL;

UPDATE public.topic_lessons tl
SET user_id = rt.user_id
FROM public.roadmap_topics rt
WHERE tl.topic_id = rt.id AND tl.user_id IS NULL;

-- 3. High-Performance Compound B-Tree Indexes
-- Fast lookup for user roadmaps sorted by pin and recency
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_status_last_accessed 
    ON public.roadmaps (user_id, status, is_pinned DESC, last_accessed_at DESC);

-- Fast lookup for days within a roadmap in sequence
CREATE INDEX IF NOT EXISTS idx_roadmap_days_roadmap_day 
    ON public.roadmap_days (roadmap_id, day_number ASC);

CREATE INDEX IF NOT EXISTS idx_roadmap_days_user 
    ON public.roadmap_days (user_id);

-- Fast lookup for topics within a day or roadmap
CREATE INDEX IF NOT EXISTS idx_roadmap_topics_day_num 
    ON public.roadmap_topics (day_id, topic_number ASC);

CREATE INDEX IF NOT EXISTS idx_roadmap_topics_roadmap 
    ON public.roadmap_topics (roadmap_id);

CREATE INDEX IF NOT EXISTS idx_roadmap_topics_user 
    ON public.roadmap_topics (user_id);

-- Fast lookup for lessons by topic and user
CREATE INDEX IF NOT EXISTS idx_topic_lessons_topic 
    ON public.topic_lessons (topic_id);

CREATE INDEX IF NOT EXISTS idx_topic_lessons_user 
    ON public.topic_lessons (user_id);

-- Fast lookup for user execution audit logs
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_created 
    ON public.agent_execution_logs (user_id, created_at DESC);

-- 4. Streamlined O(1) Direct RLS Policies
-- Replace nested subqueries with direct user_id checks, falling back to roadmap join if user_id is null
DROP POLICY IF EXISTS "Users view own days" ON public.roadmap_days;
CREATE POLICY "Users view own days" ON public.roadmap_days 
    FOR ALL USING (
        auth.uid() = user_id OR 
        roadmap_id IN (SELECT id FROM public.roadmaps WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users view own topics" ON public.roadmap_topics;
CREATE POLICY "Users view own topics" ON public.roadmap_topics 
    FOR ALL USING (
        auth.uid() = user_id OR 
        roadmap_id IN (SELECT id FROM public.roadmaps WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users view own lessons" ON public.topic_lessons;
CREATE POLICY "Users view own lessons" ON public.topic_lessons 
    FOR ALL USING (
        auth.uid() = user_id OR 
        topic_id IN (SELECT id FROM public.roadmap_topics WHERE user_id = auth.uid())
    );

-- 5. Helper trigger to automatically sync user_id on child records
CREATE OR REPLACE FUNCTION public.sync_roadmap_child_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        SELECT user_id INTO NEW.user_id FROM public.roadmaps WHERE id = NEW.roadmap_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_roadmap_days_user_id ON public.roadmap_days;
CREATE TRIGGER trg_sync_roadmap_days_user_id
    BEFORE INSERT ON public.roadmap_days
    FOR EACH ROW EXECUTE FUNCTION public.sync_roadmap_child_user_id();

DROP TRIGGER IF EXISTS trg_sync_roadmap_topics_user_id ON public.roadmap_topics;
CREATE TRIGGER trg_sync_roadmap_topics_user_id
    BEFORE INSERT ON public.roadmap_topics
    FOR EACH ROW EXECUTE FUNCTION public.sync_roadmap_child_user_id();

