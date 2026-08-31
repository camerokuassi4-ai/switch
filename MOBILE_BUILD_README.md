# Guide de Compilation Mobile Multiplateforme — Architecture Découplée (Option A)

Ce guide détaille l'ensemble des prérequis, commandes de build et procédures de publication pour les plateformes Android et iOS/iPadOS utilisant Capacitor branché sur le frontend Vercel et l'API dédiée.

---

## 1. Architecture Découplée Option A

* **`FRONTEND_HOST`** : `VERCEL` (Hébergement du dossier `www/`)
* **`API_HOST`** : `SERVER_PUBLIC_SEPARATE` (API Node.js sur serveur dédié)
* **`DATABASE`** : `SUPABASE` (`dfzyyawclnxcgykktrbr`)
* **`WORKER`** : `PERSISTENT_SEPARATE_HOST`
* **`PUBLIC_API_ORIGIN`** : `TO_BE_PROVIDED_BY_OWNER`
* **`VISA`** : `DISABLED`
* **`SBEE`** : `DISABLED`
* **`QR_PAYMENT`** : `DISABLED`
* **`PAYOUTS`** : `DISABLED`

---

## 2. Commandes de Build Android & iOS

```bash
# 1. Synchronisation Capacitor
npx cap sync

# 2. Build Android (Windows / Linux / macOS)
cd android && ./gradlew assembleDebug

# 3. Build iOS / iPadOS (macOS Requis)
npx cap open ios
```
