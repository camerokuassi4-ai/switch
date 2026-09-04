# PLAN DE TESTS LOCAUX APPROFONDIS — SUITE DES 4 APKS v2.2.1

**Fichier :** `tests/local_test_plan_v2.2.1.md`  
**Date :** 4 septembre 2026  
**Version Suite :** v2.2.1 (Build 2210)  
**Environnement :** Staging / Tests Locaux sur Téléphones Android Réels  
**APKs Candidates :** `user`, `merchant`, `agent`, `hybrid`

---

## 1. OBJECTIFS ET PÉRIMPÈTRES DES TESTS LOCAUX

Ce plan de test qualifie de manière exhaustive les 4 APKs spécialisées avant tout arbitrage de diffusion publique. Il vérifie le respect strict du périmètre fonctionnel par rôle, le blocage des tentatives de franchissement de frontière inter-rôle, l'ergonomie mobile (clavier Android, navigation SPA), et la réactivité des gardes serveur (Supabase RLS & CAS B).

---

## 2. DÉFINITION DES PARCOURS DE TEST PAR APK

### A. APK 1 : Switch Utilisateur (`bj.switchuser.beta` — v2.2.1)
1. **Parcours 1.1 — Onboarding & Connexion :**
   - Écran initial [`accueil_splash_mis_jour/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_splash_mis_jour/code.html) -> CTAs "Créer un compte" / "Se connecter".
   - Inscription client grand public, validation OTP, création du code PIN à 4 chiffres.
   - Reconnexion via le PIN.
2. **Parcours 1.2 — Opérations Financières Client :**
   - Simulation de dépôt par Mobile Money (MTN / Moov Bénin).
   - Simulation de retrait d'espèces et génération du code QR / OTP de retrait agent.
   - Transfert d'argent Switch-to-Switch et transfert Mobile Money (limite 2 000 000 FCFA / jour).
   - Paiement de factures d'électricité SBEE et d'eau SONEB.
3. **Parcours 1.3 — Profil & Orientation Optionnelle :**
   - Consultation du profil, accès aux paramètres de sécurité.
   - Orientation optionnelle vers `choix_type_compte` (vérification que la page reste purement informative).

---

### B. APK 2 : Switch Marchand Pro (`bj.switchmerchant.beta` — v2.2.1)
1. **Parcours 2.1 — Onboarding & Connexion Marchand :**
   - Écran d'accueil spécialisé [`accueil_marchand/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_marchand/code.html).
   - Validation N° IFU, nom d'entreprise et setup du point de vente POS.
   - Vérification de l'absence totale de liens vers l'Espace Particulier dans le header / footer.
2. **Parcours 2.2 — Caisse POS & Ventes :**
   - Encaissement POS sur terminal physique.
   - Génération de QR code de réception de paiement marchand (statique & dynamique).
   - Consultation de l'historique des ventes et du carnet de dettes clients.
   - Envoi de liens de paiement marchand via messagerie intégrée.

---

### C. APK 3 : Switch Agent Guichet (`bj.switchagent.beta` — v2.2.1)
1. **Parcours 3.1 — Onboarding & Authentification Guichet :**
   - Écran de connexion dédié [`connexion_agent/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/connexion_agent/code.html) avec suivi de solde Float en header.
   - Validation du matricule agent distributeur et saisie de la caution.
2. **Parcours 3.2 — Opérations de Guichet & Commissions :**
   - Traitement des dépôts et retraits d'espèces pour les clients de passage.
   - Demande de réapprovisionnement de Float auprès du distributeur principal.
   - Consultation du barème de commissions et déclenchement d'un virement de commission.
   - Module de clôture de caisse agent fin de journée.

---

### D. APK 4 : Switch Hybride (`bj.switchhybrid.beta` — v2.2.1)
1. **Parcours 4.1 — Authentification Double Rôle :**
   - Écran d'accueil spécialisé [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html).
   - Clic sur "Se connecter à mon Point Hybride" -> Authentification combinée IFU Marchand + Code Agent.
   - Stockage sécurisé du JWT double rôle (`roles: ["merchant", "agent"]`).
2. **Parcours 4.2 — Dashboard Unifié & Opérations Croisées :**
   - Traitement consécutif d'une vente POS et d'un dépôt d'espèces au guichet sur le même terminal.
   - Vérification en direct des droits via `GET /api/v1/auth/verify-role`.
   - Clôture de caisse hybride combinée et fermeture de session avec `POST /api/v1/auth/revoke-session`.
   - Tentative de contournement ou accès direct -> Vérification du blocage 403 et redirection vers `accueil_hybride`.

---

## 3. GRILLE DE VALIDATION (CHECKLIST DE TEST)

| ID Test | APK Concernée | Intitulé du Scénario | Critère de Succès |
| :---: | :---: | :--- | :--- |
| **TC-USR-01** | User | Navigation Splash -> Inscription -> Connexion | Zéro lien vers `choix_type_compte` dans le tunnel normal |
| **TC-USR-02** | User | Plafond BCEAO 2M FCFA | Affichage du badge et blocage si montant > 2M FCFA |
| **TC-MCH-01** | Merchant | Isolation Espace Marchand | 0 lien vers Espace Particulier, exclusion `choix_type_compte` |
| **TC-MCH-02** | Merchant | Encaissement Caisse POS & QR Code | Génération QR et enregistrement vente HTTP 200 |
| **TC-AGT-01** | Agent | Connexion Guichet & Suivi Float | Entrée sur `connexion_agent` avec indicateur Float visible |
| **TC-AGT-02** | Agent | Opérations Dépôt / Retrait Cash | Mise à jour immédiate du solde et calcul commission |
| **TC-HYB-01** | Hybrid | Connexion Double Rôle JWT | Validation IFU + Code Agent, émission JWT `["merchant", "agent"]` |
| **TC-HYB-02** | Hybrid | Étanchéité RLS & Gardes 403 | Rejet HTTP 403 pour tout jeton simple tentant une route hybride |
| **TC-ALL-01** | All | Clavier Android sur Appareil Réel | Absence de zone noire, ajustement parfait du viewport |
| **TC-ALL-02** | All | Cold Start & Latence SPA | Cold start < 1.2s (User) et < 900ms (Pro/Hybrid), SPA 0ms |
