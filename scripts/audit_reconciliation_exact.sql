-- =============================================================================
-- REQUÊTE D'AUDIT DE RÉCONCILIATION FINANCIÈRE & GRAND LIVRE
-- Mode : Stricte Lecture Seule
-- =============================================================================

-- 1. SYNTHÈSE DES ANOMALIES & AUDIT GLOBAL
WITH audit_data AS (
  SELECT 
    co.id AS cash_operation_id,
    co.client_user_id,
    co.op_type,
    co.amount AS requested_amount,
    co.status AS cash_op_status,
    co.idempotency_key,
    co.created_at AS requested_at,
    t.id AS matched_transaction_id,
    t.tx_ref,
    t.status AS transaction_status,
    t.amount AS booked_amount,
    p.id AS profile_id,
    CASE 
      WHEN p.id IS NULL THEN 'ORPHAN_PROFILE'
      WHEN co.status = 'completed' AND t.id IS NULL THEN 'MISSING_TRANSACTION'
      WHEN co.status = 'completed' AND co.amount <> t.amount THEN 'AMOUNT_MISMATCH'
      WHEN co.status = 'pending' AND t.id IS NOT NULL THEN 'UNEXPECTED_TRANSACTION_PENDING'
      WHEN co.status = 'cancelled' AND t.id IS NOT NULL THEN 'UNEXPECTED_TRANSACTION_CANCELLED'
      ELSE 'CONFORME'
    END AS audit_status
  FROM public.cash_operations co
  LEFT JOIN public.profiles p ON p.id = co.client_user_id
  LEFT JOIN public.transactions t 
    ON t.sender_id = co.client_user_id 
   AND (
        t.metadata->>'request_id' = co.id::text 
        OR (t.agent_id = co.agent_id AND t.metadata->>'idempotency_key' = co.idempotency_key)
       )
)
SELECT 
  count(*) AS total_operations_auditees,
  count(*) FILTER (WHERE audit_status = 'CONFORME') AS total_conformes,
  count(*) FILTER (WHERE audit_status <> 'CONFORME') AS total_anomalies,
  count(*) FILTER (WHERE audit_status = 'MISSING_TRANSACTION') AS anomalies_transactions_manquantes,
  count(*) FILTER (WHERE audit_status = 'AMOUNT_MISMATCH') AS anomalies_ecarts_montant,
  count(*) FILTER (WHERE audit_status = 'ORPHAN_PROFILE') AS anomalies_profils_orphelins,
  count(*) FILTER (WHERE audit_status IN ('UNEXPECTED_TRANSACTION_PENDING', 'UNEXPECTED_TRANSACTION_CANCELLED')) AS anomalies_transactions_inattendues
FROM audit_data;

-- 2. DIAGNOSTIC DES DOUBLONS DE RAPPROCHEMENT (1:1 STRICT)
SELECT 
  co.id AS cash_operation_id,
  count(t.id) AS duplicate_transaction_count,
  array_agg(t.tx_ref) AS duplicate_tx_refs
FROM public.cash_operations co
JOIN public.transactions t 
  ON t.sender_id = co.client_user_id 
 AND (
      t.metadata->>'request_id' = co.id::text 
      OR (t.agent_id = co.agent_id AND t.metadata->>'idempotency_key' = co.idempotency_key)
     )
GROUP BY co.id
HAVING count(t.id) > 1;
