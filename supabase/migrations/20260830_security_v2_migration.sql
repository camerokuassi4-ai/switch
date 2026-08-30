-- =============================================================================
-- SWITCH FINTECH BENIN - MIGRATION DE SÉCURITÉ V2 CONSOLIDÉE
-- Version: 2.0.0-STAGING-VALIDATED
-- Date: 2026-08-30
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Index d'unicité profil agent actif par utilisateur
CREATE UNIQUE INDEX IF NOT EXISTS agents_one_active_profile_per_user
ON public.agents (user_id)
WHERE is_active = true;

-- 2. Index d'idempotence client pérenne
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_operations_client_idempotency
ON public.cash_operations(client_user_id, idempotency_key)
WHERE client_user_id IS NOT NULL 
  AND idempotency_key IS NOT NULL 
  AND trim(idempotency_key) <> '';

-- 3. Index d'idempotence agent
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_operations_agent_idempotency
ON public.cash_operations(agent_id, idempotency_key)
WHERE agent_id IS NOT NULL 
  AND idempotency_key IS NOT NULL 
  AND trim(idempotency_key) <> '';

-- 4. Index d'idempotence grand livre (Portée: agent + type d'opération + clé)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_agent_op_idempotency
ON public.transactions (agent_id, (metadata->>'operation_type'), (metadata->>'idempotency_key'))
WHERE agent_id IS NOT NULL 
  AND (metadata->>'idempotency_key') IS NOT NULL;

-- 5. Index d'unicité stricte 1:1 (Une transaction par cash_operation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_cash_operation_id
ON public.transactions ((metadata->>'request_id'))
WHERE (metadata->>'request_id') IS NOT NULL;

-- 6. Index d'idempotence grand livre client (P2P et Factures)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_sender_idempotency
ON public.transactions (sender_id, (metadata->>'idempotency_key'))
WHERE sender_id IS NOT NULL 
  AND (metadata->>'idempotency_key') IS NOT NULL;

-- 7. Procédure V2 : process_p2p_transfer_secure_v2
CREATE OR REPLACE FUNCTION public.process_p2p_transfer_secure_v2(
    p_recipient_phone TEXT,
    p_amount NUMERIC,
    p_pin_code TEXT,
    p_idempotency_key TEXT,
    p_note TEXT DEFAULT 'Transfert Switch'::text
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sender_id UUID := auth.uid();
    v_clean_key TEXT := TRIM(COALESCE(p_idempotency_key, ''));
    v_clean_phone TEXT := TRIM(COALESCE(p_recipient_phone, ''));
    v_sender_bal NUMERIC;
    v_recipient_id UUID;
    v_recipient_count INT;
    v_tx_ref TEXT;
BEGIN
    IF v_sender_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHORIZED', 'message', 'Session requise.');
    END IF;
    IF v_clean_key = '' OR length(v_clean_key) > 128 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_IDEMPOTENCY_KEY', 'message', 'Clé d''idempotence requise.');
    END IF;
    IF p_amount IS NULL OR p_amount < 500 OR p_amount > 5000000 OR p_amount <> round(p_amount) THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_AMOUNT', 'message', 'Montant invalide.');
    END IF;

    -- Idempotence check via grand livre
    SELECT tx_ref INTO v_tx_ref FROM public.transactions 
    WHERE sender_id = v_sender_id AND metadata->>'idempotency_key' = v_clean_key;
    
    IF v_tx_ref IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'tx_ref', v_tx_ref, 'amount', p_amount, 'idempotent_replay', true, 'message', 'Transfert déjà validé.');
    END IF;

    SELECT balance INTO v_sender_bal FROM public.profiles WHERE id = v_sender_id FOR UPDATE;
    IF v_sender_bal < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INSUFFICIENT_FUNDS', 'message', 'Solde insuffisant.');
    END IF;

    SELECT count(*) INTO v_recipient_count FROM public.profiles WHERE phone = v_clean_phone;
    IF v_recipient_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'RECIPIENT_NOT_FOUND', 'message', 'Destinataire introuvable.');
    ELSIF v_recipient_count > 1 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'AMBIGUOUS_RECIPIENT', 'message', 'Plusieurs profils détectés avec ce numéro.');
    END IF;

    SELECT id INTO v_recipient_id FROM public.profiles WHERE phone = v_clean_phone FOR UPDATE;

    UPDATE public.profiles SET balance = balance - p_amount WHERE id = v_sender_id;
    UPDATE public.profiles SET balance = balance + p_amount WHERE id = v_recipient_id;

    v_tx_ref := 'SW-P2P-' || replace(gen_random_uuid()::text, '-', '');
    INSERT INTO public.transactions (
        tx_ref, sender_id, receiver_id, amount, fee, transaction_type, status, note, metadata
    ) VALUES (
        v_tx_ref, v_sender_id, v_recipient_id, p_amount, 0, 'p2p_transfer', 'completed', p_note,
        jsonb_build_object('idempotency_key', v_clean_key, 'operation_type', 'P2P_TRANSFER', 'recipient_phone', v_clean_phone, 'amount', p_amount)
    );

    RETURN jsonb_build_object('success', true, 'tx_ref', v_tx_ref, 'amount', p_amount, 'sender_balance_after', v_sender_bal - p_amount, 'idempotent_replay', false);
