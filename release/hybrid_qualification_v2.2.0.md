# DOSSIER DE QUALIFICATION TECHNIQUE ET FONCTIONNELLE — SWITCH HYBRIDE v2.2.0

**Document :** Dossier Majeur de Qualification (Release Candidate v2.2.0)  
**Date :** 4 septembre 2026  
**Auteur :** Antigravity AI — Lead Security & Release Engineer  
**Environnement :** Staging / Bêta Privée Canal Restreint  
**Package Application :** `bj.switchhybrid.beta`

---

## 1. SYNTHÈSE DE LA QUALIFICATION (JALONS 1 À 4)

La version **v2.2.0 Candidate** de l'application **Switch Hybride** marque l'aboutissement de la refonte architecturale par rôles pour les établissements exerçant la double activité de **Caisse POS** et de **Guichet Cash**.

### A. Bilan des Jalons de Sécurité
- **Jalon 1 (RLS Marchand Staging) :** Application et validation des politiques RLS sur les tables `ventes`, `produits`, `liens_de_paiement`.
- **Jalon 2 (RLS Agent & Tests Jest 403) :** Validation à 100% (13/13 tests) des fermetures 403 sur les accès croisés.
- **Jalon 3 (Raccordement JWT Frontend) :** Raccordement des endpoints `/session`, `/verify-role`, `/revoke-session` dans [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html) et le routeur central.
- **Jalon 4 (Audit d'Endurance 50 Cycles) :** **50/50 cycles E2E exécutés avec succès** (100% de réussite, latence moyenne 237 ms/cycle, 0 crash/ANR logcat).

### B. Liens d'Audit et Sign-off Backend
- Synthèse de validation Jalon 4 : [`backend/jalon4_signoff.md`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/backend/jalon4_signoff.md)
- Relevé des 50 cycles E2E : [`backend/hybrid_50cycles_results.md`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/backend/hybrid_50cycles_results.md)
- Validation des gardes UX et clavier : [`backend/hybrid_ux_guards_validation.md`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/backend/hybrid_ux_guards_validation.md)

---

## 2. PÉRIMÈTRE FONCTIONNEL HOMOLOGUÉ (2-EN-1)

L'application v2.2.0 regroupe **12 écrans spécialisés** réservés exclusivement à la double habilitation :

1. [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html) — Écran d'accueil bi-ton 2-en-1 avec 2 CTAs équivalents.
2. [`tableau_de_bord_agent_mixte/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/tableau_de_bord_agent_mixte/code.html) — Dashboard unifié Caisse POS & Guichet Cash.
3. [`services_factures_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/services_factures_hybride/code.html) — Guichet Kiosque de paiement de factures SBEE / SONEB.
4. [`cloture_de_caisse_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/cloture_de_caisse_hybride/code.html) — Clôture combinée Fin de Journée.
5. [`param_tres_et_profil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/param_tres_et_profil_hybride/code.html) — Profil Établissement Agregé.
6. Écrans métiers partagés Marchand & Agent : `caisse_marchand_pos`, `catalogue_produits_services`, `historique_des_ventes`, `messagerie_marchand_clients`, `d_p_t_de_fonds_mis_jour_agent`, `retrait_de_fonds_mis_jour_agent`, `valider_une_op_ration_client`.

---

## 3. ANÁLYSE DES RISQUES ET MITIGATIONS

| Risque Identifié | Niveau de Sévérité | Mitigation Architecture Implémentée |
| :--- | :---: | :--- |
| **Tentative de contournement local par `localStorage`** | Élevé | Interception à 3 niveaux : App Guard package, contrôle serveur CAS B `/verify-role`, et isolation RLS Supabase. |
| **Pertes de réseau pendant une opération Guichet** | Moyen | Gestionnaire d'erreurs fetch interceptant les interruptions et empêchant la double validation de float. |
| **Instabilité du clavier Android sur petits écrans** | Faible | Enforcing du CSS `viewport-fit=cover` et tests réels validés sans zone noire. |

---

## 4. DÉCISION DE DIFFUSION (BÊTA PRIVÉE RESTREINTE)

- **Publication Store Public (Play Store) :** **INTERDITE**
- **Diffusion Bêta Privée :** **AUTORISÉE** via canal APK direct ou Firebase App Distribution restreint aux points de vente partenaires agréés par la BCEAO au Bénin.
