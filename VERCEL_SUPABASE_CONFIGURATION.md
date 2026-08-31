# Guide de Déploiement Vercel + Supabase — Architecture Option A (Découplée)

---

## 1. Découpage Architectural Option A

* **`FRONTEND_HOST`** : **`VERCEL`** (Déploiement statique optimisé du dossier `www/`)
* **`API_HOST`** : **`SERVER_PUBLIC_SEPARATE`** (Serveur API Node.js sur port dédié avec reverse proxy)
* **`DATABASE`** : **`SUPABASE`** (Projet `dfzyyawclnxcgykktrbr`)
* **`WORKER`** : **`PERSISTENT_SEPARATE_HOST`** (Processus autonome PID 5672)
* **`PUBLIC_API_ORIGIN`** : **`TO_BE_PROVIDED_BY_OWNER`** (Format : `https://api.<domaine>/api/v1`)
* **`VISA`** : **`DISABLED`**
* **`SBEE`** : **`DISABLED`**
* **`QR_PAYMENT`** : **`DISABLED`**
* **`PAYOUTS`** : **`DISABLED`**

---

## 2. Configuration Vercel

```ini
VERCEL_GIT_REPOSITORY = camerokuassi4-ai/switch
VERCEL_GIT_BRANCH = release/beta-public-v2.1.0
VERCEL_FRAMEWORK_PRESET = Other
VERCEL_BUILD_COMMAND = node scripts/ops/build_clean_www_frontend.js
VERCEL_OUTPUT_DIRECTORY = www
VERCEL_PREVIEW_URL = TO_BE_GENERATED_BY_VERCEL
```