END;
$$;

-- 8. Procédure V2 : process_agent_cash_operation_v2
CREATE OR REPLACE FUNCTION public.process_agent_cash_operation_v2(
    p_client_phone TEXT,
    p_amount NUMERIC,
    p_operation_type TEXT,
    p_idempotency_key TEXT,
    p_request_id UUID DEFAULT NULL,
    p_otp_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_agent_auth_id         UUID := auth.uid();
    v_agent_count           INT;
    v_agent_record          RECORD;
    v_clean_key             TEXT := TRIM(COALESCE(p_idempotency_key, ''));
    v_clean_phone           TEXT := TRIM(COALESCE(p_client_phone, ''));
    v_clean_otp             TEXT := TRIM(COALESCE(p_otp_code, ''));
    v_op                    RECORD;
    v_tx_ref                TEXT;
    v_computed_hash         TEXT;
    v_client_bal            NUMERIC;
    v_client_db_phone       TEXT;
    v_client_count          INT;
    v_client_record         RECORD;
    v_existing_tx           RECORD;
    v_key_tx                RECORD;
BEGIN
    -- 1. Contrôles préalables
    IF v_agent_auth_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHORIZED', 'message', 'Session agent requise.');
    END IF;
    IF v_clean_key = '' OR length(v_clean_key) > 128 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_IDEMPOTENCY_KEY', 'message', 'Clé d''idempotence requise.');
    END IF;
    IF p_amount IS NULL OR p_amount < 500 OR p_amount > 5000000 OR p_amount <> round(p_amount) THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_AMOUNT', 'message', 'Le montant doit être un entier strict entre 500 et 5 000 000 FCFA.');
    END IF;
    IF p_operation_type IS NULL OR p_operation_type NOT IN ('WITHDRAWAL', 'EXPRESS_WITHDRAWAL', 'DEPOSIT') THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_OPERATION_TYPE', 'message', 'Type d''opération non supporté.');
    END IF;

    -- 2. Vérification de l'unicité et verrouillage de l'agent actif (is_active = true)
    SELECT count(*) INTO v_agent_count 
    FROM public.agents 
    WHERE user_id = v_agent_auth_id AND is_active = true;

    IF v_agent_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'AGENT_PROFILE_NOT_FOUND', 'message', 'Profil agent actif introuvable.');
    ELSIF v_agent_count > 1 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'AMBIGUOUS_AGENT_PROFILE', 'message', 'Plusieurs profils agent actifs détectés pour cet utilisateur.');
    END IF;

    SELECT id, float_balance, commissions_balance INTO v_agent_record 
    FROM public.agents 
    WHERE user_id = v_agent_auth_id AND is_active = true 
    FOR UPDATE;

    -- 3. Recherche idempotente préalable sous verrou avec vérification stricte des 5 paramètres
    SELECT tx_ref, amount, metadata INTO v_key_tx 
    FROM public.transactions 
    WHERE agent_id = v_agent_record.id AND metadata->>'idempotency_key' = v_clean_key
    FOR UPDATE;

    IF v_key_tx.tx_ref IS NOT NULL THEN
        -- Validation du type d'opération
        IF v_key_tx.metadata->>'operation_type' IS DISTINCT FROM p_operation_type THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'IDEMPOTENCY_CONFLICT', 'message', 'Cette clé d''idempotence a déjà été utilisée pour un autre type d''opération.');
        END IF;

        -- Pour les retraits, p_request_id est obligatoire et doit être cohérent
        IF p_operation_type IN ('WITHDRAWAL', 'EXPRESS_WITHDRAWAL') THEN
            IF p_request_id IS NULL OR v_key_tx.metadata->>'request_id' IS NULL THEN
                RETURN jsonb_build_object('success', false, 'error_code', 'IDEMPOTENCY_CONFLICT', 'message', 'Identifiant de demande absent ou non lié à cette transaction.');
            END IF;
            IF v_key_tx.metadata->>'request_id' IS DISTINCT FROM p_request_id::text THEN
                RETURN jsonb_build_object('success', false, 'error_code', 'IDEMPOTENCY_CONFLICT', 'message', 'Cette clé d''idempotence a déjà été utilisée pour une autre demande.');
            END IF;
        END IF;

        -- Contrôle des autres paramètres
        IF v_key_tx.metadata->>'client_phone' IS DISTINCT FROM v_clean_phone THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'IDEMPOTENCY_CONFLICT', 'message', 'Cette clé d''idempotence a déjà été utilisée avec un autre numéro de téléphone.');
        END IF;
        IF v_key_tx.amount IS DISTINCT FROM p_amount THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'IDEMPOTENCY_CONFLICT', 'message', 'Cette clé d''idempotence a déjà été utilisée avec un montant différent.');
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'tx_ref', v_key_tx.tx_ref,
            'amount', v_key_tx.amount,
            'commission', CASE WHEN p_operation_type = 'DEPOSIT' THEN 50 ELSE 100 END,
            'idempotent_replay', true,
            'message', 'Opération déjà validée.'
        );
    END IF;

    -- 4. Branche DÉPÔT GUICHET (Normalisation et détection des profils multiples)
    IF p_operation_type = 'DEPOSIT' THEN
        IF v_agent_record.float_balance < p_amount THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'INSUFFICIENT_AGENT_FLOAT', 'message', 'Float agent insuffisant pour effectuer ce dépôt.');
        END IF;

        SELECT count(*) INTO v_client_count FROM public.profiles WHERE phone = v_clean_phone;
        IF v_client_count = 0 THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'CLIENT_PROFILE_NOT_FOUND', 'message', 'Client bénéficiaire introuvable.');
        ELSIF v_client_count > 1 THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'AMBIGUOUS_CLIENT', 'message', 'Plusieurs profils détectés avec ce numéro de téléphone.');
        END IF;

        SELECT id, balance, phone INTO v_client_record 
        FROM public.profiles 
        WHERE phone = v_clean_phone 
        FOR UPDATE;

        UPDATE public.agents SET float_balance = float_balance - p_amount, commissions_balance = commissions_balance + 50 WHERE id = v_agent_record.id;
        UPDATE public.profiles SET balance = balance + p_amount WHERE id = v_client_record.id;

        v_tx_ref := 'SW-DEP-' || replace(gen_random_uuid()::text, '-', '');
        INSERT INTO public.transactions (
            tx_ref, sender_id, receiver_id, agent_id, amount, fee,
            transaction_type, status, note, metadata
        ) VALUES (
            v_tx_ref,
            NULL,
            v_client_record.id,
            v_agent_record.id,
            p_amount,
            0,
            'agent_deposit',
            'completed',
            'Dépôt Guichet Switch',
            jsonb_build_object(
                'idempotency_key', v_clean_key,
                'operation_type', 'DEPOSIT',
                'client_phone', v_clean_phone,
                'amount', p_amount
            )
        );

        RETURN jsonb_build_object('success', true, 'tx_ref', v_tx_ref, 'amount', p_amount, 'commission', 50, 'idempotent_replay', false);
    END IF;

    -- 5. Branche RETRAIT DIRECT ou CODE EXPRESS
    IF p_operation_type IN ('WITHDRAWAL', 'EXPRESS_WITHDRAWAL') THEN
        IF p_request_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'MISSING_REQUEST_ID', 'message', 'Identifiant de demande requis.');
        END IF;
        IF v_clean_otp = '' OR length(v_clean_otp) <> 6 OR v_clean_otp !~ '^\d{6}$' THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_OTP_FORMAT', 'message', 'Code OTP obligatoire composé exactement de 6 chiffres.');
        END IF;

        SELECT * INTO v_op FROM public.cash_operations WHERE id = p_request_id FOR UPDATE;
        IF v_op.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'REQUEST_NOT_FOUND', 'message', 'Demande introuvable.');
        END IF;

        IF v_op.idempotency_key IS DISTINCT FROM v_clean_key THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'IDEMPOTENCY_KEY_MISMATCH', 'message', 'La clé d''idempotence ne correspond pas à la demande originale.');
        END IF;
        IF v_op.op_type IS DISTINCT FROM p_operation_type THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_OPERATION_TYPE', 'message', 'Type d''opération incompatible.');
        END IF;
        IF v_op.client_phone IS DISTINCT FROM v_clean_phone THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'PHONE_MISMATCH', 'message', 'Numéro de téléphone incompatible.');
        END IF;
        IF v_op.amount IS DISTINCT FROM p_amount THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'AMOUNT_MISMATCH', 'message', 'Montant incompatible avec la demande.');
        END IF;

        IF v_op.status = 'completed' THEN
            SELECT tx_ref, amount INTO v_existing_tx FROM public.transactions WHERE metadata->>'request_id' = v_op.id::text;
            IF v_existing_tx.tx_ref IS NULL THEN
                RETURN jsonb_build_object('success', false, 'error_code', 'LEDGER_TRANSACTION_NOT_FOUND', 'message', 'Incohérence : transaction de grand livre introuvable.');
            END IF;
            IF v_op.agent_id IS DISTINCT FROM v_agent_record.id THEN
                RETURN jsonb_build_object('success', false, 'error_code', 'REQUEST_CLAIMED_BY_ANOTHER_AGENT', 'message', 'Demande déjà décaissée par un autre agent.');
            END IF;
            RETURN jsonb_build_object(
                'success', true,
                'tx_ref', v_existing_tx.tx_ref,
                'amount', v_op.amount,
                'commission', 100,
                'idempotent_replay', true,
                'message', 'Opération déjà validée.'
            );
        END IF;

        IF v_op.status <> 'pending' THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_REQUEST_STATUS', 'status', v_op.status);
        END IF;

        IF v_op.expires_at <= now() THEN
            UPDATE public.cash_operations SET status = 'expired', updated_at = now() WHERE id = v_op.id;
            RETURN jsonb_build_object('success', false, 'error_code', 'REQUEST_EXPIRED', 'message', 'La demande a expiré.');
        END IF;

        IF v_op.op_type = 'WITHDRAWAL' THEN
            IF v_op.sms_status IS DISTINCT FROM 'sent' THEN
                RETURN jsonb_build_object('success', false, 'error_code', 'SMS_NOT_DELIVERED', 'message', 'Le SMS n''a pas été confirmé comme délivré au client.');
            END IF;
            IF v_op.agent_id IS DISTINCT FROM v_agent_record.id THEN
                RETURN jsonb_build_object('success', false, 'error_code', 'AGENT_MISMATCH', 'message', 'Demande non assignée à cet agent.');
            END IF;
        ELSIF v_op.op_type = 'EXPRESS_WITHDRAWAL' THEN
            IF v_op.client_user_id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_EXPRESS_REQUEST', 'message', 'Demande express sans propriétaire client.');
            END IF;
            IF v_op.sms_status IS DISTINCT FROM 'none' THEN
                RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_SMS_STATUS', 'message', 'Statut SMS non conforme pour retrait express.');
            END IF;
            IF v_op.agent_id IS NOT NULL AND v_op.agent_id IS DISTINCT FROM v_agent_record.id THEN
                RETURN jsonb_build_object('success', false, 'error_code', 'REQUEST_CLAIMED_BY_ANOTHER_AGENT', 'message', 'Demande déjà revendiquée par un autre agent.');
            END IF;
        END IF;

        IF COALESCE(v_op.attempts, 0) >= COALESCE(v_op.max_attempts, 3) THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'OTP_BLOCKED', 'message', 'Demande bloquée suite à 3 tentatives infructueuses.');
        END IF;

        v_computed_hash := encode(digest(v_op.id::text || '|' || v_clean_phone || '|' || v_clean_otp, 'sha256'), 'hex');
        IF v_op.otp_hash <> v_computed_hash THEN
            UPDATE public.cash_operations 
            SET attempts = COALESCE(attempts, 0) + 1,
                status = CASE WHEN COALESCE(attempts, 0) + 1 >= COALESCE(max_attempts, 3) THEN 'blocked' ELSE status END,
                updated_at = now()
            WHERE id = v_op.id;

            IF COALESCE(v_op.attempts, 0) + 1 >= COALESCE(v_op.max_attempts, 3) THEN
                RETURN jsonb_build_object('success', false, 'error_code', 'OTP_BLOCKED', 'message', 'Bloqué après 3 tentatives infructueuses.');
            END IF;
            RETURN jsonb_build_object('success', false, 'error_code', 'WRONG_OTP', 'attempts', COALESCE(v_op.attempts, 0) + 1);
        END IF;

        SELECT balance, phone INTO v_client_bal, v_client_db_phone 
        FROM public.profiles 
        WHERE id = v_op.client_user_id 
        FOR UPDATE;

        IF v_client_bal IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'CLIENT_PROFILE_NOT_FOUND', 'message', 'Profil client introuvable.');
        END IF;
        IF v_client_db_phone IS DISTINCT FROM v_op.client_phone THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'PHONE_MISMATCH', 'message', 'Incohérence du numéro de téléphone avec le profil client.');
        END IF;
        IF v_client_bal < v_op.amount THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'INSUFFICIENT_FUNDS', 'message', 'Solde client insuffisant.');
        END IF;

        UPDATE public.profiles SET balance = balance - v_op.amount WHERE id = v_op.client_user_id;
        UPDATE public.agents SET float_balance = float_balance + v_op.amount, commissions_balance = commissions_balance + 100 WHERE id = v_agent_record.id;
        UPDATE public.cash_operations SET status = 'completed', agent_id = v_agent_record.id, updated_at = now() WHERE id = v_op.id;

        v_tx_ref := 'SW-AGT-' || replace(gen_random_uuid()::text, '-', '');
        INSERT INTO public.transactions (
            tx_ref, sender_id, receiver_id, agent_id, amount, fee,
            transaction_type, status, note, metadata
        ) VALUES (
            v_tx_ref,
            v_op.client_user_id,
            NULL,
            v_agent_record.id,
            v_op.amount,
            0,
            CASE WHEN v_op.op_type = 'EXPRESS_WITHDRAWAL' THEN 'agent_express_withdrawal' ELSE 'agent_withdrawal' END,
            'completed',
            'Retrait Guichet Switch',
            jsonb_build_object(
                'request_id', v_op.id,
                'idempotency_key', v_clean_key,
                'operation_type', v_op.op_type,
                'client_phone', v_clean_phone,
                'amount', p_amount
            )
        );

        RETURN jsonb_build_object('success', true, 'tx_ref', v_tx_ref, 'amount', v_op.amount, 'commission', 100, 'idempotent_replay', false);
    END IF;

    RETURN jsonb_build_object('success', false, 'error_code', 'UNSUPPORTED_OPERATION');
