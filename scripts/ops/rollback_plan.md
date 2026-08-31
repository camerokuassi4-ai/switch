# Plan de Rollback & Procédure de Secours du Worker PostgreSQL

## 1. Procédure d'Arrêt Propre d'Urgence
En cas d'anomalie détectée sur le worker de production :
```powershell
# 1. Identifier le PID actif
$workerProcess = Get-Process -Name node | Where-Object { $_.CommandLine -like "*worker_auto_loop.js*" }

# 2. Envoi du signal d'interruption propre (SIGINT)
Stop-Process -Id $workerProcess.Id -Force
```

## 2. Verrouillage Immédiat des Flux Financiers
S'assurer que toutes les entrées de facturation demeurent fermées :
```sql
-- Vérification stricte des routes
UPDATE bill_provider_routes SET is_active = false WHERE provider = 'SBEE';
UPDATE system_features SET enabled = false, rollout_percent = 0 WHERE feature_key = 'BILL_PAYMENTS_CANARY';
```

## 3. Contrôle de l'Absence de Mutation en Cours
Vérifier qu'aucune transaction n'est bloquée dans une transaction PostgreSQL non commitée :
```sql
SELECT pid, query_start, state, query 
FROM pg_stat_activity 
WHERE query ILIKE '%process_expired_processing_bill_payments%'
  AND state != 'idle';
```

## 4. Seuils Déclenchant un Blocage Immédiat (`BLOCKED`)
- **Seuil 1** : `committed_at > clock_timestamp()` (Horodatage futur détecté).
- **Seuil 2** : Écart séquestre non nul (`available + locked != 50 000 000 FCFA`).
- **Seuil 3** : Mutation de transaction non autorisée avant `2026-09-01T00:04:51.338Z UTC`.
- **Seuil 4** : Perte de connexion PostgreSQL supérieure à 3 tentatives consécutives.

## 5. Procédure de Reprise Après Incident
1. Vérifier la cohérence de `worker_execution_logs`.
2. Relancer le worker en mode audit lecture seule (`monitor_worker_heartbeat.js`).
3. Obtenir l'approbation humaine avant redémarrage de la boucle active.
