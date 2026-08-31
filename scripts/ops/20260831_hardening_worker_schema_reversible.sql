-- ===============================================================================
-- MIGRATION SQL RÉVERSIBLE : DURCISSEMENT worker_execution_logs
-- Fichier : scripts/ops/20260831_hardening_worker_schema_reversible.sql
-- STATUT : HORS PRODUCTION - NON APPLIQUÉ EN PROD SANS APPROBATION
-- ===============================================================================

-- PHASE D'AUDIT PRÉALABLE (LECTURE SEULE)
-- 1. Inspection des doublons potentiels
SELECT execution_id, COUNT(*) AS count_duplicates
FROM worker_execution_logs
GROUP BY execution_id
HAVING COUNT(*) > 1;

-- 2. Inspection des violations de scheduled_at <= started_at
SELECT execution_id, scheduled_at, started_at
FROM worker_execution_logs
WHERE started_at < scheduled_at;

-- 3. Inspection des violations de started_at <= committed_at
SELECT execution_id, started_at, committed_at
FROM worker_execution_logs
WHERE committed_at < started_at;

-- -------------------------------------------------------------------------------
-- DÉPLOIEMENT (UP) - À EXÉCUTER UNIQUEMENT APRÈS VALIDATION HUMAINE
-- -------------------------------------------------------------------------------
-- BEGIN;
-- ALTER TABLE worker_execution_logs 
--   ADD CONSTRAINT uk_worker_execution_logs_execution_id UNIQUE (execution_id);
-- ALTER TABLE worker_execution_logs 
--   ADD CONSTRAINT chk_worker_execution_timestamps 
--   CHECK (scheduled_at <= started_at AND started_at <= committed_at);
-- CREATE INDEX IF NOT EXISTS idx_worker_execution_logs_committed_status 
--   ON worker_execution_logs (committed_at DESC, status);
-- COMMIT;

-- -------------------------------------------------------------------------------
-- ROLLBACK (DOWN) - EN CAS DE NÉCESSITÉ DE RETOUR ARRIÈRE
-- -------------------------------------------------------------------------------
-- BEGIN;
-- ALTER TABLE worker_execution_logs DROP CONSTRAINT IF EXISTS uk_worker_execution_logs_execution_id;
-- ALTER TABLE worker_execution_logs DROP CONSTRAINT IF EXISTS chk_worker_execution_timestamps;
-- DROP INDEX IF EXISTS idx_worker_execution_logs_committed_status;
-- COMMIT;
