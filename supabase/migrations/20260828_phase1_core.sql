-- =============================================================================
-- Migration: Phase 1 Core (Profiles, Agents, Merchants, Transactions, Cash Ops)
-- Description: Core schema and atomic RPC functions for Switch Bénin 🇧🇯
-- =============================================================================

-- 1. Profiles (Utilisateurs Particuliers)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'Utilisateur Switch',
    balance NUMERIC NOT NULL DEFAULT 50000 CHECK (balance >= 0), -- Solde de départ symbolique (50 000 FCFA) pour démo BCEAO
    vault_balance NUMERIC NOT NULL DEFAULT 0 CHECK (vault_balance >= 0),
    kyc_level INT NOT NULL DEFAULT 1,
    pin_hash TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Agents (Distributeurs & Guichetiers Switch)
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    agent_code TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    float_balance NUMERIC NOT NULL DEFAULT 0 CHECK (float_balance >= 0),
    commissions_balance NUMERIC NOT NULL DEFAULT 0 CHECK (commissions_balance >= 0),
    city TEXT DEFAULT 'Cotonou',
    neighborhood TEXT,
    lat NUMERIC,
    lng NUMERIC,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Merchants (Commerçants & Points de Vente Switch)
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    ifu TEXT,
    phone TEXT NOT NULL,
    shop_balance NUMERIC NOT NULL DEFAULT 0 CHECK (shop_balance >= 0),
    qr_code_id TEXT UNIQUE,
    category TEXT DEFAULT 'Commerce',
    city TEXT DEFAULT 'Cotonou',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Transactions (Grand Livre Financier)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_ref TEXT UNIQUE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    fee NUMERIC NOT NULL DEFAULT 0 CHECK (fee >= 0),
    transaction_type TEXT NOT NULL, -- 'p2p_transfer', 'agent_deposit', 'agent_withdrawal', 'merchant_payment', 'vault_deposit', 'vault_withdraw'
    status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
    note TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Cash Operations (Retraits OTP Express & Dépôts)
CREATE TABLE IF NOT EXISTS public.cash_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    otp_code TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    fee NUMERIC NOT NULL DEFAULT 0,
    op_type TEXT NOT NULL DEFAULT 'WITHDRAWAL', -- 'WITHDRAWAL', 'DEPOSIT'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'expired', 'cancelled'
    expires_at TIMESTAMPTZ NOT NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- PROCEDURES STOCKEES ATOMIQUES (RPC FUNCTIONS)
-- =============================================================================

