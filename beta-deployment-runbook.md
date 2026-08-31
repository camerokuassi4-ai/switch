# Runbook de Déploiement & Rollback — Bêta Publique Switch Bénin

---

## 1. Procédure de Déploiement Initial

1. **Vérification Préalable** : Valider l'intégrité de la branche `release/beta-public-v2.1.0`.
2. **Provisioning Système** : Installer Node.js LTS, Nginx et le gestionnaire de processus (PM2/Systemd).
3. **Configuration Réseau** : Mettre en place la configuration reverse proxy Nginx (`reverse-proxy.example.conf`).
4. **Attribution TLS** : Provisionner les certificats TLS (Certbot / Cloudflare Edge).
5. **Lancement Applicatif** : Démarrer le serveur unifié (`backend/staging_unified_server.js`) sur le port interne `4148`.
6. **Contrôles Smoke Test** :
   - Tester l'accès PWA (`HTTP 200`).
   - Tester le verrouillage financier (`HTTP 403 FEATURE_NOT_AVAILABLE` sur `/api/v1/payments/*`).
   - Tester le blocage des dossiers sensibles (`HTTP 403` sur `/scratch`, `/backups`, `/.env`).

---

## 2. Procédure de Rollback Immuable

En cas d'anomalie critique post-déploiement :

```ini
ROLLBACK_VERSION = 690b3f773828642da286d16904b2ff6022e3d8b5
ROLLBACK_METHOD = REDEPLOY_PREVIOUS_IMMUTABLE_VERSION
```

### Étapes Séquentielles de Rollback :
1. **Passage en Maintenance** : Activer la page de maintenance temporaire au niveau Nginx.
2. **Sauvegarde de l'État** : Exécuter un instantané complet du fichier `scratch/preprod_storage.json` et des journaux d'erreurs.
3. **Redéploiement de la Version Précédente** : Restaurer l'arbre applicatif au commit immuable `690b3f773828642da286d16904b2ff6022e3d8b5`.
4. **Contrôle Health** : Vérifier que le service répond correctement sur son endpoint d'intégrité.
5. **Contrôle 403 Financier** : Confirmer que les barrières financières demeurent 100% étanches.
6. **Vérification PWA** : Valider le rechargement propre de l'interface utilisateur.
7. **Remise en Ligne** : Désactiver le mode maintenance et réouvrir le trafic reverse proxy.
8. **Conservation des Logs** : Archiver les journaux d'incident pour analyse post-mortem.
