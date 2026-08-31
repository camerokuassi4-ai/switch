# Exigences d'Infrastructure — Déploiement Bêta Publique Switch Bénin v2.1.0

Ce document spécifie l'ensemble des paramètres d'infrastructure d'hébergement, de routage, de sécurité TLS et de reverse proxy à renseigner par le propriétaire avant toute ouverture publique.

---

## 1. Paramètres d'Infrastructure Cible à Renseigner

```ini
PUBLIC_DOMAIN = TO_BE_PROVIDED_BY_OWNER
DNS_PROVIDER = TO_BE_PROVIDED_BY_OWNER
HOSTING_PROVIDER = TO_BE_PROVIDED_BY_OWNER
REVERSE_PROXY = TO_BE_CONFIGURED
TLS_CERTIFICATE = TO_BE_CONFIGURED
NODE_PROCESS_MANAGER = TO_BE_CONFIGURED
INTERNAL_PORT = 4148
PUBLIC_API_ORIGIN = TO_BE_DERIVED_FROM_PUBLIC_DOMAIN
BACKUP_LOCATION = TO_BE_PROVIDED_BY_OWNER
MONITORING_ENDPOINT = /api/v1/health
ROLLBACK_VERSION = 690b3f773828642da286d16904b2ff6022e3d8b5
ROLLBACK_METHOD = REDEPLOY_PREVIOUS_IMMUTABLE_VERSION
```

---

## 2. Procédure Séquentielle de Rollback

1. **Passage en maintenance** : Affichage d'une page temporaire au niveau reverse proxy.
2. **Sauvegarde de l'état** : Snapshot d'intégrité de `scratch/preprod_storage.json` et des logs.
3. **Redéploiement de la version précédente** : Rétablissement de l'arborescence au commit immuable `690b3f773828642da286d16904b2ff6022e3d8b5`.
4. **Contrôle health** : Vérification des réponses du serveur.
5. **Contrôle 403 financier** : Confirmation du verrouillage total des paiements.
6. **Vérification PWA** : Validation de l'intégrité des écrans.
7. **Remise en ligne** : Bascule du trafic reverse proxy vers le service actif.
8. **Conservation des logs** : Archivage sécurisé des journaux pour diagnostic.

---

## 3. Topologie Réseau & Routage Prévue

```mermaid
graph LR
    User["Utilisateur Public / PWA"] -->|HTTPS 443| Edge["Cloudflare / Edge TLS"]
    Edge -->|Proxy Pass| ReverseProxy["Nginx / Reverse Proxy"]
    ReverseProxy -->|HTTP Port 4148| NodeServer["Node.js Unified Server (Port 4148)"]
    NodeServer -->|Lecture / Écriture| JSONStore["scratch/preprod_storage.json"]
    NodeServer -->|HTTP 403| FinShield["Financial Guard (Paiements Bloqués)"]
```

---

## 4. Garde-fous de Sécurité & Étanchéité Staging

* **Zéro Transaction Réelle** : Toute requête vers `/api/v1/payments/*` est rejetée avec le code **`HTTP 403 Forbidden` (`FEATURE_NOT_AVAILABLE`)**.
* **Stockage Isolé** : Le fichier [`scratch/preprod_storage.json`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/scratch/preprod_storage.json) est exclusivement dédié aux données de démonstration (catalogues, messagerie de test). Il ne contient aucun secret bancaire ni solde réel.
* **Interdiction d'Accès Public aux Chemins Sensibles** : Blocage strict au niveau du serveur applicatif et du reverse proxy pour :
  - `/scratch`
  - `/backups`
  - `/scripts`
  - `/.git`
  - `/.env`
  - `/package-lock.json`
