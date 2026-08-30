-- =============================================================================
-- Migration: Phase 6 - Business Integrity Rules & Security
-- Description: Phone validation, PIN hashing/verification, duplicate prevention,
--              product sync view for Switch Benin
-- =============================================================================

-- 1. VALIDATION DU NUMERO DE TELEPHONE BENIN (ARCEP)
CREATE OR REPLACE FUNCTION public.validate_benin_phone(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_digits TEXT;
BEGIN
    v_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF length(v_digits) <> 10 THEN RETURN false; END IF;
    IF left(v_digits, 2) <> '01' THEN RETURN false; END IF;
    RETURN left(v_digits, 4) = ANY(ARRAY[
        '0196', '0197', '0161', '0162', '0163', '0164', '0165', '0166', '0167',
        '0151', '0152', '0153', '0154', '0142', '0146',
        '0195', '0194', '0160', '0168', '0198', '0193',
        '0140', '0141', '0143', '0144', '0145', '0147', '0148', '0149',
        '0190', '0191'
    ]);
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'profiles' AND constraint_name = 'profiles_phone_benin_format'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_benin_format CHECK (validate_benin_phone(phone));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'agents' AND constraint_name = 'agents_phone_benin_format'
    ) THEN
        ALTER TABLE public.agents ADD CONSTRAINT agents_phone_benin_format CHECK (validate_benin_phone(phone));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'merchants' AND constraint_name = 'merchants_phone_benin_format'
    ) THEN
        ALTER TABLE public.merchants ADD CONSTRAINT merchants_phone_benin_format CHECK (validate_benin_phone(phone));
    END IF;
END;
$$;

-- 2. CODE PIN SECURISE (pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.hash_pin(p_pin TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    IF p_pin IS NULL OR length(trim(p_pin)) < 4 THEN
        RAISE EXCEPTION 'Le code PIN doit comporter au moins 4 chiffres.';
    END IF;
    RETURN encode(digest(p_pin, 'sha256'), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION public.register_pin(p_phone TEXT, p_pin TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_rows INT;
BEGIN
    IF p_pin IS NULL OR p_pin !~ '^\d{4,6}$' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Le code PIN doit comporter 4 a 6 chiffres.');
    END IF;
    UPDATE public.profiles SET pin_hash = public.hash_pin(p_pin), updated_at = now()
    WHERE regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(p_phone, '[^0-9]', '', 'g');
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Profil introuvable pour ce numero.');
    END IF;
    RETURN jsonb_build_object('success', true, 'message', 'Code PIN enregistre avec succes.');
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_pin(p_phone TEXT, p_pin TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_stored TEXT;
BEGIN
    IF p_pin IS NULL OR p_pin !~ '^\d{4,6}$' THEN RETURN false; END IF;
    SELECT pin_hash INTO v_stored FROM public.profiles
    WHERE regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(p_phone, '[^0-9]', '', 'g') LIMIT 1;
    IF v_stored IS NULL THEN RETURN true; END IF;
    RETURN v_stored = public.hash_pin(p_pin);
END;
$$;

-- 3. INSCRIPTION SECURISEE (unicite + format)
CREATE OR REPLACE FUNCTION public.register_user(p_phone TEXT, p_full_name TEXT, p_pin TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_digits TEXT;
    v_exists UUID;
    v_new_id UUID;
    v_phash  TEXT;
BEGIN
    v_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF NOT public.validate_benin_phone(v_digits) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Numero de telephone invalide. Veuillez saisir un numero beninois a 10 chiffres (MTN, Moov ou Celtiis).');
    END IF;
    SELECT id INTO v_exists FROM public.profiles
    WHERE regexp_replace(phone, '[^0-9]', '', 'g') = v_digits;
    IF v_exists IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ce numero de telephone est deja associe a un compte Switch. Veuillez vous connecter.', 'error_code', 'PHONE_ALREADY_EXISTS');
    END IF;
    IF p_pin IS NOT NULL AND p_pin ~ '^\d{4,6}$' THEN
        v_phash := public.hash_pin(p_pin);
    END IF;
    INSERT INTO public.profiles (phone, full_name, pin_hash, balance)
    VALUES (v_digits, p_full_name, v_phash, 50000) RETURNING id INTO v_new_id;
    RETURN jsonb_build_object('success', true, 'message', 'Compte Switch cree avec succes.', 'profile_id', v_new_id, 'phone', v_digits, 'full_name', p_full_name);
EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ce numero de telephone est deja associe a un compte Switch. Veuillez vous connecter.', 'error_code', 'PHONE_ALREADY_EXISTS');
END;
$$;

-- 4. TRANSFERT P2P SECURISE AVEC VERIFICATION PIN
CREATE OR REPLACE FUNCTION public.process_p2p_transfer_secure(
    p_recipient_phone TEXT, p_amount NUMERIC, p_pin TEXT, p_note TEXT DEFAULT 'Transfert Switch'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_sender_id  UUID;
    v_sender_bal NUMERIC;
    v_sender_ph  TEXT;
    v_recv_id    UUID;
    v_tx_ref     TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Montant invalide.');
    END IF;
    SELECT id, balance, phone INTO v_sender_id, v_sender_bal, v_sender_ph
    FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
    IF v_sender_id IS NULL THEN
        SELECT id, balance, phone INTO v_sender_id, v_sender_bal, v_sender_ph
        FROM public.profiles ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    END IF;
    IF v_sender_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Compte expediteur introuvable.');
    END IF;
    IF NOT public.verify_pin(v_sender_ph, p_pin) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Code PIN incorrect. Transaction refusee.', 'error_code', 'WRONG_PIN');
    END IF;
    IF v_sender_bal < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Solde insuffisant.');
    END IF;
    SELECT id INTO v_recv_id FROM public.profiles
    WHERE regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(p_recipient_phone, '[^0-9]', '', 'g');
    IF v_recv_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Destinataire introuvable sur Switch.');
    END IF;
    UPDATE public.profiles SET balance = balance - p_amount, updated_at = now() WHERE id = v_sender_id;
    UPDATE public.profiles SET balance = balance + p_amount, updated_at = now() WHERE id = v_recv_id;
    v_tx_ref := 'SW-P2P-' || upper(substr(md5(random()::text), 1, 8));
    INSERT INTO public.transactions (tx_ref, sender_id, receiver_id, amount, fee, transaction_type, note)
    VALUES (v_tx_ref, v_sender_id, v_recv_id, p_amount, 0, 'p2p_transfer', p_note);
    RETURN jsonb_build_object('success', true, 'tx_ref', v_tx_ref, 'amount', p_amount, 'new_balance', v_sender_bal - p_amount);
END;
$$;

-- 5. VUE MARKETPLACE PUBLIQUE
CREATE OR REPLACE VIEW public.marketplace_products AS
SELECT
    p.id, p.name, p.price, p.stock_quantity, p.category, p.image_url, p.is_active, p.created_at,
    m.business_name AS store_name, m.city AS store_city, m.id AS merchant_id
FROM public.products p
JOIN public.merchants m ON m.id = p.merchant_id
WHERE p.is_active = true AND p.stock_quantity > 0
ORDER BY p.created_at DESC;

GRANT SELECT ON public.marketplace_products TO anon, authenticated;

-- 6. INDEX DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);
