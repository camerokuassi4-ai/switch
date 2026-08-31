# Exigences d'Infrastructure — Déploiement Bêta Publique Switch Bénin v2.1.0

Ce document spécifie l'ensemble des paramètres d'infrastructure d'hébergement, de routage, de sécurité TLS et de reverse proxy à renseigner par le propriétaire avant toute ouverture publique.

---

## 1. Paramètres d'Infrastructure Cible à Renseigner

```ini
PUBLIC_DOMAIN = TO_BE_PROVIDED_BY_OWNER
DNS_PROVIDER = TO_BE_PROVIDED_BY_OWNER
HOSTING_PROVIDER = TO_BE_PROVIDED_BY_OWNER
REVERSE_PROXY = NGINX_OR_CADDY_CONFIG_PENDING
TLS_CERTIFICATE = LETS_ENCRYPT_OR_EDGE_SSL_PENDING
NODE_PROCESS_MANAGER = PM2_OR_SYSTEMD_PENDING
INTERNAL_PORT = 4148
PUBLIC_API_ORIGIN = TO_BE_DERIVED_FROM_PUBLIC_DOMAIN
BACKUP_LOCATION = TO_BE_PROVIDED_BY_OWNER
MONITORING_ENDPOINT = /api/v1/health
ROLLBACK_COMMAND = git checkout 690b3f7
```

---

## 2. Topologie Réseau & Routage Prévue

```mermaid
graph LR
    User["Utilisateur Public / PWA"] -->|HTTPS 443| Edge["Cloudflare / Edge TLS"]
    Edge -->|Proxy Pass| ReverseProxy["Nginx / Reverse Proxy"]
    ReverseProxy -->|HTTP Port 4148| NodeServer["Node.js Unified Server (Port 4148)"]
    NodeServer -->|Lecture / Écriture| JSONStore["scratch/preprod_storage.json"]
    NodeServer -->|HTTP 403| FinShield["Financial Guard (Paiements Bloqués)"]
```

---

## 3. Garde-fous de Sécurité & Étanchéité Staging

* **Zéro Transaction Réelle** : Toute requête vers `/api/v1/payments/*` est rejetée avec le code **`HTTP 403 Forbidden` (`FEATURE_NOT_AVAILABLE`)**.
* **Stockage Isolé** : Le fichier [`scratch/preprod_storage.json`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/scratch/preprod_storage.json) est exclusivement dédié aux données de démonstration (catalogues, messagerie de test). Il ne contient aucun secret bancaire ni solde réel.
* **Interdiction d'Accès Public aux Chemins Sensibles** : Blocage strict au niveau du serveur applicatif et du reverse proxy pour :
  - `/scratch`
  - `/backups`
  - `/scripts`
  - `/.git`
  - `/.env`
  - `/package-lock.json`
