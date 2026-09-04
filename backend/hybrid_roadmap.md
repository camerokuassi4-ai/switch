# ROADMAP OFFICIELLE DE DÉBLOCAGE DE L'APK HYBRIDE — v2.2.0

**Composant :** Programme de Déblocage Switch Hybride (`bj.switchhybrid.beta`)  
**Date d'établissement :** 4 septembre 2026  
**Objectif :** Définir la séquence ordonnée des jalons backend et frontend nécessaires à la levée du gel de publication.

---

## 1. JALONS DE DÉBLOCAGE ET CRITÈRES D'ACCEPTATION

```
┌─────────────────────────────────────────────────────────────────────────┐
│ JALON 1 : Backend & Politiques RLS Supabase (Staging)                   │
├─────────────────────────────────────────────────────────────────────────┤
│ JALON 2 : Validation des Tests d'Intégration RLS (Automatisés)         │
├─────────────────────────────────────────────────────────────────────────┤
│ JALON 3 : Intégration Frontend WebView (`accueil_hybride` & Token)     │
├─────────────────────────────────────────────────────────────────────────┤
│ JALON 4 : Audit de Qualification Mobile & Levée Officielle du Gel      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Jalon 1 : Backend & Politiques RLS Supabase (Environnement Staging)
- **Livrables :**
  - Scripts SQL de politiques RLS multi-tenants (`merchant_transactions`, `agent_floats`).
  - Endpoint `POST /api/v1/auth/hybrid/session` émettant des revendications JWT `roles: ["merchant", "agent"]`.
- **Critère d'acceptation :** Le serveur de Staging rejette les requêtes modifiant la table float si le jeton n'a pas le claim `agent`.

### Jalon 2 : Validation des Tests d'Intégration RLS Automatisés
- **Livrables :**
  - Exécution du script Jest [`backend/integration_tests_plan.md`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/backend/integration_tests_plan.md).
- **Critère d'acceptation :** 100% des tests de tentative d'accès croisé renvoient des erreurs 403 Forbidden.

### Jalon 3 : Intégration Frontend WebView
- **Livrables :**
  - Connexion de l'écran [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html) à l'API de session Hybride.
  - Sauvegarde sécurisée du `access_token` JWT serveur dans le gestionnaire de session.
- **Critère d'acceptation :** Le routeur `switch.router.js` valide le jeton auprès de `/api/v1/auth/verify-role` sans fallback local.

### Jalon 4 : Audit de Qualification Mobile & Levée Officielle du Gel
- **Livrables :**
  - Réalisation sans échec de 50 cycles complets d'opérations POS et Guichet sur terminal Android physique.
  - Temps de premier démarrage mesuré < 1500 ms (actuellement 875 ms sur `accueil_hybride`).
- **Critère d'acceptation :** Sign-off explicite du Chef de Projet levant le gel consigné dans `release/hybrid_hold.md`.

---

## 2. PLANNING PRÉVISIONNEL D'EXÉCUTION

| Jalon | Responsable | Durée estimée | Date cible | Statut |
| :--- | :--- | :---: | :---: | :---: |
| **Jalon 1 (RLS Backend)** | Équipe Backend / DB | 3 jours | 8 septembre 2026 | À démarrer |
| **Jalon 2 (Tests Jest)** | Équipe QA / Staging | 1 jour | 9 septembre 2026 | À démarrer |
| **Jalon 3 (Frontend Sync)** | Équipe Mobile Web | 2 jours | 11 septembre 2026 | À démarrer |
| **Jalon 4 (Audit & Unblock)** | Chef de Projet / QA | 1 jour | 12 septembre 2026 | En attente Jalons 1-3 |
