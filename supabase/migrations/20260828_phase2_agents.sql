-- =============================================================================
-- Migration: Phase 2 Agent Space & Float Management
-- Description: Agent cash operations, commission payout RPCs, cashier sessions
-- =============================================================================

-- 1. Table des sessions de caisse (Rapports Z journaliers)
CREATE TABLE IF NOT EXISTS public.cashier_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ,
    opening_float NUMERIC NOT NULL DEFAULT 0 CHECK (opening_float >= 0),
    closing_float NUMERIC CHECK (closing_float >= 0),
    total_cash_in NUMERIC NOT NULL DEFAULT 0 CHECK (total_cash_in >= 0),
    total_cash_out NUMERIC NOT NULL DEFAULT 0 CHECK (total_cash_out >= 0),
    total_commissions NUMERIC NOT NULL DEFAULT 0 CHECK (total_commissions >= 0),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activation RLS sur cashier_sessions
ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cashier_sessions_policy" ON public.cashier_sessions;
CREATE POLICY "cashier_sessions_policy" ON public.cashier_sessions
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM public.agents WHERE id = cashier_sessions.agent_id)
        OR auth.uid() IN (SELECT id FROM public.profiles WHERE phone = '+229 01 22 90 19 07')
    );

-- =============================================================================
-- PROCEDURES STOCKEES ATOMIQUES (RPC FUNCTIONS)
-- =============================================================================

-- A. Récupération des Données du Tableau de Bord Agent
CREATE OR REPLACE FUNCTION public.get_agent_dashboard_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent RECORD;
    v_active_session RECORD;
    v_tx_today_count INT;
    v_tx_today_volume NUMERIC;
BEGIN
    -- Récupère le premier agent actif associé au profil ou le guichet principal
    SELECT * INTO v_agent
    FROM public.agents
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_agent.id IS NULL THEN
        RAISE EXCEPTION 'Aucun profil agent distributeur actif trouvé.';
    END IF;

    -- Calcul des stats du jour
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(SUM(amount), 0)
    INTO v_tx_today_count, v_tx_today_volume
    FROM public.transactions
    WHERE agent_id = v_agent.id
      AND created_at >= date_trunc('day', now());

    RETURN jsonb_build_object(
        'success', true,
        'agent_id', v_agent.id,
        'business_name', v_agent.business_name,
        'agent_code', v_agent.agent_code,
        'phone', v_agent.phone,
        'float_balance', v_agent.float_balance,
        'commissions_balance', v_agent.commissions_balance,
        'today_transactions_count', v_tx_today_count,
        'today_volume', v_tx_today_volume
    );
END;
$$;

-- B. Retrait des Commissions de l'Agent vers son Compte Personnel
CREATE OR REPLACE FUNCTION public.withdraw_agent_commissions(
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_id UUID;
    v_agent_user_id UUID;
    v_comm_balance NUMERIC;
    v_tx_ref TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Montant de retrait de commissions invalide (doit être supérieur à 0 FCFA).';
    END IF;

    -- 1. Récupération et verrouillage de l'agent
    SELECT id, user_id, commissions_balance 
    INTO v_agent_id, v_agent_user_id, v_comm_balance
    FROM public.agents
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'Compte agent distributeur introuvable.';
    END IF;

    IF v_comm_balance < p_amount THEN
        RAISE EXCEPTION 'Solde de commissions insuffisant (% FCFA disponible, % FCFA demandé).', v_comm_balance, p_amount;
    END IF;

    -- 2. Débit des commissions
    UPDATE public.agents
    SET commissions_balance = commissions_balance - p_amount
    WHERE id = v_agent_id;

    -- 3. Crédit du compte principal du distributeur
    IF v_agent_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET balance = balance + p_amount, updated_at = now()
        WHERE id = v_agent_user_id;
    END IF;

    v_tx_ref := 'SW-COMM-' || lpad(floor(random() * 900000 + 100000)::text, 6, '0');

    -- 4. Inscription au Grand Livre
    INSERT INTO public.transactions (
        tx_ref, sender_id, receiver_id, agent_id, amount, fee, transaction_type, status, note
    ) VALUES (
        v_tx_ref, v_agent_user_id, v_agent_user_id, v_agent_id, p_amount, 0, 
        'commission_payout', 'completed', 'Virement commissions vers solde personnel'
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'amount', p_amount,
        'remaining_commissions', v_comm_balance - p_amount
    );
END;
$$;

-- C. Clôture de Session de Caisse Journalière (Rapport Z)
CREATE OR REPLACE FUNCTION public.close_cashier_session(
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_id UUID;
    v_agent_float NUMERIC;
    v_agent_comm NUMERIC;
    v_total_cash_in NUMERIC := 0;
    v_total_cash_out NUMERIC := 0;
    v_session_id UUID;
BEGIN
    SELECT id, float_balance, commissions_balance 
    INTO v_agent_id, v_agent_float, v_agent_comm
    FROM public.agents
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'Compte agent introuvable.';
    END IF;

    -- Calcul des volumes de la journée
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'agent_deposit' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'agent_withdrawal' THEN amount ELSE 0 END), 0)
    INTO v_total_cash_in, v_total_cash_out
    FROM public.transactions
    WHERE agent_id = v_agent_id
      AND created_at >= date_trunc('day', now());

    -- Création / Clôture de l'enregistrement de session
    INSERT INTO public.cashier_sessions (
        agent_id, opened_at, closed_at, opening_float, closing_float,
        total_cash_in, total_cash_out, total_commissions, status, notes
    ) VALUES (
        v_agent_id, date_trunc('day', now()), now(), v_agent_float, v_agent_float,
        v_total_cash_in, v_total_cash_out, v_agent_comm, 'closed', p_notes
    )
    RETURNING id INTO v_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_session_id,
        'closing_float', v_agent_float,
        'total_cash_in', v_total_cash_in,
        'total_cash_out', v_total_cash_out,
        'total_commissions', v_agent_comm,
        'closed_at', now()
    );
END;
$$;
