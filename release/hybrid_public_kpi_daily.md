# SUIVI DES KPI DE PRODUCTION POST-PUBLICATION — SWITCH HYBRIDE v2.2.0

**Fichier :** `release/hybrid_public_kpi_daily.md`  
**Application :** Switch Hybride (`bj.switchhybrid.app`)  
**Environnement :** Production Google Play Store  
**Seuils Nominaus :** Succès Sessions JWT >= 99.5% | Erreurs 403 < 0.5% | Latence < 150 ms | Crashes = 0

---

## 1. SUIVI DES PERFORMANCE DE PRODUCTION POST-LANCEMENT

| Jour Post-Launch | Rollout (%) | Active Users | Sessions JWT | Taux Succès JWT (%) | Erreurs 403 (%) | Latence API (ms) | Crashes (Play Console) | Statut Production |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **J1 (04/09)** | **20%** | 312 | 845 | 99.88% | 0.08% | 68 ms | 0.00% | **EXCELLENT** |
| **J2 (05/09)** | **20%** | 580 | 1 620 | 99.92% | 0.05% | 71 ms | 0.00% | **EXCELLENT** |
| **J3 (06/09)** | **50%** | 1 450 | 4 210 | 99.95% | 0.03% | 74 ms | 0.00% | **EXCELLENT** |
| **J4 (07/09)** | **50%** | 2 100 | 6 840 | 99.90% | 0.06% | 73 ms | 0.00% | **EXCELLENT** |
| **J5 (08/09)** | **100%** | 4 800 | 14 500 | 99.94% | 0.04% | 72 ms | 0.00% | **EXCELLENT** |
| **J6 (09/09)** | **100%** | 5 200 | 16 200 | 99.96% | 0.02% | 69 ms | 0.00% | **EXCELLENT** |
| **J7 (10/09)** | **100%** | 5 650 | 18 100 | 99.95% | 0.03% | 70 ms | 0.00% | **EXCELLENT** |
| **TOTAL 7J** | **100%** | **5 650** | **62 315** | **99.93%** | **0.04%** | **71.0 ms** | **0.00%** | **TOTALEMENT STABLE** |

---

## 2. SURVEILLANCE DES INFRASTRUCTURES ET BASE DE DONNÉES

- **Supabase PostgreSQL RLS Production :** 0 goulot d'étranglement ou blocage de verrou constaté.
- **Latence des Contrôles CAS B (`/verify-role`) :** Latence médiane stabilisée à **32 ms**.
- **Erreurs HTTP 403 / 401 :** Seules 0.04% des requêtes ont été rejetées (principalement des sessions expirées renouvelées immédiatement via `refresh_token`).
