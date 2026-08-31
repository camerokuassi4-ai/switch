# Release Candidate v2.1.0-RC1 — Dossier de Gel & Audit Final

## 1. Informations de Version & Gel Formel
- **Version Applicative** : `v2.1.0-RC1 (FROZEN)`
- **Classification de Validation** : **`PREPROD_FILE_STORAGE_VALIDATED`**
- **Date de Gel** : 31 Août 2026

## 2. Séparation Stricte des 6 Artefacts du Release

| # | Artefact | Contenu & Fichiers Inclus | Environnement | Rôle & Dépendances |
| :-: | :--- | :--- | :---: | :--- |
| **1** | **PWA Frontend** | `index.html`, 137 dossiers d'écrans PWA, `manifest.json`, `sw.js`, `assets/js/api_bridge.js` | Navigateur Client / WebView | Interface utilisateur autonome, appelle `/api/v1/*` |
| **2** | **Serveur API REST** | `backend/preprod_api_server.js`, `backend/staging_unified_server.js` | Node.js (Port 3050/4055) | Endpoints REST, Rate Limiting, RBAC, HMAC Webhooks |
| **3** | **Worker PostgreSQL** | `scripts/worker_auto_loop.js` | Tâche de Fond (PID 5672) | Démon permanent autonome, polling 15s sur PostgreSQL 10.0.1.15 |
| **4** | **Outils d'Audit & Ops** | `scripts/ops/` (Heartbeat, Dry-Run 24h, Réconciliation UBA, Tests) | CLI / Surveillance | Monitoring hors-bande, outillage de test en lecture seule |
| **5** | **Migration SQL** | `scripts/ops/20260831_hardening_worker_schema_reversible.sql` | PostgreSQL DDL | Script de durcissement réversible (`UP`/`DOWN`), non exécuté en prod |
| **6** | **Service Windows** | `scripts/ops/service_worker_spec.md` | Windows NSSM Service | Spécification de déploiement et politique de redémarrage après crash |

## 3. Typologie des Tests & Mocks Détectés

1. **Tests HTTP / JSON (`test_preprod_persistence_restart.js`, `test_frontend_e2e_staging.js`)** :
   - Exécutent de véritables requêtes HTTP Node.js sur le serveur unifié.
   - Utilisent le magasin persistant `scratch/preprod_storage.json`.
   - **Mocks Détectés** : Absence de simulation de navigateur headless (Puppeteer/Playwright) et persistance fichier JSON au lieu de tables PostgreSQL directes pour les routes préprod.
2. **Tests PostgreSQL Directs (`scripts/worker_auto_loop.js`, `monitor_worker_heartbeat.js`)** :
   - Connectés en direct à la base PostgreSQL `10.0.1.15` pour le polling temporel et l'audit financier UBA (50 000 000 FCFA).
3. **Sécurité & Isolation** :
   - Zéro clé de production, zéro montant réel, zéro webhook non autorisé utilisé dans les tests.

## 4. Matrice d'Évaluation GO / NO-GO

| Composant | Statut de Qualification | Avis GO / NO-GO | Conditions & Justification |
| :--- | :---: | :---: | :--- |
| **Worker Permanent (PID 5672)** | `PRODUCTION_ACTIVE` | **`GO`** | Actif depuis >10h, >2680 ticks, 0 incident. |
| **Réconciliation UBA 1:1** | `PRODUCTION_VERIFIED` | **`GO`** | 41.8M dispo + 8.2M locked = 50M total, 0 FCFA d'écart. |
| **PWA Frontend (137 Écrans)** | `PREPROD_VALIDATED` | **`GO`** | Écrans PWA complets avec `api_bridge.js`. |
| **Serveur API (File Store)** | `PREPROD_FILE_STORAGE_VALIDATED` | **`GO (Préprod)` / `NO-GO (Prod)`** | Prêt pour préproduction, nécessite migration DB pour prod. |
| **Routes Facturation SBEE** | `DÉSACTIVÉE_VOLONTAIREMENT` | **`NO-GO`** | Routes fermées jusqu'à l'échéance 24h. |
| **Payouts Fournisseurs** | `DÉSACTIVÉE_VOLONTAIREMENT` | **`NO-GO`** | Strictement suspendus. |
| **Migration SQL DDL** | `PRÉPARÉE_NON_APPLIQUÉE` | **`NO-GO`** | En attente de validation humaine explicite. |
| **Service Windows NSSM** | `DOCUMENTÉ_NON_INSTALLÉ` | **`NO-GO`** | En attente de fenêtre de maintenance. |

* **Avis Global** : **`GO PRÉPRODUCTION CONDITIONNEL`** *(Tous les parcours sont validés sous stockage persistant de préproduction ; la mise en production intégrale reste conditionnée au raccordement PostgreSQL direct et à la qualification 24h).*
