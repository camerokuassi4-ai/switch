-- =============================================================================
-- MIGRATION DE SÉCURITÉ V2.1 : CANARY DÉTERMINISTE 10%, POINT DE LINÉARISATION & REMBOURSEMENT EXACTEMENT UNE FOIS
-- Version: 2.1.3-DETERMINISTIC-CANARY-REFUNDS-QUALIFIED
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table des Comptes de Réserve Séquestre Réels
CREATE TABLE IF NOT EXISTS public.escrow_settlement_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_ref TEXT UNIQUE NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    available_amount NUMERIC NOT NULL DEFAULT 0 CHECK (available_amount >= 0),
    locked_amount NUMERIC NOT NULL DEFAULT 0 CHECK (locked_amount >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table du Contrôleur Canary Serveur avec Pourcentage Déterministe & Plafonds
CREATE TABLE IF NOT EXISTS public.canary_route_controllers (
    route_key TEXT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT false,
    rollout_percent INT NOT NULL DEFAULT 0 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),
    max_transactions INT NOT NULL DEFAULT 50,
    max_volume NUMERIC NOT NULL DEFAULT 1000000 CHECK (max_volume > 0),
    current_transactions INT NOT NULL DEFAULT 0 CHECK (current_transactions >= 0),
    current_volume NUMERIC NOT NULL DEFAULT 0 CHECK (current_volume >= 0),
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    emergency_stop BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initialisation de la route pilote Canary SBEE (Maintenue à enabled = false / 0%)
INSERT INTO public.canary_route_controllers (
    route_key, enabled, rollout_percent, max_transactions, max_volume, current_transactions, current_volume, started_at, expires_at, emergency_stop
) VALUES (
    'ELECTRICITY::SBEE', false, 0, 50, 1000000, 0, 0, NULL, NULL, false
) ON CONFLICT (route_key) DO NOTHING;

-- 3. Table de Routage Fournisseur Déterministe
CREATE TABLE IF NOT EXISTS public.bill_provider_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL,
    operator_code TEXT NOT NULL,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
    provider_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false, -- Maintenu inactif
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (service_type, operator_code)
);

-- 4. Table des Dettes Fournisseurs (Obligations Unitaires)
CREATE TABLE IF NOT EXISTS public.supplier_payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE RESTRICT,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    service_type TEXT NOT NULL,
    operator_code TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    funding_status TEXT NOT NULL DEFAULT 'unfunded' CHECK (funding_status IN ('unfunded', 'funded', 'settled', 'cancelled')),
    clearing_status TEXT NOT NULL DEFAULT 'pending_confirmation' CHECK (clearing_status IN ('pending_confirmation', 'confirmed_by_provider', 'rejected_by_provider')),
    payout_id UUID REFERENCES public.merchant_payouts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (transaction_id)
);

-- 5. Table des Réserves Séquestres Matérialisées
CREATE TABLE IF NOT EXISTS public.supplier_escrow_reserves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payable_id UUID NOT NULL REFERENCES public.supplier_payables(id) ON DELETE RESTRICT,
    escrow_account_id UUID NOT NULL REFERENCES public.escrow_settlement_accounts(id) ON DELETE RESTRICT,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
    allocated_amount NUMERIC NOT NULL CHECK (allocated_amount > 0),
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'disbursed', 'released')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (payable_id)
);

-- 6. Table des Remboursements Déterministes (Remboursement Exactement Une Fois)
CREATE TABLE IF NOT EXISTS public.transaction_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE RESTRICT,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    refunded_amount NUMERIC NOT NULL CHECK (refunded_amount > 0),
    reason TEXT NOT NULL,
    audit_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (transaction_id)
);

-- 7. Table d'Attribution Corrective Append-Only pour Transactions Historiques
CREATE TABLE IF NOT EXISTS public.transaction_merchant_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE RESTRICT,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
    evidence_source TEXT NOT NULL,
    justification TEXT NOT NULL,
    confidence_level TEXT NOT NULL CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'MANUAL_REVIEW_REQUIRED')),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    audit_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (transaction_id)
);

-- 8. Index Unique Partiel d'Idempotence
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_bill_idempotency
ON public.transactions (sender_id, (metadata->>'idempotency_key'))
WHERE transaction_type = 'bill_payment' 
  AND (metadata->>'idempotency_key') IS NOT NULL;

