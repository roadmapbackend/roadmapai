-- Roadmap.ai Dynamic Token Budget & Execution Tracking Migration
-- File: supabase/migrations/20261016180000_dynamic_user_tokens.sql

-- 1. Ensure table structure for token_budgets
CREATE TABLE IF NOT EXISTS public.token_budgets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tokens_used_current_cycle INTEGER DEFAULT 0,
    max_tokens_monthly INTEGER DEFAULT 250000,
    tier TEXT DEFAULT 'free',
    cycle_resets_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure tier column exists if table was already created
ALTER TABLE public.token_budgets 
    ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS cycle_resets_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Ensure table structure for agent_execution_logs
CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost_usd NUMERIC(8,6) DEFAULT 0.000000,
    latency_ms INTEGER NOT NULL DEFAULT 300,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'rate_limited')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS) on token_budgets
ALTER TABLE public.token_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own token budget" ON public.token_budgets;
CREATE POLICY "Users view own token budget" 
    ON public.token_budgets 
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own token budget" ON public.token_budgets;
CREATE POLICY "Users insert own token budget" 
    ON public.token_budgets 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own token budget" ON public.token_budgets;
CREATE POLICY "Users update own token budget" 
    ON public.token_budgets 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own token budget" ON public.token_budgets;
CREATE POLICY "Users manage own token budget" 
    ON public.token_budgets 
    FOR ALL 
    USING (auth.uid() = user_id);

-- 4. Row Level Security (RLS) on agent_execution_logs
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own agent logs" ON public.agent_execution_logs;
CREATE POLICY "Users view own agent logs" 
    ON public.agent_execution_logs 
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own agent logs" ON public.agent_execution_logs;
CREATE POLICY "Users insert own agent logs" 
    ON public.agent_execution_logs 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 5. Atomic stored procedure to increment tokens safely in PostgreSQL
CREATE OR REPLACE FUNCTION public.increment_token_budget(p_user_id UUID, p_tokens INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_total INTEGER;
BEGIN
    INSERT INTO public.token_budgets (user_id, tokens_used_current_cycle, max_tokens_monthly, updated_at)
    VALUES (p_user_id, p_tokens, 250000, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET tokens_used_current_cycle = public.token_budgets.tokens_used_current_cycle + p_tokens,
        updated_at = NOW()
    RETURNING tokens_used_current_cycle INTO v_total;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Stored procedure to update user subscription tier and max monthly tokens
CREATE OR REPLACE FUNCTION public.update_user_subscription(p_user_id UUID, p_tier TEXT, p_max_tokens INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET subscription_tier = p_tier, updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO public.token_budgets (user_id, tokens_used_current_cycle, max_tokens_monthly, tier, updated_at)
    VALUES (p_user_id, 0, p_max_tokens, p_tier, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET max_tokens_monthly = p_max_tokens,
        tier = p_tier,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execution privileges to authenticated & anon roles
GRANT EXECUTE ON FUNCTION public.increment_token_budget(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_token_budget(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_subscription(UUID, TEXT, INTEGER) TO authenticated;