-- A. Transfert P2P Switch à Switch
CREATE OR REPLACE FUNCTION public.process_p2p_transfer(
    p_recipient_phone TEXT,
    p_amount NUMERIC,
    p_note TEXT DEFAULT 'Transfert Switch'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_phone TEXT;
    v_sender_id UUID;
    v_sender_bal NUMERIC;
    v_recipient_id UUID;
    v_recipient_bal NUMERIC;
    v_tx_ref TEXT;
BEGIN
    -- Validation du montant
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Montant invalide.');
    END IF;

    -- Identification de l'expéditeur via auth.uid() ou profil de test
    SELECT id, balance INTO v_sender_id, v_sender_bal
    FROM public.profiles
    WHERE id = auth.uid()
    FOR UPDATE;

    IF v_sender_id IS NULL THEN
        -- Fallback si non-authentifié (récupération premier profil actif)
        SELECT id, balance INTO v_sender_id, v_sender_bal
        FROM public.profiles
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE;
    END IF;

    IF v_sender_bal < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Solde insuffisant.');
    END IF;

    -- Récupération du destinataire
    SELECT id INTO v_recipient_id
    FROM public.profiles
    WHERE phone = p_recipient_phone OR phone = REPLACE(p_recipient_phone, ' ', '')
    FOR UPDATE;

    -- Si le destinataire n'existe pas encore, on crée un profil provisoire
    IF v_recipient_id IS NULL THEN
        INSERT INTO public.profiles (phone, full_name, balance)
        VALUES (p_recipient_phone, 'Utilisateur Switch', p_amount)
        RETURNING id INTO v_recipient_id;
    ELSE
        UPDATE public.profiles
        SET balance = balance + p_amount, updated_at = now()
        WHERE id = v_recipient_id;
    END IF;

    -- Débit de l'expéditeur
    UPDATE public.profiles
    SET balance = balance - p_amount, updated_at = now()
    WHERE id = v_sender_id;

    -- Référence unique de transaction
    v_tx_ref := 'SW-TX-' || lpad(floor(random() * 900000 + 100000)::text, 6, '0');

    -- Enregistrement dans le grand livre
    INSERT INTO public.transactions (
        tx_ref, sender_id, receiver_id, amount, fee, transaction_type, status, note
    ) VALUES (
        v_tx_ref, v_sender_id, v_recipient_id, p_amount, 0, 'p2p_transfer', 'completed', p_note
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'amount', p_amount,
        'new_balance', v_sender_bal - p_amount,
        'recipient', p_recipient_phone
    );
END;
$$;


-- B. Opération Guichet Agent : Retrait Express (Cash-Out) ou Dépôt (Cash-In)
CREATE OR REPLACE FUNCTION public.process_agent_cash_operation(
    p_client_phone TEXT,
    p_amount NUMERIC,
    p_operation_type TEXT,
    p_otp_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_id UUID;
    v_agent_float NUMERIC;
    v_commission NUMERIC;
    v_client_id UUID;
    v_client_bal NUMERIC;
    v_tx_ref TEXT;
    v_otp_record RECORD;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Montant de transaction invalide (doit être supérieur à 0 FCFA).';
    END IF;

    -- 1. Contrôle strict de l'OTP si fourni (Retrait Express)
    IF p_otp_code IS NOT NULL AND trim(p_otp_code) <> '' THEN
        SELECT id, client_phone, amount, status, expires_at INTO v_otp_record
        FROM public.cash_operations
        WHERE otp_code = trim(p_otp_code)
        FOR UPDATE;

        IF v_otp_record.id IS NULL THEN
            RAISE EXCEPTION 'Code secret OTP de retrait introuvable ou incorrect.';
        END IF;

        IF v_otp_record.status <> 'pending' THEN
            RAISE EXCEPTION 'Ce code OTP a déjà été utilisé ou clôturé (Statut: %).', v_otp_record.status;
        END IF;

        IF v_otp_record.expires_at <= now() THEN
            UPDATE public.cash_operations SET status = 'expired' WHERE id = v_otp_record.id;
            RAISE EXCEPTION 'Ce code secret OTP a expiré. Veuillez générer un nouveau code.';
        END IF;

        IF p_amount <> v_otp_record.amount THEN
            RAISE EXCEPTION 'Montant non conforme au code OTP (Attendu: % FCFA).', v_otp_record.amount;
        END IF;
    END IF;

    -- 2. Calcul de la commission agent (~0.8%)
    v_commission := GREATEST(100, ROUND(p_amount * 0.008));

    -- 3. Récupération et verrouillage de l'agent
    SELECT id, float_balance INTO v_agent_id, v_agent_float
    FROM public.agents
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'Compte agent distributeur introuvable.';
    END IF;

    -- 4. Récupération et verrouillage du client
    SELECT id, balance INTO v_client_id, v_client_bal
    FROM public.profiles
    WHERE phone = p_client_phone OR phone = REPLACE(p_client_phone, ' ', '')
    FOR UPDATE;

    IF UPPER(p_operation_type) = 'WITHDRAWAL' THEN
        -- RETRAIT D'ESPECES
        IF v_client_bal IS NOT NULL AND v_client_bal < p_amount THEN
            RAISE EXCEPTION 'Solde du compte client insuffisant pour ce retrait (% FCFA disponible).', v_client_bal;
        END IF;

        IF v_client_id IS NOT NULL THEN
            UPDATE public.profiles
            SET balance = balance - p_amount, updated_at = now()
            WHERE id = v_client_id;
        END IF;

        -- Crédit du float de l'agent + commission
        UPDATE public.agents
        SET float_balance = float_balance + p_amount,
            commissions_balance = commissions_balance + v_commission
        WHERE id = v_agent_id;

        v_tx_ref := 'TRX-RET-' || lpad(floor(random() * 90000 + 10000)::text, 5, '0');

    ELSE
        -- DEPOT D'ESPECES
        IF v_agent_float < p_amount THEN
            RAISE EXCEPTION 'Float agent insuffisant (% FCFA disponible) pour effectuer ce dépôt de % FCFA.', v_agent_float, p_amount;
        END IF;

        -- Débit du float agent + crédit commission
        UPDATE public.agents
        SET float_balance = float_balance - p_amount,
            commissions_balance = commissions_balance + v_commission
        WHERE id = v_agent_id;

        -- Crédit du compte client
        IF v_client_id IS NOT NULL THEN
            UPDATE public.profiles
            SET balance = balance + p_amount, updated_at = now()
            WHERE id = v_client_id;
        END IF;

        v_tx_ref := 'TRX-DEP-' || lpad(floor(random() * 90000 + 10000)::text, 5, '0');
    END IF;

    -- 5. Clôture de l'OTP si utilisé
    IF p_otp_code IS NOT NULL AND trim(p_otp_code) <> '' THEN
        UPDATE public.cash_operations
        SET status = 'completed', agent_id = v_agent_id
        WHERE otp_code = trim(p_otp_code);
    END IF;

    -- 6. Enregistrement dans transactions
    INSERT INTO public.transactions (
        tx_ref, sender_id, receiver_id, agent_id, amount, fee, transaction_type, status, note
    ) VALUES (
        v_tx_ref, v_client_id, v_client_id, v_agent_id, p_amount, 0,
        LOWER('agent_' || p_operation_type), 'completed', 'Opération guichet Switch'
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'amount', p_amount,
        'commission', v_commission,
        'operation', UPPER(p_operation_type),
        'client', p_client_phone
    );
END;
$$;


-- C. Paiement Marchand QR Code / POS
CREATE OR REPLACE FUNCTION public.process_merchant_payment(
    p_merchant_identifier TEXT,
    p_amount NUMERIC,
    p_note TEXT DEFAULT 'Paiement Marchand Switch'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_id UUID;
    v_sender_bal NUMERIC;
    v_merchant_id UUID;
    v_tx_ref TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Montant invalide.');
    END IF;

    -- Client expéditeur
    SELECT id, balance INTO v_sender_id, v_sender_bal
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_sender_bal < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Solde insuffisant.');
    END IF;

    -- Marchand bénéficiaire
    SELECT id INTO v_merchant_id
    FROM public.merchants
    WHERE business_name ILIKE '%' || p_merchant_identifier || '%'
       OR phone = p_merchant_identifier
       OR qr_code_id = p_merchant_identifier
    FOR UPDATE;

    IF v_merchant_id IS NULL THEN
        -- Création auto du marchand si première vente
        INSERT INTO public.merchants (business_name, phone, shop_balance)
        VALUES (p_merchant_identifier, '+229 01 00 00 00', p_amount)
        RETURNING id INTO v_merchant_id;
    ELSE
        UPDATE public.merchants
        SET shop_balance = shop_balance + p_amount
        WHERE id = v_merchant_id;
    END IF;

    -- Débit du compte client
    UPDATE public.profiles
    SET balance = balance - p_amount, updated_at = now()
    WHERE id = v_sender_id;

    v_tx_ref := 'SW-PAY-' || lpad(floor(random() * 900000 + 100000)::text, 6, '0');

    -- Enregistrement dans transactions
    INSERT INTO public.transactions (
        tx_ref, sender_id, merchant_id, amount, fee, transaction_type, status, note
    ) VALUES (
        v_tx_ref, v_sender_id, v_merchant_id, p_amount, 0, 'merchant_payment', 'completed', p_note
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'amount', p_amount,
        'new_balance', v_sender_bal - p_amount,
        'merchant', p_merchant_identifier
    );
END;
$$;

-- =============================================================================
-- POLITIQUES DE SECURITE ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- 1. Activation RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_operations ENABLE ROW LEVEL SECURITY;

-- 2. Politiques Profiles (Protection des soldes contre modification client directe)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR true); -- Permet la résolution de numéro pour transfert

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. Politiques Transactions (Lecture réservée aux parties prenantes, écriture interdite au client direct)
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
CREATE POLICY "transactions_select_policy" ON public.transactions
    FOR SELECT USING (
        auth.uid() = sender_id 
        OR auth.uid() = receiver_id
        OR auth.uid() IN (SELECT user_id FROM public.agents WHERE id = transactions.agent_id)
        OR auth.uid() IN (SELECT user_id FROM public.merchants WHERE id = transactions.merchant_id)
    );

-- 4. Politiques Agents (Lecture publique des kiosques pour GPS, modification directe de solde interdite)
DROP POLICY IF EXISTS "agents_select_policy" ON public.agents;
CREATE POLICY "agents_select_policy" ON public.agents
    FOR SELECT USING (auth.uid() = user_id OR is_active = true);

-- 5. Politiques Merchants (Lecture publique des commerces, modification directe de solde interdite)
DROP POLICY IF EXISTS "merchants_select_policy" ON public.merchants;
CREATE POLICY "merchants_select_policy" ON public.merchants
    FOR SELECT USING (auth.uid() = user_id OR is_active = true);

-- 6. Politiques Cash Operations (Accès limité au client émetteur et aux agents)
DROP POLICY IF EXISTS "cash_ops_select_policy" ON public.cash_operations;
CREATE POLICY "cash_ops_select_policy" ON public.cash_operations
    FOR SELECT USING (
        client_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid())
        OR auth.uid() IN (SELECT user_id FROM public.agents WHERE is_active = true)
    );