END;
$$;

-- 9. Procédure V2 : process_bill_or_airtime_payment_v2
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
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_key TEXT := TRIM(COALESCE(p_idempotency_key, ''));
    v_user_bal NUMERIC;
    v_tx_ref TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHORIZED', 'message', 'Session requise.');
    END IF;
    IF v_clean_key = '' OR length(v_clean_key) > 128 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_IDEMPOTENCY_KEY', 'message', 'Clé d''idempotence requise.');
    END IF;
    IF p_amount IS NULL OR p_amount < 500 OR p_amount > 5000000 OR p_amount <> round(p_amount) THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_AMOUNT', 'message', 'Montant invalide.');
    END IF;

    SELECT tx_ref INTO v_tx_ref FROM public.transactions 
    WHERE sender_id = v_user_id AND metadata->>'idempotency_key' = v_clean_key;
    
    IF v_tx_ref IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'tx_ref', v_tx_ref, 'amount', p_amount, 'idempotent_replay', true, 'message', 'Paiement déjà validé.');
    END IF;

    SELECT balance INTO v_user_bal FROM public.profiles WHERE id = v_user_id FOR UPDATE;
    IF v_user_bal < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INSUFFICIENT_FUNDS', 'message', 'Solde insuffisant.');
    END IF;

    UPDATE public.profiles SET balance = balance - p_amount WHERE id = v_user_id;

    v_tx_ref := 'SW-BIL-' || replace(gen_random_uuid()::text, '-', '');
    INSERT INTO public.transactions (
        tx_ref, sender_id, receiver_id, amount, fee, transaction_type, status, note, metadata
    ) VALUES (
        v_tx_ref, v_user_id, NULL, p_amount, 0, 'bill_payment', 'completed', p_service_type || ' ' || p_operator,
        jsonb_build_object('idempotency_key', v_clean_key, 'service_type', p_service_type, 'operator', p_operator, 'meter_or_phone', p_meter_or_phone) || p_metadata
    );

    RETURN jsonb_build_object('success', true, 'tx_ref', v_tx_ref, 'amount', p_amount, 'service', p_service_type, 'idempotent_replay', false);
