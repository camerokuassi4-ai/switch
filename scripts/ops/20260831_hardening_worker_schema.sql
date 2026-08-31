-- ===============================================================================
-- MIGRATION DE DURCISSEMENT DU SCHÉMA WORKER (PRÉPARÉE - NON APPLIQUÉE EN PROD)
-- Fichier : scripts/ops/20260831_hardening_worker_schema.sql
-- ===============================================================================

-- Étape 1 : Inspection préalable des doublons dans worker_execution_logs
SELECT execution_id, COUNT(*)
FROM worker_execution_logs
GROUP BY execution_id
HAVING COUNT(*) > 1;

-- Étape 2 : Création de la contrainte d'unicité formelle (si aucun doublon)
ALTER TABLE worker_execution_logs
ADD CONSTRAINT uk_worker_execution_logs_execution_id UNIQUE (execution_id);

-- Étape 3 : Création de la contrainte d'intégrité temporelle stricte
ALTER TABLE worker_execution_logs
ADD CONSTRAINT chk_worker_execution_timestamps
CHECK (scheduled_at <= started_at AND started_at <= committed_at);

-- Étape 4 : Indexation optimisée sur committed_at et status
CREATE INDEX IF NOT EXISTS idx_worker_execution_logs_committed_status
ON worker_execution_logs (committed_at DESC, status);

-- Statut : PRÉPARÉE, EN ATTENTE DE VALIDATION FINALE (NON APPLIQUÉE À LA PRODUCTION)