-- 9. Neutralisation Complète de l'Ancienne Fonction V2
REVOKE ALL ON FUNCTION public.process_bill_or_airtime_payment_v2(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.process_bill_or_airtime_payment_v2(
    p_service_type TEXT,
    p_meter_or_phone TEXT,
    p_amount NUMERIC,
    p_idempotency_key TEXT,
    p_operator TEXT DEFAULT 'Switch Utility'::text,
    p_pin_code TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN jsonb_build_object(
        'success', false,
        'error_code', 'CIRCUIT_BREAKER_ACTIVE',
        'message', 'Cette version de la fonction est dépréciée et définitivement suspendue sous circuit breaker.'
    );
END;
$$;

-- 10. Procédure V2.1 Sécurisée avec Sélection Déterministe & Point de Linéarisation
CREATE OR REPLACE FUNCTION public.process_bill_or_airtime_payment_v2_1(
    p_service_type TEXT,
    p_meter_or_phone TEXT,
    p_amount NUMERIC,
    p_idempotency_key TEXT,
    p_operator_code TEXT,
    p_pin_code TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id            UUID := auth.uid();
    v_clean_key          TEXT := TRIM(COALESCE(p_idempotency_key, ''));
    v_clean_service      TEXT := UPPER(TRIM(COALESCE(p_service_type, '')));
    v_clean_operator     TEXT := UPPER(TRIM(COALESCE(p_operator_code, '')));
    v_clean_target       TEXT := TRIM(COALESCE(p_meter_or_phone, ''));
    v_clean_pin          TEXT := TRIM(COALESCE(p_pin_code, ''));
    v_route_key          TEXT := v_clean_service || '::' || v_clean_operator;
    v_user_bucket        INT;
    v_canary_ctrl        RECORD;
    v_escrow_account     RECORD;
    v_user_bal           NUMERIC;
    v_db_pin_hash        TEXT;
    v_merchant_id        UUID;
    v_merchant_active    BOOLEAN;
    v_route_count        INT;
    v_tx_ref             TEXT;
    v_tx_id              UUID;
    v_payable_id         UUID;
    v_existing_tx        RECORD;
    v_sanitized_meta     JSONB;
BEGIN
    -- ÉTAPE 1 : VALIDATION DES PARAMÈTRES D'ENTRÉE
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHORIZED', 'message', 'Session requise.');
    END IF;
    IF v_clean_key = '' OR length(v_clean_key) > 128 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_IDEMPOTENCY_KEY', 'message', 'Clé d''idempotence requise.');
    END IF;
    IF p_amount IS NULL OR p_amount < 500 OR p_amount > 5000000 OR p_amount <> round(p_amount) THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_AMOUNT', 'message', 'Le montant doit être un entier strict entre 500 et 5 000 000 FCFA.');
    END IF;
    IF v_clean_target = '' OR length(v_clean_target) > 32 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_METER_OR_PHONE', 'message', 'Numéro de compteur ou téléphone invalide.');
    END IF;

    -- ÉTAPE 2 : VERROUILLAGE DU PROFIL CLIENT & PIN
    SELECT balance, pin_hash INTO v_user_bal, v_db_pin_hash 
    FROM public.profiles 
    WHERE id = v_user_id 
    FOR UPDATE;

    IF v_user_bal IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'CLIENT_PROFILE_NOT_FOUND', 'message', 'Profil client introuvable.');
    END IF;

    IF v_db_pin_hash IS NOT NULL THEN
        IF v_clean_pin = '' THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'PIN_REQUIRED', 'message', 'Code PIN requis.');
        END IF;
        IF encode(digest(v_clean_pin || v_user_id::text, 'sha256'), 'hex') IS DISTINCT FROM v_db_pin_hash THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_PIN', 'message', 'Code PIN incorrect.');
        END IF;
    END IF;

    -- ÉTAPE 3 & 4 : RECHERCHE IDEMPOTENCE SOUS VERROU ET RETOUR IMMÉDIAT
    SELECT id, tx_ref, amount, metadata, merchant_id, status INTO v_existing_tx 
    FROM public.transactions 
    WHERE sender_id = v_user_id 
      AND transaction_type = 'bill_payment' 
      AND metadata->>'idempotency_key' = v_clean_key
    FOR UPDATE;

    IF FOUND THEN
        -- Conflits multi-paramètres
        IF v_existing_tx.amount IS DISTINCT FROM p_amount THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'IDEMPOTENCY_CONFLICT', 'message', 'Montant différent pour la même clé.');
        END IF;
        IF v_existing_tx.metadata->>'service_type' IS DISTINCT FROM v_clean_service THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'IDEMPOTENCY_CONFLICT', 'message', 'Type de service différent.');
        END IF;
        IF v_existing_tx.metadata->>'operator' IS DISTINCT FROM v_clean_operator THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'IDEMPOTENCY_CONFLICT', 'message', 'Opérateur différent.');
        END IF;

        IF v_existing_tx.status = 'completed' THEN
            RETURN jsonb_build_object('success', true, 'tx_ref', v_existing_tx.tx_ref, 'amount', v_existing_tx.amount, 'merchant_id', v_existing_tx.merchant_id, 'status', 'completed', 'service', v_clean_service, 'idempotent_replay', true, 'message', 'Paiement déjà validé.');
        ELSIF v_existing_tx.status = 'processing' THEN
            RETURN jsonb_build_object('success', true, 'tx_ref', v_existing_tx.tx_ref, 'amount', v_existing_tx.amount, 'merchant_id', v_existing_tx.merchant_id, 'status', 'processing', 'service', v_clean_service, 'idempotent_replay', true, 'message', 'Paiement en cours de compensation fournisseur.');
        ELSIF v_existing_tx.status = 'cancelled' THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'PAYMENT_CANCELLED', 'tx_ref', v_existing_tx.tx_ref, 'amount', v_existing_tx.amount, 'status', 'cancelled', 'service', v_clean_service, 'idempotent_replay', true, 'message', 'Cette transaction a été annulée.');
        ELSE
            RETURN jsonb_build_object('success', false, 'error_code', 'UNEXPECTED_TRANSACTION_STATUS', 'tx_ref', v_existing_tx.tx_ref, 'status', v_existing_tx.status, 'idempotent_replay', true);
        END IF;
    END IF;

    -- ÉTAPE 5 : VÉRIFICATION ROUTE ACTIVE
    SELECT count(*) INTO v_route_count
    FROM public.bill_provider_routes
    WHERE service_type = v_clean_service AND operator_code = v_clean_operator AND is_active = true;

    IF v_route_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'CIRCUIT_BREAKER_ACTIVE', 'message', 'Le service est actuellement suspendu sous circuit breaker.');
    ELSIF v_route_count > 1 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'AMBIGUOUS_ROUTE', 'message', 'Configuration de route ambiguë.');
    END IF;

    SELECT r.merchant_id, m.is_active INTO v_merchant_id, v_merchant_active
    FROM public.bill_provider_routes r
    JOIN public.merchants m ON m.id = r.merchant_id
    WHERE r.service_type = v_clean_service AND r.operator_code = v_clean_operator AND r.is_active = true;

    IF v_merchant_active IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'MERCHANT_INACTIVE', 'message', 'Fournisseur inactif.');
    END IF;

    -- ÉTAPE 6 : POINT DE LINÉARISATION & CONTRÔLEUR CANARY ATOMIQUE
    SELECT * INTO v_canary_ctrl 
    FROM public.canary_route_controllers 
    WHERE route_key = v_route_key 
    FOR UPDATE;

    IF v_canary_ctrl.route_key IS NOT NULL THEN
        -- POINT DE LINÉARISATION : Contrôle d'arrêt d'urgence sous verrou
        IF v_canary_ctrl.enabled IS NOT TRUE OR v_canary_ctrl.emergency_stop IS TRUE THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'CIRCUIT_BREAKER_ACTIVE', 'message', 'Canary pilote actuellement désactivé ou arrêté d''urgence.');
        END IF;

        -- SÉLECTION DÉTERMINISTE CÔTÉ SERVEUR (Pourcentage Canary)
        v_user_bucket := ('x' || substr(md5(v_user_id::text || '::' || v_route_key), 1, 8))::bit(32)::bigint % 100;
        IF v_user_bucket >= v_canary_ctrl.rollout_percent THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'CANARY_USER_NOT_ELIGIBLE', 'message', 'Utilisateur hors de l''échantillon canary pilote.');
        END IF;

        IF v_canary_ctrl.expires_at IS NOT NULL AND now() > v_canary_ctrl.expires_at THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'CANARY_WINDOW_EXPIRED', 'message', 'La fenêtre d''observation du canary est expirée.');
        END IF;
        IF (v_canary_ctrl.current_transactions + 1) > v_canary_ctrl.max_transactions THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'CANARY_TRANSACTION_CAP_EXCEEDED', 'message', 'Plafond de transactions canary atteint (50 max).');
        END IF;
        IF (v_canary_ctrl.current_volume + p_amount) > v_canary_ctrl.max_volume THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'CANARY_VOLUME_CAP_EXCEEDED', 'message', 'Plafond financier cumulé canary atteint (1 000 000 FCFA max).');
        END IF;
    END IF;

    -- ÉTAPE 7 : VERROUILLAGE DU COMPTE SÉQUESTRE
    SELECT id, available_amount, locked_amount, status INTO v_escrow_account
    FROM public.escrow_settlement_accounts
    WHERE account_ref = 'ESCROW-SWITCH-BENIN-UBA' AND status = 'active'
    FOR UPDATE;

    IF v_escrow_account.id IS NULL OR v_escrow_account.available_amount < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'ESCROW_UNFUNDED', 'message', 'Fonds insuffisants sur le compte séquestre.');
    END IF;

    IF v_user_bal < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INSUFFICIENT_FUNDS', 'message', 'Solde client insuffisant.');
    END IF;

    -- ÉTAPE 8 : DÉBIT DU PROFIL CLIENT
    UPDATE public.profiles SET balance = balance - p_amount WHERE id = v_user_id;

    -- ÉTAPE 9 : ALLOCATION DE LA PROVISION SÉQUESTRE
    UPDATE public.escrow_settlement_accounts 
    SET available_amount = available_amount - p_amount,
        locked_amount = locked_amount + p_amount,
        updated_at = now()
    WHERE id = v_escrow_account.id;

    -- ÉTAPE 10 : INCRÉMENT ATOMIQUE DU CONTRÔLEUR CANARY
    IF v_canary_ctrl.route_key IS NOT NULL THEN
        UPDATE public.canary_route_controllers 
        SET current_transactions = current_transactions + 1,
            current_volume = current_volume + p_amount,
            updated_at = now()
        WHERE route_key = v_route_key;
    END IF;

    -- ÉTAPE 11 : INSERTION TRANSACTION GRAND LIVRE (STATUT INITIAL : 'processing')
    v_sanitized_meta := COALESCE(p_metadata, '{}'::jsonb)
        - 'idempotency_key' - 'service_type' - 'operator' - 'meter_or_phone' - 'amount' - 'request_id' - 'merchant_id';

    v_tx_id := gen_random_uuid();
    v_tx_ref := 'SW-BIL-' || replace(gen_random_uuid()::text, '-', '');

    INSERT INTO public.transactions (
        id, tx_ref, sender_id, receiver_id, merchant_id, amount, fee,
        transaction_type, status, note, metadata
    ) VALUES (
        v_tx_id, v_tx_ref, v_user_id, NULL, v_merchant_id, p_amount, 0,
        'bill_payment', 'processing',
        v_clean_service || ' ' || v_clean_operator,
        v_sanitized_meta || jsonb_build_object(
            'idempotency_key', v_clean_key,
            'service_type', v_clean_service,
            'operator', v_clean_operator,
            'meter_or_phone', v_clean_target,
            'amount', p_amount,
            'merchant_id', v_merchant_id
        )
    );

    -- ÉTAPE 12 : OBLIGATION DETTE FOURNISSEUR & RÉSERVE SÉQUESTRE
    v_payable_id := gen_random_uuid();
    INSERT INTO public.supplier_payables (
        id, transaction_id, merchant_id, amount, service_type, operator_code, reference_number, funding_status, clearing_status
    ) VALUES (
        v_payable_id, v_tx_id, v_merchant_id, p_amount, v_clean_service, v_clean_operator, v_clean_target, 'funded', 'pending_confirmation'
    );

    INSERT INTO public.supplier_escrow_reserves (
        payable_id, escrow_account_id, merchant_id, allocated_amount, status
    ) VALUES (
        v_payable_id, v_escrow_account.id, v_merchant_id, p_amount, 'locked'
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'amount', p_amount,
        'merchant_id', v_merchant_id,
        'payable_id', v_payable_id,
        'status', 'processing',
        'service', v_clean_service,
        'idempotent_replay', false,
        'message', 'Paiement accepté et en cours de compensation fournisseur.'
    );
