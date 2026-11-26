-- Migration: Enforce Hard Token Quotas and Automatic 30-Day Cycle Rollover
-- File: supabase/migrations/20261017000000_enforce_token_budget_quota.sql

CREATE OR REPLACE FUNCTION public.increment_token_budget(p_user_id UUID, p_tokens INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_record RECORD;
    v_current_used INTEGER := 0;
    v_max_monthly INTEGER := 250000;
    v_resets_at TIMESTAMPTZ;
    v_new_total INTEGER;
BEGIN
    -- 1. Fetch current budget row with row-level lock
    SELECT * INTO v_record FROM public.token_budgets WHERE user_id = p_user_id FOR UPDATE;

    IF FOUND THEN
        v_current_used := COALESCE(v_record.tokens_used_current_cycle, 0);
        v_max_monthly := COALESCE(v_record.max_tokens_monthly, 250000);
        v_resets_at := v_record.cycle_resets_at;

        -- Automatic 30-day billing cycle rollover if expiration has passed
        IF v_resets_at IS NOT NULL AND NOW() >= v_resets_at THEN
            v_current_used := 0;
            UPDATE public.token_budgets
            SET tokens_used_current_cycle = 0,
                cycle_resets_at = NOW() + INTERVAL '30 days',
                updated_at = NOW()
            WHERE user_id = p_user_id;
        END IF;

        -- Hard Quota Enforcement Check
        IF (v_current_used + p_tokens) > v_max_monthly THEN
            RAISE EXCEPTION 'TOKEN_QUOTA_EXCEEDED: User has exhausted their monthly reasoning token budget (% / % tokens used).',
                v_current_used, v_max_monthly;
        END IF;

        v_new_total := v_current_used + p_tokens;
        UPDATE public.token_budgets
        SET tokens_used_current_cycle = v_new_total,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        RETURN v_new_total;
    ELSE
        IF p_tokens > 250000 THEN
            RAISE EXCEPTION 'TOKEN_QUOTA_EXCEEDED: Requested tokens exceed monthly quota.';
        END IF;

        INSERT INTO public.token_budgets (user_id, tokens_used_current_cycle, max_tokens_monthly, updated_at)
        VALUES (p_user_id, p_tokens, 250000, NOW())
        RETURNING tokens_used_current_cycle INTO v_new_total;

        RETURN v_new_total;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_token_budget(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_token_budget(UUID, INTEGER) TO anon;

