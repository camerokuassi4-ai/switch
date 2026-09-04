# NOTES DE VERSION CONSOLIDÉES — SWITCH BÉNIN v2.2.1 (SUITE DES 4 APKS)

**Date :** 4 septembre 2026  
**Version Suite :** v2.2.1 (Build 2210)  
**Canal :** Bêta Privée Restreinte / Qualification Locale  
**APKs Concernées :** User (`bj.switchuser.beta`), Merchant (`bj.switchmerchant.beta`), Agent (`bj.switchagent.beta`), Hybrid (`bj.switchhybrid.beta`)

---

## 1. HISTORIQUE ET MOTIVATION DE LA VERSION v2.2.1

La version **v2.2.1** harmonise l'ensemble de la suite applicative Switch Bénin (User v2.1.1, Merchant v2.1.1, Agent v2.1.1, Hybrid v2.2.1) sur un numéro de build unifié (**VersionCode: 2210 / VersionName: "2.2.1"**).

---

## 2. SYNTHÈSE DES NOUVEAUTÉS ET CORRECTIONS PAR RÔLE

### A. Switch Hybride (`bj.switchhybrid.beta` — v2.2.1)
- **Alignement de Version :** Passage de v2.2.0 à v2.2.1 (VersionCode: 2210).
- **Gestionnaire JWT Staging :** Durcissement des contrôles d'expiration des jetons à double signature `roles: ["merchant", "agent"]`.
- **Écran d'Accueil [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html) :** Optimisation des transitions vers les parcours d'inscription et de connexion double rôle.
- **Isolation de Bundle :** Maintien de l'exclusion stricte de `choix_type_compte` (227 fichiers embarqués, 35.93 MB).

### B. Switch Utilisateur (`bj.switchuser.beta` — v2.2.1)
- **Navigation & Parrainage :** Fluidification du tunnel de transfert Mobile Money & Switch-to-Switch.
- **Plafonnement BCEAO :** Ajout du badge d'alerte des limites réglementaires (2 000 000 FCFA / jour).

### C. Switch Marchand Pro (`bj.switchmerchant.beta` — v2.2.1)
- **Caisse POS & QR Code :** Génération instantanée des QR codes de réception statiques et dynamiques.
- **Messagerie Client :** Fluidification de la messagerie intégrée acheteur-marchand.

### D. Switch Agent Guichet (`bj.switchagent.beta` — v2.2.1)
- **Gestion du Float :** Validation renforcée des demandes de réapprovisionnement de Float et calcul automatique des commissions.
- **Clôture de Caisse :** Module de clôture journalière et réconciliation de caisse guichet.

---

## 3. TABLEAU DES MÉTRIQUES ET PERFORMANCES COMPARATIVES

| APK Candidate | Package ID | VersionCode / Name | Cold Start (ms) | Taille Bundle | Gardes RLS Backend |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Switch User** | `bj.switchuser.beta` | 2210 / 2.2.1 | 1 110 ms | 41.56 MB | Restreint User |
| **Switch Merchant** | `bj.switchmerchant.beta` | 2210 / 2.2.1 | 606 ms | 34.65 MB | `app_metadata.role = merchant` |
| **Switch Agent** | `bj.switchagent.beta` | 2210 / 2.2.1 | 695 ms | 33.57 MB | `app_metadata.role = agent` |
| **Switch Hybrid** | `bj.switchhybrid.beta` | 2210 / 2.2.1 | 875 ms | 35.93 MB | `roles: ["merchant", "agent"]` |
