# CHECKLIST DE DIFFUSION BÊTA PRIVÉE — SWITCH HYBRIDE v2.2.0

**Application :** Switch Hybride (`bj.switchhybrid.beta`)  
**Version :** v2.2.0  
**Canal de diffusion :** Distribution Bêta Privée / Restreinte (Points Agréés Bénin)  
**Date :** 4 septembre 2026

---

## 1. CHECKLIST DE PRÉ-DIFFUSION (VÉRIFICATIONS OBLIGATOIRES)

### A. Binaires & Packaging
- [x] Compilation locale exécutée : `node scripts/build_android_apks.js --app hybrid`
- [x] Alignement exact de la liste des écrans `HYBRID_SCREENS` (227 fichiers, 35.93 MB).
- [x] Vérification de l'absence physique de `choix_type_compte/code.html` dans `apps/hybrid/www/`.
- [x] Signature de l'APK de qualification Staging avec la clé de signature Bêta dédiée.

### B. Configuration Serveur & Gardes
- [x] Endpoints API Staging actifs (`POST /hybrid/session`, `GET /verify-role`, `POST /revoke-session`).
- [x] Politiques RLS Supabase Staging actives pour le rôle `hybrid` (`roles: ["merchant", "agent"]`).
- [x] Routage frontend [`assets/switch.router.js`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/assets/switch.router.js) verrouillé avec l'écran `renderAccessDeniedScreen()`.

### C. Liste Blanche des Testeurs (Canal Restreint Bénin)
- [x] Identification et enregistrement des 20 points de vente pilotes à Cotonou et Calavi.
- [x] Attribution des identifiants de test Staging (N° IFU + Code Distributeur Agent).
- [x] Validation de la convention d'utilisation Bêta Privée et engagement de confidentialité.

---

## 2. PROCÉDURE DE ROLLBACK EN CAS D'ANOMALIE CRITIQUE

En cas de détection d'une anomalie bloquante sur le terrain (ex: erreur 500 récurrente sur le float ou déconnexion intempestive) :

1. **Étape 1 — Blocage Serveur Instantané :**
   Désactivation de la clé de signature Bêta sur l'API Gateway Staging (`POST /api/v1/admin/disable-hybrid-beta-tokens`).
2. **Étape 2 — Notification des Testeurs :**
   Envoi d'une alerte Push / SMS aux 20 testeurs enregistrés demandant la suspension temporaire des saisies en caisse.
3. **Étape 3 — Révocation des Sessions Active :**
   Exécution du script de révocation globale des jetons Hybrides côté Supabase Staging.
4. **Étape 4 — Correction & Nouveau Patch v2.2.1 :**
   Résolution de l'incident, exécution d'un cycle d'audit 50 cycles et re-validation par le Chef de Projet.
