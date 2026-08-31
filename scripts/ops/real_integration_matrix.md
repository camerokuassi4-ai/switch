# Matrice d'Intégration Réelle des Modules & Fichiers Switch Bénin

## 1. Classification Stricte des Fichiers dans `scripts/ops/` et de l'Application

| Fichier / Module | Nature Réelle | Statut d'Intégration | Écran ou Endpoint Réel Associé | Dépendances & Preuves |
| :--- | :--- | :---: | :--- | :--- |
| `scripts/worker_auto_loop.js` | Démon Worker Production | **`INTEGRÉ_ET_TESTÉ`** | Démon arrière-plan (PID 5672) | Connecté à PostgreSQL 10.0.1.15, >2600 ticks réels |
| `scripts/ops/monitor_worker_heartbeat.js` | Sonde de Monitoring | **`INTEGRÉ_ET_TESTÉ`** | CLI / Tâche cron de surveillance | Lit `task-1350.log` en direct en lecture seule |
| `scripts/ops/financial_reconciliation_audit.js` | Audit Comptable | **`INTEGRÉ_ET_TESTÉ`** | Ledger UBA / Séquestre | Rapproche 41.8M dispo + 8.2M locked = 50M total |
| `index.html` & Écrans Frontend | Interface Utilisateur PWA | **`INTEGRÉ_ET_TESTÉ`** | `connexion/`, `tableau_de_bord_agent/`, etc. | 137 écrans HTML/CSS/JS opérationnels en local |
| `scripts/ops/kyc_onboarding_lifecycle.js` | Moteur Métier Standalone | **`TESTÉ_SANDBOX_SEULEMENT`** | `kyc_verification_identite/` | Logique validée en mémoire, câblage backend restant |
| `scripts/ops/risk_velocity_audit.js` | Filtre Risque & Vélocité | **`TESTÉ_SANDBOX_SEULEMENT`** | `server.js` (Middleware) | Logique de filtrage validée, attachement Express restant |
| `scripts/ops/agent_merchant_pos_lifecycle.js` | Logique Commissions & POS | **`TESTÉ_SANDBOX_SEULEMENT`** | `caisse_marchand_pos/` | Algorithmes barème & balance de caisse validés |
| `scripts/ops/notification_dispatch_engine.js` | Moteur Notifications | **`TESTÉ_SANDBOX_SEULEMENT`** | `centre_de_notifications/` | Logique retry & dédoublonnage validée hors prod |
| `scripts/ops/api_integration_security.js` | Sécurité HMAC Webhooks | **`TESTÉ_SANDBOX_SEULEMENT`** | `backend/routes/webhooks.js` | Validation cryptographique HMAC-SHA256 validée |
| `scripts/ops/simulate_24h_qualification_dry_run.js` | Simulateur Dry-Run 24h | **`OUTIL_DE_TEST_NON_INTÉGRÉ`** | Qualification 24h | Outil d'évaluation en lecture seule |
| `scripts/ops/20260831_hardening_worker_schema_reversible.sql` | Migration SQL Préparée | **`OUTIL_DE_TEST_NON_INTÉGRÉ`** | Schéma PostgreSQL `worker_execution_logs` | Script DDL prêt, non appliqué en production |
| `scripts/ops/service_worker_spec.md` | Spécification Déploiement | **`OUTIL_DE_TEST_NON_INTÉGRÉ`** | Service Windows NSSM | Guide d'installation et politique de redémarrage |
| `scripts/ops/rollback_plan.md` | Procédure Opérationnelle | **`OUTIL_DE_TEST_NON_INTÉGRÉ`** | Runbook Support / Ops | Documentation des seuils et actions de secours |
| `scripts/ops/24h_timeout_qualification_checklist.md` | Checklist Opérationnelle | **`OUTIL_DE_TEST_NON_INTÉGRÉ`** | Procédure 24h | Matrice décisionnelle des 13 transactions |
| `scripts/ops/support_handbook_and_faq.md` | Guide Support & FAQ | **`OUTIL_DE_TEST_NON_INTÉGRÉ`** | Portail d'Assistance | Dictionnaire des erreurs en français |
| `scripts/ops/test_isolated_suite.js` | Suite de Tests Unitaires | **`OUTIL_DE_TEST_NON_INTÉGRÉ`** | Banc d'essai 9 scénarios | Valide la résilience du worker en mémoire |
| `scripts/ops/run_all_domain_tests.js` | Exécuteur Général de Tests | **`OUTIL_DE_TEST_NON_INTÉGRÉ`** | CI / CD local | Valide l'ensemble des 7 modules hors production |
| Passerelle SBEE (Routes Canary) | Passerelle Fournisseur | **`DÉSACTIVÉ_VOLONTAIREMENT`** | `paiement_sbee_electricite/` | `is_active = false`, Canary = 0% |
| Payouts Fournisseurs & Marchands | Flux Virements Sortants | **`DÉSACTIVÉ_VOLONTAIREMENT`** | `retrait_marchand/` | 0 FCFA sorti, réserve préservée |
| Qualification Finale 24h (13 Tx) | Procédure Régularisation | **`BLOQUÉ_PAR_DÉPENDANCE`** | `public.process_expired_processing_bill_payments(24)` | Bloqué jusqu'au 01/09/2026 00:04:51.338Z UTC |
