-- =============================================================================
-- SCRIPT D'ANONYMISATION DE SÉCURITÉ POUR INSTANCE ISOLÉE JETABLE
-- À exécuter UNIQUEMENT après restauration du dump sur ISOLATED_TEST_DB
-- =============================================================================

BEGIN;

-- 1. Anonymisation déterministe des profils clients (0 doublon garanti par numérotation déterministe)
WITH numbered_profiles AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.profiles
)
UPDATE public.profiles p
SET 
  phone = '0197' || lpad(np.rn::text, 6, '0'),
  full_name = 'Client Staging ' || substr(p.id::text, 1, 6),
  email = 'staging_' || substr(p.id::text, 1, 8) || '@switch-test.bj',
  pin_hash = encode(digest('1234' || p.id::text, 'sha256'), 'hex'),
  balance = 50000
FROM numbered_profiles np
WHERE p.id = np.id;

-- 2. Anonymisation des agents
UPDATE public.agents
SET 
  agency_name = 'Agence Test ' || substr(id::text, 1, 4),
  float_balance = 100000,
  commissions_balance = 5000;

-- 3. Neutralisation des numéros, hash et tokens dans cash_operations
WITH numbered_ops AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.cash_operations
)
UPDATE public.cash_operations co
SET 
  client_phone = '0197' || lpad(no.rn::text, 6, '0'),
  otp_hash = encode(digest('000000' || co.id::text, 'sha256'), 'hex'),
  sms_claim_token = gen_random_uuid()
FROM numbered_ops no
WHERE co.id = no.id;

-- 4. Nettoyage des métadonnées sensibles au grand livre
UPDATE public.transactions
SET note = 'Transaction anonymisée Staging'
WHERE note IS NOT NULL;

COMMIT;
