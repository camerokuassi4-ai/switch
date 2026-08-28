-- =============================================================================
-- SWITCH FINTECH BÉNIN — EXTENSION ÉCOSYSTÈME & SERVICES PUBLICS
-- Script SQL Optionnel à exécuter dans l'éditeur SQL Supabase
-- =============================================================================

-- 1. Procédure de règlement des factures (SBEE, SONEB, Télécoms)
CREATE OR REPLACE FUNCTION public.process_bill_or_airtime_payment(
    p_service_type TEXT,
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
    v_user_bal NUMERIC;
    v_tx_ref TEXT;
    v_token TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Montant invalide.');
    END IF;

    -- Récupération et verrouillage du compte utilisateur
    SELECT id, balance INTO v_user_id, v_user_bal
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Compte utilisateur introuvable.');
    END IF;

    IF v_user_bal < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Solde insuffisant dans votre compte Switch (' || v_user_bal || ' FCFA disponible).');
    END IF;

    -- Débit immédiat du solde
    UPDATE public.profiles
    SET balance = balance - p_amount, updated_at = now()
    WHERE id = v_user_id;

    -- Génération du Token (20 chiffres si SBEE, quittance si SONEB/Télécom)
    IF LOWER(p_service_type) = 'sbee' THEN
        v_token := lpad(floor(random()*9000+1000)::text, 4, '0') || ' ' ||
                   lpad(floor(random()*9000+1000)::text, 4, '0') || ' ' ||
                   lpad(floor(random()*9000+1000)::text, 4, '0') || ' ' ||
                   lpad(floor(random()*9000+1000)::text, 4, '0') || ' ' ||
                   lpad(floor(random()*9000+1000)::text, 4, '0');
    ELSE
        v_token := 'SNB-2026-' || lpad(floor(random()*900000+100000)::text, 6, '0') || '-9';
    END IF;

    v_tx_ref := 'SW-' || UPPER(p_service_type) || '-' || lpad(floor(random()*90000+10000)::text, 5, '0');

    -- Écriture dans le grand livre des transactions
    INSERT INTO public.transactions (
        tx_ref, sender_id, amount, fee, transaction_type, status, note, metadata
    ) VALUES (
        v_tx_ref, v_user_id, p_amount, 0, 'utility_bill', 'completed',
        'Paiement ' || p_operator || ' (' || p_meter_or_phone || ')',
        jsonb_build_object('service', p_service_type, 'target', p_meter_or_phone, 'token', v_token)
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'amount', p_amount,
        'token', v_token,
        'new_balance', v_user_bal - p_amount
    );
END;
$$;


-- 2. Procédure de Paiement Marchand & Marketplace
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
    v_user_id UUID;
    v_user_bal NUMERIC;
    v_merchant_id UUID;
    v_tx_ref TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Montant de paiement invalide.');
    END IF;

    -- Débit client
    SELECT id, balance INTO v_user_id, v_user_bal
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_user_bal < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Solde insuffisant dans votre compte Switch.');
    END IF;

    UPDATE public.profiles
    SET balance = balance - p_amount, updated_at = now()
    WHERE id = v_user_id;

    -- Crédit marchand
    SELECT id INTO v_merchant_id
    FROM public.merchants
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_merchant_id IS NOT NULL THEN
        UPDATE public.merchants
        SET balance = balance + p_amount, updated_at = now()
        WHERE id = v_merchant_id;
    END IF;

    v_tx_ref := 'SW-MCH-' || lpad(floor(random()*900000+100000)::text, 6, '0');

    INSERT INTO public.transactions (
        tx_ref, sender_id, merchant_id, amount, fee, transaction_type, status, note
    ) VALUES (
        v_tx_ref, v_user_id, v_merchant_id, p_amount, 0, 'merchant_payment', 'completed', p_note
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'amount', p_amount,
        'new_balance', v_user_bal - p_amount,
        'merchant', p_merchant_identifier
    );
END;
$$;
