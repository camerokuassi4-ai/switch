# Checklist de Release Multiplateforme Mobile — Switch Bénin v2.1.0

---

## 1. Sécurité & Zéro Secret

- [x] Aucun Keystore Android commité dans le dépôt Git.
- [x] Aucun certificat Apple (`.p12`, `.mobileprovision`) commité dans le dépôt Git.
- [x] Aucune clé privée ou mot de passe en dur dans le code client.
- [x] Verrouillage des routes financières backend (`HTTP 403 FEATURE_NOT_AVAILABLE`).

---

## 2. Configuration Plateformes

- [x] **Identifiant d'Application (`appId`)** : `com.switchbenin.app`
- [x] **Nom d'Application (`appName`)** : `Switch Bénin`
- [x] **Configuration Capacitor** : [`capacitor.config.json`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/capacitor.config.json)
- [ ] **URL Web Publique Vercel** : `https://TO_BE_CONFIGURED_VERCEL_APP_URL` (En attente du propriétaire)
- [x] **Versions Minimales Requises** : Android 7.0+ (API 24+), iOS 14.0+, iPadOS 14.0+.

---

## 3. Déclaration de Statuts

* **`PUBLIC_BETA_ALL_126_SCREENS_READY`**
* **`REAL_MONEY_DISABLED`**
* **`VISA_DISABLED`**
* **`SBEE_DISABLED`**
* **`QR_PAYMENT_DISABLED`**
* **`PAYOUTS_DISABLED`**
* **`WORKER_AUTOMATIC_PERSISTENT`**
* **`PENDING_OPERATIONS_MONITORED`**
