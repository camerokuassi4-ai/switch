# Checklist de Déploiement — Bêta Publique Switch Bénin v2.1.0-RC1

Checklist de conformité obligatoire préalable à l'ouverture de la Bêta Publique.

---

## 1. Intégrité Opérationnelle & Sécurité Backend

- [x] **Worker PostgreSQL de Production (PID 5672)** : Actif, polling toutes les 15s via `clock_timestamp()` PostgreSQL `10.0.1.15`, 0 crash, 0 erreur.
- [x] **Canary SBEE Électricité** : 13 transactions processing scellées (`325 000 FCFA`), `is_active = false`, `rollout_percent = 0`.
- [x] **Séquestre Bancaire UBA** : Total `50 000 000 FCFA` (`41 800 000 FCFA` disponible + `8 200 000 FCFA` verrouillé), écart `0 FCFA`.
- [x] **Verrouillage Financier Global** : Toutes les requêtes vers `/api/v1/payments/*` renvoient systématiquement **`HTTP 403 Forbidden` (`FEATURE_NOT_AVAILABLE`)**.
- [x] **Isolation des 4 Rôles** : Contrôles RBAC et IDOR validés entre Particulier, Marchand, Agent et Hybride.

---

## 2. Validation Frontend & Responsive (126 Écrans)

- [x] **126 Écrans Qualifiés** : 58 Utilisateur, 24 Marchand, 28 Agent, 16 Hybride (118 `E2E_VERIFIED`, 6 `BLOCKED_BY_DESIGN`, 2 `PASS_WITH_KNOWN_LIMITATION`, 0 `FAIL`, 0 `NOT_VERIFIED`).
- [x] **Responsive Multi-Résolutions** : Vérifié sans débordement sur 8 dimensions (320x568 à 1280x800).
- [x] **Bandeau Informatif Bêta** : Présent et explicite sur la désactivation des transactions réelles.
- [x] **Captures d'Écran d'Audit** : 42 captures enregistrées dans `scratch/screenshots_total_coverage/`.

---

## 3. Déclaration de Statuts

* **`PUBLIC_BETA_ALL_126_SCREENS_READY`**
* **`REAL_MONEY_DISABLED`**
* **`DEMO_FINANCIAL_SCREENS_ONLY`**
* **`REAL_DEPOSIT_DISABLED`**
* **`REAL_WITHDRAWAL_DISABLED`**
* **`QR_PAYMENT_DISABLED`**
* **`VISA_DISABLED`**
* **`SBEE_DISABLED`**
* **`PAYOUTS_DISABLED`**
* **`WORKER_AUTOMATIC_PERSISTENT`**
* **`PENDING_OPERATIONS_MONITORED`**