END;
$$;

-- 10. Procédure V2 : close_cashier_session_v2
CREATE OR REPLACE FUNCTION public.close_cashier_session_v2(
    p_session_id UUID,
    p_declared_physical_cash NUMERIC,
    p_idempotency_key TEXT,
    p_notes TEXT DEFAULT 'Clôture journalière'::text
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_key TEXT := TRIM(COALESCE(p_idempotency_key, ''));
    v_session RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHORIZED', 'message', 'Session requise.');
    END IF;
    IF v_clean_key = '' OR length(v_clean_key) > 128 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_IDEMPOTENCY_KEY', 'message', 'Clé d''idempotence requise.');
    END IF;

    SELECT * INTO v_session FROM public.cashier_sessions WHERE id = p_session_id FOR UPDATE;
    IF v_session.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'SESSION_NOT_FOUND', 'message', 'Session introuvable.');
    END IF;

    IF v_session.status = 'closed' THEN
        RETURN jsonb_build_object('success', true, 'session_id', v_session.id, 'idempotent_replay', true, 'message', 'Session déjà clôturée.');
    END IF;

    UPDATE public.cashier_sessions
    SET status = 'closed',
        declared_cash = p_declared_physical_cash,
        closed_at = now(),
        closing_notes = p_notes,
        closing_idempotency_key = v_clean_key
    WHERE id = v_session.id;

    RETURN jsonb_build_object('success', true, 'session_id', v_session.id, 'declared_cash', p_declared_physical_cash, 'idempotent_replay', false);
