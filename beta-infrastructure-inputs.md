# Paramètres d'Infrastructure à Renseigner par le Propriétaire

Veuillez renseigner les champs ci-dessous avant l'exécution du runbook de déploiement :

| Paramètre | Valeur Attribuée | Statut Actuel |
| :--- | :--- | :---: |
| **`PUBLIC_DOMAIN`** | `TO_BE_PROVIDED_BY_OWNER` | En attente |
| **`DNS_PROVIDER`** | `TO_BE_PROVIDED_BY_OWNER` | En attente |
| **`HOSTING_PROVIDER`** | `TO_BE_PROVIDED_BY_OWNER` | En attente |
| **`REVERSE_PROXY`** | `TO_BE_CONFIGURED` | En attente |
| **`TLS_CERTIFICATE`** | `TO_BE_CONFIGURED` | En attente |
| **`NODE_PROCESS_MANAGER`** | `TO_BE_CONFIGURED (ex: PM2 / Systemd)` | En attente |
| **`INTERNAL_PORT`** | `4148` | **Fixé** |
| **`PUBLIC_API_ORIGIN`** | `TO_BE_DERIVED_FROM_PUBLIC_DOMAIN` | En attente |
| **`BACKUP_LOCATION`** | `TO_BE_PROVIDED_BY_OWNER` | En attente |
| **`MONITORING_ENDPOINT`** | `/api/v1/health` | **Fixé** |
| **`ROLLBACK_VERSION`** | `690b3f773828642da286d16904b2ff6022e3d8b5` | **Fixé** |
| **`ROLLBACK_METHOD`** | `REDEPLOY_PREVIOUS_IMMUTABLE_VERSION` | **Fixé** |
