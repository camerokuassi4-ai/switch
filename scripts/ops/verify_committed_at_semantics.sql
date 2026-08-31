-- ===============================================================================
-- VALIDATION DES INVARIANTS ET SÉCURISATION DU REGISTRE worker_execution_logs
-- ===============================================================================

-- 1. Vérification de la contrainte d'unicité sur execution_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_worker_execution_logs_execution_id'
    ) THEN
        ALTER TABLE worker_execution_logs 
        ADD CONSTRAINT uk_worker_execution_logs_execution_id UNIQUE (execution_id);
    END IF;
END $$;

-- 2. Vérification de la contrainte de cohérence temporelle stricte
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_worker_execution_timestamps'
    ) THEN
        ALTER TABLE worker_execution_logs 
        ADD CONSTRAINT chk_worker_execution_timestamps 
        CHECK (scheduled_at <= started_at AND started_at <= committed_at);
    END IF;
END $$;

-- 3. Vue d'audit en direct du dernier battement de cœur et de santé du worker
CREATE OR REPLACE VIEW v_worker_daemon_health AS
SELECT 
    COUNT(*) AS total_cycles_executed,
    MAX(committed_at) AS last_committed_at,
    clock_timestamp() AS current_postgres_clock,
    EXTRACT(EPOCH FROM (clock_timestamp() - MAX(committed_at))) AS seconds_since_last_commit,
    CASE 
        WHEN COUNT(*) FILTER (WHERE status != 'SUCCESS') > 0 THEN 'ANOMALY_DETECTED'
        ELSE 'OPTIMAL'
    END AS operational_health
FROM worker_execution_logs;
