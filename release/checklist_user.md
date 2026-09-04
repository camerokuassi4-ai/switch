# CHECKLIST DE PUBLICATION — SWITCH UTILISATEUR (USER APK v2.1.0)

**Application :** Switch Beta — Utilisateur  
**Package Android :** `bj.switchuser.beta`  
**Binaire cible :** `switch-beta-user-v2.1.0.apk`  
**Point d'entrée :** [`accueil_splash_mis_jour/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_splash_mis_jour/code.html)

---

## 1. PRÉREQUIS & AUDIT QUALITÉ

- [x] **Accueil Conforme :** Présence des 2 actions "Commencer" et "Se connecter".
- [x] **Packaging Rôle-Spécifique :** 284 fichiers dans `www/`, 0 artefact interdit (`.env`, `.git`).
- [x] **Performance Cold Start :** Temps moyen 1110 ms (< 1500 ms).
- [x] **Ergonomie Clavier :** Clavier virtuel sans zone noire, focus PIN fluide.
- [x] **Isolation Navigation :** Tente de redirection cross-role bloquée proprement par App Guard.
- [x] **Garde CAS B :** Solde et données sensibles protégés par authentification.

---

## 2. VALIDATION DES BINAIRES ET CANAUX

- **Nom du fichier APK :** `switch-beta-user-v2.1.0.apk` (Alias: `switch_user_beta.apk`)
- **Clef de signature :** Android Debug/Release Key (Keystore certifié Switch Bénin).
- **Canal de diffusion :** GitHub Pages / Vercel Beta Download Center privé.
- **URL publique de téléchargement :** `https://camerokuassi4-ai.github.io/switch/download/user/user-beta.apk`

---

## 3. PROCÉDURE DE ROLLBACK D'URGENCE

En cas d'anomalie critique sur le parcours utilisateur :
1. Réorienter l'alias `switch-beta.apk` vers le dernier build stable validé v2.0.9 dans GitHub Pages.
2. Invalider le cache Vercel via `vercel purge`.
3. Notifier l'équipe de qualification.