END;
$$;

-- 11. Procédure Privée : reserve_client_withdrawal_code
CREATE OR REPLACE FUNCTION public.reserve_client_withdrawal_code(
    p_client_user_id UUID,
    p_client_phone TEXT,
    p_amount NUMERIC,
    p_idempotency_key TEXT,
    p_operation_id UUID,
    p_otp_hash TEXT,
    p_expires_at TIMESTAMPTZ,
    p_fee NUMERIC,
    p_rotate_request_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_key             TEXT := TRIM(COALESCE(p_idempotency_key, ''));
    v_clean_phone           TEXT := TRIM(COALESCE(p_client_phone, ''));
    v_inserted_id           UUID;
    v_existing_req          RECORD;
    v_target_rotate_req     RECORD;
    v_is_authorized_rotate  BOOLEAN := FALSE;
    v_client_bal            NUMERIC;
    v_client_db_phone       TEXT;
    v_client_req_count      INT;
    v_client_last_req       RECORD;
BEGIN
    IF p_client_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHORIZED', 'message', 'Session client requise.');
    END IF;
    IF v_clean_key = '' OR length(v_clean_key) > 128 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_IDEMPOTENCY_KEY', 'message', 'Clé d''idempotence invalide.');
    END IF;
    IF p_amount IS NULL OR p_amount < 500 OR p_amount > 5000000 OR p_amount <> round(p_amount) THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_AMOUNT', 'message', 'Montant invalide.');
    END IF;

    SELECT balance, phone INTO v_client_bal, v_client_db_phone FROM public.profiles WHERE id = p_client_user_id FOR UPDATE;
    IF v_client_bal IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'CLIENT_PROFILE_NOT_FOUND');
    END IF;

    -- Idempotence
    SELECT id, amount, status, expires_at INTO v_existing_req
    FROM public.cash_operations WHERE client_user_id = p_client_user_id AND idempotency_key = v_clean_key FOR UPDATE;
    IF v_existing_req.id IS NOT NULL THEN
        IF v_existing_req.amount IS DISTINCT FROM p_amount THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'IDEMPOTENCY_CONFLICT');
        END IF;
        IF v_existing_req.status = 'pending' AND v_existing_req.expires_at > now() THEN
            RETURN jsonb_build_object('success', true, 'request_id', v_existing_req.id, 'expires_at', v_existing_req.expires_at, 'amount', v_existing_req.amount, 'idempotent_replay', true);
        END IF;
        RETURN jsonb_build_object('success', false, 'error_code', 'REQUEST_ALREADY_EXISTS');
    END IF;

    -- Rotation
    IF p_rotate_request_id IS NOT NULL THEN
        SELECT id, client_user_id, client_phone, amount, op_type, status, expires_at 
        INTO v_target_rotate_req FROM public.cash_operations WHERE id = p_rotate_request_id FOR UPDATE;
        IF v_target_rotate_req.id IS NULL OR v_target_rotate_req.client_user_id IS DISTINCT FROM p_client_user_id THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'ROTATION_TARGET_NOT_FOUND');
        END IF;
        IF v_target_rotate_req.op_type IS DISTINCT FROM 'EXPRESS_WITHDRAWAL' OR v_target_rotate_req.amount IS DISTINCT FROM p_amount THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_ROTATION_TARGET');
        END IF;
        IF v_target_rotate_req.status <> 'pending' OR v_target_rotate_req.expires_at <= now() THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_ROTATION_STATUS');
        END IF;
        v_is_authorized_rotate := TRUE;
    END IF;

    IF v_client_bal < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INSUFFICIENT_FUNDS');
    END IF;

    -- Quota (5/h)
    SELECT count(*) INTO v_client_req_count FROM public.cash_operations WHERE client_user_id = p_client_user_id AND created_at >= now() - interval '1 hour';
    IF v_client_req_count >= 5 THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'CLIENT_HOURLY_LIMIT');
    END IF;

    -- Cooldown 60s
    IF NOT v_is_authorized_rotate THEN
        SELECT id, created_at INTO v_client_last_req FROM public.cash_operations 
        WHERE client_user_id = p_client_user_id AND op_type = 'EXPRESS_WITHDRAWAL' AND status = 'pending'
        ORDER BY created_at DESC LIMIT 1;
        IF v_client_last_req.id IS NOT NULL AND v_client_last_req.created_at >= now() - interval '60 seconds' THEN
            RETURN jsonb_build_object('success', false, 'error_code', 'CLIENT_COOLDOWN_ACTIVE');
        END IF;
    END IF;

    INSERT INTO public.cash_operations (
        id, client_user_id, client_phone, amount, fee, op_type, status, expires_at,
        agent_id, idempotency_key, otp_hash, attempts, max_attempts, sms_status
    ) VALUES (
        p_operation_id, p_client_user_id, v_clean_phone, p_amount, p_fee, 'EXPRESS_WITHDRAWAL', 'pending',
        p_expires_at, NULL, v_clean_key, p_otp_hash, 0, 3, 'none'
    )
    ON CONFLICT (client_user_id, idempotency_key)
    WHERE client_user_id IS NOT NULL AND idempotency_key IS NOT NULL AND trim(idempotency_key) <> ''
    DO NOTHING
    RETURNING id INTO v_inserted_id;

    IF v_inserted_id IS NULL THEN
        SELECT id, amount, expires_at INTO v_existing_req FROM public.cash_operations WHERE client_user_id = p_client_user_id AND idempotency_key = v_clean_key FOR UPDATE;
        RETURN jsonb_build_object('success', true, 'request_id', v_existing_req.id, 'expires_at', v_existing_req.expires_at, 'amount', v_existing_req.amount, 'idempotent_replay', true);
    END IF;

    IF v_is_authorized_rotate THEN
        UPDATE public.cash_operations SET status = 'cancelled', updated_at = now() WHERE id = p_rotate_request_id;
    ELSE
        UPDATE public.cash_operations SET status = 'cancelled', updated_at = now() 
        WHERE client_user_id = p_client_user_id AND op_type = 'EXPRESS_WITHDRAWAL' AND status = 'pending' AND id <> v_inserted_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'request_id', v_inserted_id, 'expires_at', p_expires_at, 'idempotent_replay', false, 'message', CASE WHEN v_is_authorized_rotate THEN 'Code renouvelé avec succès.' ELSE 'Code généré avec succès.' END);
