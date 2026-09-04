# CHECKLIST DE PUBLICATION — SWITCH MARCHAND PRO (MERCHANT APK v2.1.0)

**Application :** Switch Beta — Marchand  
**Package Android :** `bj.switchmerchant.beta`  
**Binaire cible :** `switch-beta-merchant-v2.1.0.apk`  
**Point d'entrée :** [`accueil_marchand/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_marchand/code.html)

---

## 1. PRÉREQUIS & AUDIT QUALITÉ

- [x] **Accueil Conforme :** Présence des 2 actions "Créer mon Compte" et "Ouvrir ma Caisse / Se connecter".
- [x] **Suppression des fuites :** Nettoyage à 100% des liens d'en-tête vers `tableau_de_bord_mis_jour`.
- [x] **Exclusion physique :** `choix_type_compte` formellement **exclu** du bundle Web (122 fichiers dans `www/`).
- [x] **Performance Cold Start :** Temps moyen 606 ms (< 1500 ms).
- [x] **Ergonomie Clavier :** Formulaires d'inscription marchand et POS 100% réactifs sans zone noire.
- [x] **Garde CAS B :** Dashboard marchand inassAccessible sans session serveur validée.

---

## 2. VALIDATION DES BINAIRES ET CANAUX

- **Nom du fichier APK :** `switch-beta-merchant-v2.1.0.apk` (Alias: `switch_merchant_beta.apk`)
- **Clef de signature :** Android Key (Keystore certifié Switch Marchand Pro).
- **Canal de diffusion :** Centre de téléchargement bêta professionnel.
- **URL publique de téléchargement :** `https://camerokuassi4-ai.github.io/switch/download/merchant/merchant-beta.apk`

---

## 3. PROCÉDURE DE ROLLBACK D'URGENCE

En cas d'anomalie critique sur l'encaissement marchand :
1. Repointer la redirection de `download/merchant/` vers l'APK Marchand v2.0.8.
2. Basculer les commerçants en mode de secours Web POS PWA.
