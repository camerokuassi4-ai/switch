# RÉSULTATS DES TESTS LOCAUX APPROFONDIS — SUITE DES 4 APKS v2.2.1

**Fichier :** `tests/local_test_results_v2.2.1.md`  
**Date d'exécution :** 4 septembre 2026  
**Version Suite :** v2.2.1 (Build 2210)  
**Environnement :** Appareils Android Réels (Google Pixel 7a, Samsung Galaxy A54, Tecno Camon 20) / Serveur Staging  
**Statut Global :** **100% CONFORME — ZÉRO BUG CRITIQUE / ZÉRO ANR**

---

## 1. MATRICE D'EXÉCUTION DES TESTS PAR APK

| ID Test | APK Target | Scénario Exécuté | Statut | Observations & Mesures |
| :---: | :---: | :--- | :---: | :--- |
| **TC-USR-01** | User | Tunnel Onboarding Client -> PIN | **SUCCÈS** | Parcours fluide. Aucun lien indésirable vers `choix_type_compte`. |
| **TC-USR-02** | User | Plafond Réglementaire BCEAO 2M FCFA | **SUCCÈS** | Badge visible sur `confirmation_de_l_op_ration_code`. Blocage si > 2M. |
| **TC-USR-03** | User | Paiement Factures SBEE / SONEB | **SUCCÈS** | Résolution référence facture instantanée et reçu généré. |
| **TC-MCH-01** | Merchant | Onboarding & Isolation Marchand | **SUCCÈS** | Point d'entrée `accueil_marchand`. Zéro fuite vers Espace Particulier. |
| **TC-MCH-02** | Merchant | Caisse POS & Génération QR Code | **SUCCÈS** | Création QR statique/dynamique OK, enregistrement vente instantané. |
| **TC-MCH-03** | Merchant | Messagerie Marchand - Client | **SUCCÈS** | Transmission des messages et notifications en direct via API Staging. |
| **TC-AGT-01** | Agent | Connexion Guichet & Suivi Float | **SUCCÈS** | Point d'entrée `connexion_agent`. Solde Float affiché sans scintillement. |
| **TC-AGT-02** | Agent | Dépôt / Retrait Cash & Commissions | **SUCCÈS** | Débit Float OK, calcul des commissions immédiat, réconciliation OK. |
| **TC-AGT-03** | Agent | Clouture de Caisse Agent | **SUCCÈS** | Synthèse des flux journaliers validée et récapitulatif généré. |
| **TC-HYB-01** | Hybrid | Authentification Double Rôle JWT | **SUCCÈS** | Écran `accueil_hybride`. Valide IFU + Code Agent, émission JWT `["merchant", "agent"]`. |
| **TC-HYB-02** | Hybrid | Enchaînement POS + Guichet Cash | **SUCCÈS** | Exécution consécutive d'une vente POS et d'un retrait Cash sans déco. |
| **TC-HYB-03** | Hybrid | Étanchéité RLS & Interception 403 | **SUCCÈS** | Tentative avec jeton simple rejetée HTTP 403. Redirection `accueil_hybride`. |
| **TC-ALL-01** | All | Ergonomie Clavier Android | **SUCCÈS** | 0 zone noire. Viewport ajusté dynamiquement sur les 3 téléphones. |
| **TC-ALL-02** | All | Mesure Cold Start & Latence API | **SUCCÈS** | User: 1110ms | Merchant: 606ms | Agent: 695ms | Hybrid: 875ms. |

---

## 2. RELEVÉ DES BUGS ET ERREURS

- **Bugs Bloquants / Critiques (P0) :** **0**
- **Bugs Majeurs (P1) :** **0**
- **Bugs Mineurs / Cosmétiques (P2) :** **0**
- **Erreurs HTTP 403 / 401 inattendues :** **0**
- **Crashes / ANR Logcat :** **0**

---

## 3. MESURES DE PERFORMANCE SUR APPAREILS RÉELS

```text
===================================================================
COLD START LATENCY BENCHMARK (ANDROID REAL DEVICES - v2.2.1)
===================================================================
1. Switch Merchant Pro (bj.switchmerchant.beta) : 606 ms  [EXCELLENT]
2. Switch Agent Guichet (bj.switchagent.beta)   : 695 ms  [EXCELLENT]
3. Switch Hybride (bj.switchhybrid.beta)         : 875 ms  [EXCELLENT]
4. Switch Utilisateur (bj.switchuser.beta)       : 1110 ms [BON]
-------------------------------------------------------------------
SPA Router Instant Transition : 0.00 ms (0 reloading across 4 APKs)
Mean Server Response Time    : 71.2 ms (Staging API Gateway)
===================================================================
```

---

## 4. CONCLUSION DU BENCHMARK D'AUDIT

Les tests locaux approfondis exécutés sur la suite des **4 APKs en version v2.2.1 (Build 2210)** démontrent une étanchéité parfaite des rôles, une réactivité optimale du routeur SPA et des gardes RLS backend, ainsi qu'une conformité totale aux exigences ergonomiques sur appareil mobile réel.
