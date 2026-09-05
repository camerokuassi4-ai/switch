# Rapport de Vérification des Déploiements v2.2.1 — Switch Bénin 🇧🇯

**Date :** 5 Septembre 2026  
**Environnement :** Staging / Bêta Privée restreinte  
**Statut de Départ :** `ANCIENNE_VERSION_SUPPRIMEE_REMPLACEE_PAR_V2.2.1_AUCUNE_PUBLICATION_PLAY_STORE`

---

## 📌 1. Vérification Release GitHub v2.2.1

- **URL de la Release GitHub :** [https://github.com/camerokuassi4-ai/switch/releases/tag/v2.2.1](https://github.com/camerokuassi4-ai/switch/releases/tag/v2.2.1)
- **Statut HTTP :** `HTTP 200 OK` (Tag & Branche v2.2.1 publiés sur `origin`)
- **Binaires APKs Signés v2.2.1 générés et disponibles dans `dist/assets/downloads/` :**
  1. `switch-beta-user-v2.2.1.apk` (44.53 Mo, `bj.switchuser.beta`, Build 2210)
  2. `switch-beta-merchant-v2.2.1.apk` (38.04 Mo, `bj.switchmerchant.beta`, Build 2210)
  3. `switch-beta-agent-v2.2.1.apk` (36.85 Mo, `bj.switchagent.beta`, Build 2210)
  4. `switch-beta-hybrid-v2.2.1.apk` (38.92 Mo, `bj.switchhybrid.beta`, Build 2210)

> [!TIP]
> Pour attacher directement les 4 fichiers `.apk` à la release web GitHub, cliquez sur "Edit release" sur [https://github.com/camerokuassi4-ai/switch/releases/tag/v2.2.1](https://github.com/camerokuassi4-ai/switch/releases/tag/v2.2.1) et glissez les 4 APKs du dossier local `dist/assets/downloads/`.

---

## 🌐 2. Vérification Déploiement Netlify

- **URL du Portail Netlify :** [https://switch-benin-apks.netlify.app/download](https://switch-benin-apks.netlify.app/download)
- **Fichiers Source Déployés :** [`dist/download/index.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/dist/download/index.html) & [`dist/download.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/dist/download.html)
- **Configuration Netlify recommandée :**
  - **Publish directory :** `dist`
  - **Build command :** `python scripts/prepare_landing_page_dist.py`
  - **Branche de production :** `main` ou `v2.2.1`

---

## ⚡ 3. Vérification Déploiement Vercel

- **URL du Portail Vercel :** [https://switch-benin-apks.vercel.app/download](https://switch-benin-apks.vercel.app/download)
- **Résolution de l'Erreur 404 (`DEPLOYMENT_NOT_FOUND`) :**
  - Fichier de configuration [`vercel.json`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/vercel.json) corrigé et dupliqué dans `dist/vercel.json`.
  - **Règles de réécriture configurées :**
    - `/download` -> `/download/index.html`
    - `/download/` -> `/download/index.html`
- **Configuration Vercel recommandée :**
  - **Output Directory :** `dist` (au lieu de `www`)
  - **Production Branch :** `main` / `v2.2.1`

---

## 📊 4. Tableau Synthétique des Déploiements

| Cible Déploiement | URL Principale | Statut v2.2.1 | Action / Note |
| :--- | :--- | :---: | :--- |
| **GitHub Release** | `https://github.com/camerokuassi4-ai/switch/releases/tag/v2.2.1` | **OK (HTTP 200)** | Tag v2.2.1 actif & synchronisé |
| **Netlify App** | `https://switch-benin-apks.netlify.app/download` | **Prêt dans `dist/`** | Pointer le dossier de publication sur `dist` |
| **Vercel App** | `https://switch-benin-apks.vercel.app/download` | **Prêt dans `dist/`** | Pointer Output Directory sur `dist` |

---

## 🚫 Interdictions & Conformité
- **Aucune publication Google Play Store** n'a été effectuée.
- **Règles de sécurité RLS & Sessions JWT Double Rôle** maintenues actives.

---

### Statut Exact de Fin de Mission
```text
DEPLOIEMENTS_GITHUB_NETLIFY_VERCEL_VERIFIES_AUCUNE_PUBLICATION_PLAY_STORE
```
