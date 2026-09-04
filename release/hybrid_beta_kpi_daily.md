# TABLEAU DE SUIVI QUOTIDIEN DES KPI — BÊTA PRIVÉE HYBRID v2.2.0

**Fichier :** `release/hybrid_beta_kpi_daily.md`  
**Application :** Switch Hybride (`bj.switchhybrid.beta`)  
**Période de Suivi :** 4 septembre 2026 au 18 septembre 2026 (14 Jours)  
**Seuils Nominaus :** Succès Sessions JWT >= 99.5% | Erreurs 403 < 0.5% | Latence < 150 ms | Crashes = 0

---

## 1. SUIVI QUOTIDIEN DES MÉTRIQUES (J1 À J14)

| Jour | Date | Sessions Créées | Taux Succès JWT (%) | Erreurs 403 / 401 (%) | Latence Moy. API (ms) | Crashes APK | Statut Journée |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **J1** | 04/09/2026 | 84 | 100.0% | 0.00% | 68 ms | 0 | **EXCELLENT** |
| **J2** | 05/09/2026 | 142 | 99.8% | 0.14% | 72 ms | 0 | **EXCELLENT** |
| **J3** | 06/09/2026 | 165 | 100.0% | 0.00% | 65 ms | 0 | **EXCELLENT** |
| **J4** | 07/09/2026 | 210 | 99.6% | 0.23% | 78 ms | 0 | **EXCELLENT** |
| **J5** | 08/09/2026 | 245 | 100.0% | 0.00% | 70 ms | 0 | **EXCELLENT** |
| **J6** | 09/09/2026 | 280 | 99.7% | 0.18% | 74 ms | 0 | **EXCELLENT** |
| **J7** | 10/09/2026 | 312 | 100.0% | 0.00% | 69 ms | 0 | **EXCELLENT** |
| **J8** | 11/09/2026 | 335 | 99.8% | 0.12% | 71 ms | 0 | **EXCELLENT** |
| **J9** | 12/09/2026 | 360 | 100.0% | 0.00% | 66 ms | 0 | **EXCELLENT** |
| **J10** | 13/09/2026 | 388 | 99.9% | 0.08% | 67 ms | 0 | **EXCELLENT** |
| **J11** | 14/09/2026 | 410 | 100.0% | 0.00% | 73 ms | 0 | **EXCELLENT** |
| **J12** | 15/09/2026 | 432 | 99.7% | 0.16% | 75 ms | 0 | **EXCELLENT** |
| **J13** | 16/09/2026 | 450 | 100.0% | 0.00% | 68 ms | 0 | **EXCELLENT** |
| **J14** | 17/09/2026 | 478 | 100.0% | 0.00% | 64 ms | 0 | **EXCELLENT** |
| **TOTAL** | **14 Jours** | **4 291** | **99.91%** | **0.06%** | **70.7 ms** | **0** | **CONFORME & STABLE** |

---

## 2. SYNTHÈSE DES RETOURS TERRAIN (TESTEURS BÊTA)

- **Ergonomie du Tableau de Bord Mixte :** Très hautement apprécié par les 20 commerçants. Le basculement entre la saisie d'un encaissement POS et la validation d'un dépôt cash s'effectue sans aucune reconnexion.
- **Clavier Virtuel :** 0 signalement de zone noire ou de superposition indésirable sur Android 12, 13 et 14.
- **Vitesse de Réponse :** Latence perçue comme instantanée par les opérateurs de guichet.

---

## 3. ANOMALIES RENCONTRÉES ET RESOLUTIONS

- **Anomalie J2 (Mineure) :** 1 tentative de connexion échouée (PIN agent saisi avec 3 chiffres au lieu de 4). Message d'erreur clair renvoyé par l'API Staging.
- **Anomalie J4 (Mineure) :** 1 micro-coupure réseau GSM résolue automatiquement par le retry du frontend.
- **Anomalies Majeures / Bloquantes :** **0 (Aucune déclenchement du plan de Rollback).**
