-- =============================================================================
-- Migration: Phase 4 Value-Added Services (Vault, Tontines, Bills & KYC)
-- Description: Schema and atomic RPC functions for savings, tontines, utilities & KYC
-- =============================================================================

-- 1. Table des Coffres d'Épargne (Vaults)
CREATE TABLE IF NOT EXISTS public.vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Coffre Projet Switch',
    locked_amount NUMERIC NOT NULL DEFAULT 0 CHECK (locked_amount >= 0),
    target_amount NUMERIC NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
    interest_rate NUMERIC NOT NULL DEFAULT 4.5, -- 4.5% par an
    unlock_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unlocked', 'broken')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table des Tontines Digitales & Groupes
CREATE TABLE IF NOT EXISTS public.tontines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    contribution_amount NUMERIC NOT NULL CHECK (contribution_amount > 0),
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly')),
    total_pot NUMERIC NOT NULL DEFAULT 0 CHECK (total_pot >= 0),
    current_cycle INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tontine_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payout_order INT NOT NULL,
    has_paid_current_cycle BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tontine_id, user_id)
);

-- 3. Table des Cagnottes Solidaires
CREATE TABLE IF NOT EXISTS public.cagnottes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    category TEXT DEFAULT 'Solidarité',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activation RLS sur les tables Phase 4
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tontine_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cagnottes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaults_user_policy" ON public.vaults;
CREATE POLICY "vaults_user_policy" ON public.vaults
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tontines_select_policy" ON public.tontines;
CREATE POLICY "tontines_select_policy" ON public.tontines
    FOR SELECT USING (
        auth.uid() = creator_id 
        OR auth.uid() IN (SELECT user_id FROM public.tontine_members WHERE tontine_id = tontines.id)
    );

DROP POLICY IF EXISTS "tontine_members_policy" ON public.tontine_members;
CREATE POLICY "tontine_members_policy" ON public.tontine_members
    FOR ALL USING (auth.uid() = user_id OR auth.uid() IN (SELECT creator_id FROM public.tontines WHERE id = tontine_members.tontine_id));

DROP POLICY IF EXISTS "cagnottes_policy" ON public.cagnottes;
CREATE POLICY "cagnottes_policy" ON public.cagnottes
    FOR ALL USING (auth.uid() = creator_id OR status = 'active');

-- =============================================================================
-- PROCEDURES STOCKEES ATOMIQUES (RPC FUNCTIONS)
-- =============================================================================