END;
$$;

-- 11. Procédure Callback de Confirmation / Rejet Fournisseur avec Remboursement Idempotent
CREATE OR REPLACE FUNCTION public.confirm_bill_provider_clearing(
    p_transaction_id UUID,
    p_clearing_outcome TEXT, -- 'CONFIRMED' ou 'REJECTED'
    p_provider_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tx             RECORD;
    v_payable        RECORD;
    v_escrow         RECORD;
    v_existing_ref   RECORD;
    v_audit_hash     TEXT;
BEGIN
    SELECT * INTO v_tx FROM public.transactions WHERE id = p_transaction_id FOR UPDATE;
    IF v_tx.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'TRANSACTION_NOT_FOUND');
    END IF;

    -- Si déjà cancelled, vérifier si le remboursement a déjà été fait
    IF v_tx.status = 'cancelled' THEN
        SELECT * INTO v_existing_ref FROM public.transaction_refunds WHERE transaction_id = v_tx.id;
        IF FOUND THEN
            RETURN jsonb_build_object('success', true, 'status', 'cancelled', 'already_refunded', true, 'refunded_amount', v_existing_ref.refunded_amount, 'tx_ref', v_tx.tx_ref);
        END IF;
    END IF;

    IF v_tx.status IS DISTINCT FROM 'processing' AND v_tx.status IS DISTINCT FROM 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_STATE_TRANSITION', 'message', 'La transaction n''est pas en attente de compensation.');
    END IF;

    SELECT * INTO v_payable FROM public.supplier_payables WHERE transaction_id = v_tx.id FOR UPDATE;
    SELECT * INTO v_escrow FROM public.escrow_settlement_accounts WHERE account_ref = 'ESCROW-SWITCH-BENIN-UBA' FOR UPDATE;

    IF p_clearing_outcome = 'CONFIRMED' THEN
        UPDATE public.transactions SET status = 'completed' WHERE id = v_tx.id;
        UPDATE public.supplier_payables SET clearing_status = 'confirmed_by_provider' WHERE id = v_payable.id;
        RETURN jsonb_build_object('success', true, 'status', 'completed', 'tx_ref', v_tx.tx_ref);

    ELSIF p_clearing_outcome = 'REJECTED' THEN
        -- Contrôle d'unicité du remboursement (Idempotence de remboursement)
        SELECT * INTO v_existing_ref FROM public.transaction_refunds WHERE transaction_id = v_tx.id FOR UPDATE;
        IF FOUND THEN
            RETURN jsonb_build_object('success', true, 'status', 'cancelled', 'already_refunded', true, 'refunded_amount', v_existing_ref.refunded_amount, 'tx_ref', v_tx.tx_ref);
        END IF;

        v_audit_hash := encode(digest(v_tx.id::text || v_tx.sender_id::text || v_tx.amount::text || 'REJECTED_BY_PROVIDER', 'sha256'), 'hex');

        -- Insertion du remboursement unique
        INSERT INTO public.transaction_refunds (transaction_id, sender_id, refunded_amount, reason, audit_hash)
        VALUES (v_tx.id, v_tx.sender_id, v_tx.amount, 'Rejet fournisseur: ' || COALESCE(p_provider_reference, 'Régie indisponible'), v_audit_hash);

        UPDATE public.transactions SET status = 'cancelled' WHERE id = v_tx.id;
        UPDATE public.supplier_payables SET clearing_status = 'rejected_by_provider', funding_status = 'cancelled' WHERE id = v_payable.id;
        UPDATE public.supplier_escrow_reserves SET status = 'released' WHERE payable_id = v_payable.id;

        -- Crédit unique du solde client
        UPDATE public.profiles SET balance = balance + v_tx.amount WHERE id = v_tx.sender_id;

        -- Libération unique séquestre vers available
        UPDATE public.escrow_settlement_accounts 
        SET available_amount = available_amount + v_tx.amount,
            locked_amount = locked_amount - v_tx.amount 
        WHERE id = v_escrow.id;

        RETURN jsonb_build_object('success', true, 'status', 'cancelled', 'refunded_amount', v_tx.amount, 'tx_ref', v_tx.tx_ref, 'already_refunded', false);
    ELSE
        RETURN jsonb_build_object('success', false, 'error_code', 'UNKNOWN_CLEARING_OUTCOME');
    END IF;
END;
$$;

-- Privilèges
REVOKE ALL ON FUNCTION public.process_bill_or_airtime_payment_v2_1(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_bill_or_airtime_payment_v2_1(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION public.confirm_bill_provider_clearing(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_bill_provider_clearing(UUID, TEXT, TEXT) TO service_role;

-- RLS & Privilèges sur canary_route_controllers (Inaccessible en écriture pour authenticated)
ALTER TABLE public.canary_route_controllers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "canary_controllers_read" ON public.canary_route_controllers;
CREATE POLICY "canary_controllers_read" ON public.canary_route_controllers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "canary_controllers_write" ON public.canary_route_controllers;
CREATE POLICY "canary_controllers_write" ON public.canary_route_controllers FOR ALL TO service_role USING (true);

COMMIT;