END;
$$;

-- 12. Procédure Privée : reserve_withdrawal_otp_request
CREATE OR REPLACE FUNCTION public.reserve_withdrawal_otp_request(
    p_agent_user_id UUID,
    p_client_phone TEXT,
    p_amount NUMERIC,
    p_idempotency_key TEXT,
    p_operation_id UUID,
    p_otp_hash TEXT,
    p_expires_at TIMESTAMPTZ,
    p_claim_token UUID,
    p_fee NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_key TEXT := TRIM(COALESCE(p_idempotency_key, ''));
    v_clean_phone TEXT := TRIM(COALESCE(p_client_phone, ''));
    v_agent_record RECORD;
    v_inserted_id UUID;
BEGIN
    IF p_agent_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHORIZED');
    END IF;
    SELECT id INTO v_agent_record FROM public.agents WHERE user_id = p_agent_user_id AND is_active = true;
    IF v_agent_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'AGENT_NOT_FOUND');
    END IF;

    INSERT INTO public.cash_operations (
        id, client_user_id, client_phone, amount, fee, op_type, status, expires_at,
        agent_id, idempotency_key, otp_hash, attempts, max_attempts, sms_status, sms_claim_token
    ) VALUES (
        p_operation_id, NULL, v_clean_phone, p_amount, p_fee, 'WITHDRAWAL', 'pending',
        p_expires_at, v_agent_record.id, v_clean_key, p_otp_hash, 0, 3, 'sending', p_claim_token
    )
    ON CONFLICT (agent_id, idempotency_key)
    WHERE agent_id IS NOT NULL AND idempotency_key IS NOT NULL AND trim(idempotency_key) <> ''
    DO NOTHING
    RETURNING id INTO v_inserted_id;

    RETURN jsonb_build_object('success', true, 'request_id', COALESCE(v_inserted_id, p_operation_id), 'expires_at', p_expires_at, 'idempotent_replay', v_inserted_id IS NULL);
END;
$$;

-- 13. Droits & Privilèges d'Exécution
REVOKE ALL ON FUNCTION public.process_p2p_transfer_secure_v2(TEXT, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_agent_cash_operation_v2(TEXT, NUMERIC, TEXT, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_bill_or_airtime_payment_v2(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.close_cashier_session_v2(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_client_withdrawal_code(UUID, TEXT, NUMERIC, TEXT, UUID, TEXT, TIMESTAMPTZ, NUMERIC, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_withdrawal_otp_request(UUID, TEXT, NUMERIC, TEXT, UUID, TEXT, TIMESTAMPTZ, UUID, NUMERIC) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_p2p_transfer_secure_v2(TEXT, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_agent_cash_operation_v2(TEXT, NUMERIC, TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_bill_or_airtime_payment_v2(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_cashier_session_v2(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_client_withdrawal_code(UUID, TEXT, NUMERIC, TEXT, UUID, TEXT, TIMESTAMPTZ, NUMERIC, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_withdrawal_otp_request(UUID, TEXT, NUMERIC, TEXT, UUID, TEXT, TIMESTAMPTZ, UUID, NUMERIC) TO service_role;

COMMIT;