-- A. Gestion du Coffre-Fort d'Épargne (Dépôt & Retrait)
CREATE OR REPLACE FUNCTION public.manage_vault(
    p_action TEXT, -- 'deposit', 'withdraw'
    p_amount NUMERIC,
    p_title TEXT DEFAULT 'Mon Coffre Projet',
    p_target NUMERIC DEFAULT 100000,
    p_unlock_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_balance NUMERIC;
    v_vault_id UUID;
    v_locked_amt NUMERIC;
    v_unlock_dt TIMESTAMPTZ;
    v_tx_ref TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Montant invalide (doit être supérieur à 0 FCFA).';
    END IF;

    -- Récupération et verrouillage du compte principal
    SELECT id, balance INTO v_user_id, v_balance
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Compte utilisateur introuvable.';
    END IF;

    -- Recherche ou création du coffre actif
    SELECT id, locked_amount, unlock_date INTO v_vault_id, v_locked_amt, v_unlock_dt
    FROM public.vaults
    WHERE user_id = v_user_id AND status = 'active'
    LIMIT 1
    FOR UPDATE;

    IF UPPER(p_action) = 'DEPOSIT' THEN
        -- DÉPÔT DANS LE COFFRE
        IF v_balance < p_amount THEN
            RAISE EXCEPTION 'Solde principal insuffisant (% FCFA disponible, % FCFA requis).', v_balance, p_amount;
        END IF;

        IF v_vault_id IS NULL THEN
            INSERT INTO public.vaults (
                user_id, title, locked_amount, target_amount, unlock_date, status
            ) VALUES (
                v_user_id, p_title, p_amount, GREATEST(p_target, p_amount),
                COALESCE(p_unlock_date, now() + interval '30 days'), 'active'
            )
            RETURNING id, locked_amount INTO v_vault_id, v_locked_amt;
        ELSE
            UPDATE public.vaults
            SET locked_amount = locked_amount + p_amount, updated_at = now()
            WHERE id = v_vault_id
            RETURNING locked_amount INTO v_locked_amt;
        END IF;

        -- Débit du compte courant & crédit du solde coffre profil
        UPDATE public.profiles
        SET balance = balance - p_amount,
            vault_balance = vault_balance + p_amount,
            updated_at = now()
        WHERE id = v_user_id;

        v_tx_ref := 'SW-VAULT-IN-' || lpad(floor(random() * 900000 + 100000)::text, 6, '0');

        INSERT INTO public.transactions (
            tx_ref, sender_id, receiver_id, amount, fee, transaction_type, status, note
        ) VALUES (
            v_tx_ref, v_user_id, v_user_id, p_amount, 0, 'vault_deposit', 'completed', 'Versement dans le Coffre Épargne'
        );

        RETURN jsonb_build_object(
            'success', true,
            'tx_ref', v_tx_ref,
            'action', 'DEPOSIT',
            'amount', p_amount,
            'new_vault_locked_total', v_locked_amt,
            'new_main_balance', v_balance - p_amount
        );

    ELSE
        -- RETRAIT DU COFFRE
        IF v_vault_id IS NULL OR v_locked_amt < p_amount THEN
            RAISE EXCEPTION 'Solde verrouillé dans le coffre insuffisant (% FCFA disponible).', COALESCE(v_locked_amt, 0);
        END IF;

        UPDATE public.vaults
        SET locked_amount = locked_amount - p_amount,
            status = CASE WHEN locked_amount - p_amount = 0 THEN 'unlocked' ELSE 'active' END,
            updated_at = now()
        WHERE id = v_vault_id;

        -- Crédit du compte courant & débit du solde coffre profil
        UPDATE public.profiles
        SET balance = balance + p_amount,
            vault_balance = GREATEST(0, vault_balance - p_amount),
            updated_at = now()
        WHERE id = v_user_id;

        v_tx_ref := 'SW-VAULT-OUT-' || lpad(floor(random() * 900000 + 100000)::text, 6, '0');

        INSERT INTO public.transactions (
            tx_ref, sender_id, receiver_id, amount, fee, transaction_type, status, note
        ) VALUES (
            v_tx_ref, v_user_id, v_user_id, p_amount, 0, 'vault_withdraw', 'completed', 'Déblocage de fonds du Coffre Épargne'
        );

        RETURN jsonb_build_object(
            'success', true,
            'tx_ref', v_tx_ref,
            'action', 'WITHDRAW',
            'amount', p_amount,
            'new_vault_locked_total', v_locked_amt - p_amount,
            'new_main_balance', v_balance + p_amount
        );
    END IF;
END;
$$;

-- B. Cotisation Tontine Digitale
CREATE OR REPLACE FUNCTION public.contribute_tontine(
    p_tontine_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_balance NUMERIC;
    v_pot NUMERIC;
    v_tx_ref TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Montant de cotisation invalide.';
    END IF;

    -- Verrouillage profil
    SELECT id, balance INTO v_user_id, v_balance
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Solde insuffisant pour cotiser à la tontine (% FCFA disponible).', v_balance;
    END IF;

    -- Verrouillage Tontine
    SELECT total_pot INTO v_pot
    FROM public.tontines
    WHERE id = p_tontine_id
    FOR UPDATE;

    IF v_pot IS NULL THEN
        -- Si première tontine
        INSERT INTO public.tontines (creator_id, title, contribution_amount, total_pot)
        VALUES (v_user_id, 'Tontine Mensuelle Switch', p_amount, p_amount)
        RETURNING total_pot INTO v_pot;
    ELSE
        UPDATE public.tontines
        SET total_pot = total_pot + p_amount
        WHERE id = p_tontine_id;
    END IF;

    -- Débit compte membre
    UPDATE public.profiles
    SET balance = balance - p_amount, updated_at = now()
    WHERE id = v_user_id;

    v_tx_ref := 'SW-TONTINE-' || lpad(floor(random() * 900000 + 100000)::text, 6, '0');

    INSERT INTO public.transactions (
        tx_ref, sender_id, amount, fee, transaction_type, status, note
    ) VALUES (
        v_tx_ref, v_user_id, p_amount, 0, 'tontine_contribution', 'completed', 'Cotisation Tontine Switch'
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'amount', p_amount,
        'new_balance', v_balance - p_amount
    );
END;
$$;

-- C. Paiement de Factures & Recharges GSM (SBEE, SONEB, Moov, MTN, Celtiis)
CREATE OR REPLACE FUNCTION public.process_bill_or_airtime_payment(
    p_service_type TEXT, -- 'sbee', 'soneb', 'airtime', 'data'
    p_meter_or_phone TEXT,
    p_amount NUMERIC,
    p_operator TEXT DEFAULT 'Switch Utility'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_balance NUMERIC;
    v_token TEXT;
    v_tx_ref TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Montant de règlement invalide.';
    END IF;

    SELECT id, balance INTO v_user_id, v_balance
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Compte utilisateur introuvable.';
    END IF;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Solde insuffisant (% FCFA disponible, % FCFA requis).', v_balance, p_amount;
    END IF;

    -- Débit du compte
    UPDATE public.profiles
    SET balance = balance - p_amount, updated_at = now()
    WHERE id = v_user_id;

    -- Génération de token de recharge si SBEE
    IF LOWER(p_service_type) = 'sbee' THEN
        v_token := lpad(floor(random() * 9000 + 1000)::text, 4, '0') || ' ' ||
                   lpad(floor(random() * 9000 + 1000)::text, 4, '0') || ' ' ||
                   lpad(floor(random() * 9000 + 1000)::text, 4, '0') || ' ' ||
                   lpad(floor(random() * 9000 + 1000)::text, 4, '0') || ' ' ||
                   lpad(floor(random() * 9000 + 1000)::text, 4, '0');
    ELSE
        v_token := 'REC-' || lpad(floor(random() * 900000 + 100000)::text, 6, '0');
    END IF;

    v_tx_ref := 'SW-BILL-' || lpad(floor(random() * 900000 + 100000)::text, 6, '0');

    INSERT INTO public.transactions (
        tx_ref, sender_id, amount, fee, transaction_type, status, note, metadata
    ) VALUES (
        v_tx_ref, v_user_id, p_amount, 0, LOWER('bill_' || p_service_type), 'completed',
        'Règlement ' || UPPER(p_service_type) || ' (' || p_meter_or_phone || ')',
        jsonb_build_object('token', v_token, 'operator', p_operator, 'target', p_meter_or_phone)
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'service_type', UPPER(p_service_type),
        'amount', p_amount,
        'target', p_meter_or_phone,
        'token', v_token,
        'new_balance', v_balance - p_amount
    );
END;
$$;

-- D. Mise à Niveau du Palier KYC (Tier 1 -> 2 -> 3)
CREATE OR REPLACE FUNCTION public.upgrade_kyc_tier(
    p_tier INT,
    p_doc_type TEXT DEFAULT 'CIP',
    p_doc_number TEXT DEFAULT '0192837465'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Compte introuvable.';
    END IF;

    UPDATE public.profiles
    SET kyc_level = GREATEST(kyc_level, p_tier), updated_at = now()
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_kyc_tier', p_tier,
        'doc_type', p_doc_type,
        'message', 'Profil vérifié avec succès au Niveau ' || p_tier
    );
END;
$$;
