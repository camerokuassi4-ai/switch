-- =============================================================================
-- Migration: Phase 3 Merchant Space, Products Catalogue & POS Cash Register
-- Description: Products table, POS sales atomic RPC, Merchant dashboard & payout
-- =============================================================================

-- 1. Table des Produits & Services Marchand
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    category TEXT DEFAULT 'Général',
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activation RLS sur products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_policy" ON public.products;
CREATE POLICY "products_select_policy" ON public.products
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM public.merchants WHERE id = products.merchant_id)
        OR is_active = true
    );

DROP POLICY IF EXISTS "products_modify_policy" ON public.products;
CREATE POLICY "products_modify_policy" ON public.products
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.merchants WHERE id = products.merchant_id)
    );

-- =============================================================================
-- PROCEDURES STOCKEES ATOMIQUES (RPC FUNCTIONS)
-- =============================================================================

-- A. Récupération des Données du Tableau de Bord Marchand
CREATE OR REPLACE FUNCTION public.get_merchant_dashboard_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_merchant RECORD;
    v_today_sales_count INT;
    v_today_turnover NUMERIC;
BEGIN
    SELECT * INTO v_merchant
    FROM public.merchants
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_merchant.id IS NULL THEN
        RAISE EXCEPTION 'Aucun compte marchand trouvé.';
    END IF;

    -- Agrégation des ventes du jour
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(SUM(amount), 0)
    INTO v_today_sales_count, v_today_turnover
    FROM public.transactions
    WHERE merchant_id = v_merchant.id
      AND created_at >= date_trunc('day', now());

    RETURN jsonb_build_object(
        'success', true,
        'merchant_id', v_merchant.id,
        'business_name', v_merchant.business_name,
        'ifu', v_merchant.ifu,
        'phone', v_merchant.phone,
        'shop_balance', v_merchant.shop_balance,
        'qr_code_id', v_merchant.qr_code_id,
        'today_sales_count', v_today_sales_count,
        'today_turnover', v_today_turnover
    );
END;
$$;

