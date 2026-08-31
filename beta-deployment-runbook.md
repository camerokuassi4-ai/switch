# Runbook de Déploiement & Rollback — Architecture Découplée Option A

---

## 1. Déploiement Frontend Vercel

1. **Génération du Dossier `www/`** :
   ```bash
   node scripts/ops/build_clean_www_frontend.js
   ```
2. **Import Vercel** :
   - Sélectionner le dépôt `camerokuassi4-ai/switch` et la branche `release/beta-public-v2.1.0`.
   - Définir `Root Directory: .` et `Output Directory: www`.
   - Build Command : `node scripts/ops/build_clean_www_frontend.js`.
3. **Attribution Domaine & HTTPS** : Vercel provisionne automatiquement le certificat SSL Edge.

---

## 2. Déploiement API Node.js Dédiée

1. **Hôte Dédié** : Démarrer `backend/staging_unified_server.js` via PM2 / Systemd sur le port `4148`.
2. **Reverse Proxy Nginx** : Configurer `reverse-proxy.example.conf` pour écouter sur `api.<domaine>` et proxy-passer vers `127.0.0.1:4148`.
3. **CORS & Sécurité** : Restreindre `Access-Control-Allow-Origin` au domaine Vercel.

---

## 3. Procédure Séquentielle de Rollback Immuable

```ini
ROLLBACK_VERSION = 690b3f773828642da286d16904b2ff6022e3d8b5
ROLLBACK_METHOD = REDEPLOY_PREVIOUS_IMMUTABLE_VERSION
```

1. **Passage en maintenance** (Nginx / Vercel Edge).
2. **Sauvegarde de l'état** (`scratch/preprod_storage.json`).
3. **Redéploiement de la version précédente** (`690b3f773828642da286d16904b2ff6022e3d8b5`).
4. **Contrôle health** (`/api/v1/health`).
5. **Contrôle 403 financier**.
6. **Vérification PWA**.
7. **Remise en ligne**.
8. **Conservation des logs**.