-- B. Traitement Atomique d'une Vente Caisse POS (Décrémentation Stock + Paiement)
CREATE OR REPLACE FUNCTION public.process_pos_sale(
    p_items JSONB, -- Format: [{"id": "uuid", "quantity": 2, "unit_price": 1500}]
    p_payment_method TEXT DEFAULT 'switch', -- 'switch', 'cash', 'card'
    p_customer_phone TEXT DEFAULT NULL,
    p_note TEXT DEFAULT 'Vente Caisse POS'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_merchant_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_qty INT;
    v_unit_price NUMERIC;
    v_curr_stock INT;
    v_total_amount NUMERIC := 0;
    v_customer_id UUID;
    v_customer_bal NUMERIC;
    v_tx_ref TEXT;
BEGIN
    -- 1. Récupération du marchand
    SELECT id INTO v_merchant_id
    FROM public.merchants
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_merchant_id IS NULL THEN
        RAISE EXCEPTION 'Boutique marchande introuvable.';
    END IF;

    -- 2. Vérification et décrémentation des stocks de chaque produit
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'id')::UUID;
        v_qty := (v_item->>'quantity')::INT;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Quantité invalide pour l article ID %.', v_product_id;
        END IF;

        -- Verrouillage du produit
        SELECT stock_quantity INTO v_curr_stock
        FROM public.products
        WHERE id = v_product_id AND merchant_id = v_merchant_id
        FOR UPDATE;

        IF v_curr_stock IS NULL THEN
            RAISE EXCEPTION 'Produit introuvable dans votre catalogue (ID: %).', v_product_id;
        END IF;

        IF v_curr_stock < v_qty THEN
            RAISE EXCEPTION 'Stock insuffisant pour le produit (Disponible: %, Demandé: %).', v_curr_stock, v_qty;
        END IF;

        -- Décrémentation du stock
        UPDATE public.products
        SET stock_quantity = stock_quantity - v_qty, updated_at = now()
        WHERE id = v_product_id;

        v_total_amount := v_total_amount + (v_qty * v_unit_price);
    END LOOP;

    IF v_total_amount <= 0 THEN
        RAISE EXCEPTION 'Montant total de la vente invalide (0 FCFA).';
    END IF;

    -- 3. Gestion du paiement selon le mode
    IF LOWER(p_payment_method) = 'switch' THEN
        IF p_customer_phone IS NULL OR trim(p_customer_phone) = '' THEN
            RAISE EXCEPTION 'Numéro du client requis pour un débit direct Switch.';
        END IF;

        SELECT id, balance INTO v_customer_id, v_customer_bal
        FROM public.profiles
        WHERE phone = p_customer_phone OR phone = REPLACE(p_customer_phone, ' ', '')
        FOR UPDATE;

        IF v_customer_id IS NULL THEN
            RAISE EXCEPTION 'Compte client Switch introuvable pour le numéro %.', p_customer_phone;
        END IF;

        IF v_customer_bal < v_total_amount THEN
            RAISE EXCEPTION 'Solde du client Switch insuffisant (% FCFA disponible, % FCFA requis).', v_customer_bal, v_total_amount;
        END IF;

        -- Débit client
        UPDATE public.profiles
        SET balance = balance - v_total_amount, updated_at = now()
        WHERE id = v_customer_id;

        -- Crédit du solde boutique
        UPDATE public.merchants
        SET shop_balance = shop_balance + v_total_amount
        WHERE id = v_merchant_id;

    ELSE
        -- Vente Espèces ou Carte : Enregistrement direct dans le chiffre d'affaires
        UPDATE public.merchants
        SET shop_balance = shop_balance + v_total_amount
        WHERE id = v_merchant_id;
    END IF;

    v_tx_ref := 'SW-POS-' || lpad(floor(random() * 900000 + 100000)::text, 6, '0');

    -- 4. Inscription de la vente au Grand Livre
    INSERT INTO public.transactions (
        tx_ref, sender_id, merchant_id, amount, fee, transaction_type, status, note, metadata
    ) VALUES (
        v_tx_ref, v_customer_id, v_merchant_id, v_total_amount, 0,
        'merchant_pos_sale', 'completed', p_note, jsonb_build_object('items', p_items, 'method', p_payment_method)
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'total_amount', v_total_amount,
        'payment_method', p_payment_method,
        'items_count', jsonb_array_length(p_items)
    );
END;
$$;

-- C. Virement des Encaissements Marchand (Payout vers Compte Personnel)
CREATE OR REPLACE FUNCTION public.withdraw_merchant_funds(
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_merchant_id UUID;
    v_user_id UUID;
    v_shop_balance NUMERIC;
    v_tx_ref TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Montant de retrait invalide (doit être supérieur à 0 FCFA).';
    END IF;

    -- 1. Récupération et verrouillage de la boutique
    SELECT id, user_id, shop_balance 
    INTO v_merchant_id, v_user_id, v_shop_balance
    FROM public.merchants
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_merchant_id IS NULL THEN
        RAISE EXCEPTION 'Boutique marchande introuvable.';
    END IF;

    IF v_shop_balance < p_amount THEN
        RAISE EXCEPTION 'Solde de caisse boutique insuffisant (% FCFA disponible, % FCFA demandé).', v_shop_balance, p_amount;
    END IF;

    -- 2. Débit de la caisse boutique
    UPDATE public.merchants
    SET shop_balance = shop_balance - p_amount
    WHERE id = v_merchant_id;

    -- 3. Crédit du compte personnel du gérant
    IF v_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET balance = balance + p_amount, updated_at = now()
        WHERE id = v_user_id;
    END IF;

    v_tx_ref := 'SW-PAYOUT-' || lpad(floor(random() * 900000 + 100000)::text, 6, '0');

    -- 4. Enregistrement au Grand Livre
    INSERT INTO public.transactions (
        tx_ref, sender_id, receiver_id, merchant_id, amount, fee, transaction_type, status, note
    ) VALUES (
        v_tx_ref, v_user_id, v_user_id, v_merchant_id, p_amount, 0,
        'merchant_payout', 'completed', 'Virement encaissements vers solde personnel'
    );

    RETURN jsonb_build_object(
        'success', true,
        'tx_ref', v_tx_ref,
        'amount', p_amount,
        'remaining_shop_balance', v_shop_balance - p_amount
    );
END;
$$;
