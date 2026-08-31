# Notes de Version — Switch Bénin Bêta Publique v2.1.0-RC1 (Bêta Sans Transactions)

**Date d'émission** : 31 Août 2026  
**Statut Global** : `PUBLIC_BETA_ALL_126_SCREENS_READY` | `REAL_MONEY_DISABLED` | `DEMO_FINANCIAL_SCREENS_ONLY`  
**Worker de Production** : `PID 5672` (Actif & Ininterrompu)  

---

## 1. Vue d'Ensemble de la Version

La version **Bêta Publique Switch Bénin v2.1.0-RC1** ouvre l'ensemble des parcours interactifs aux utilisateurs, commerçants et agents afin d'évaluer l'ergonomie, la réactivité PWA, les flux de messagerie et la navigation métier en conditions réelles, avec une politique de **sécurité financière hermétique (zéro transaction réelle)**.

---

## 2. Découpage Fonctionnel des 126 Écrans Qualifiés

| Espace Utilisateur | Nombre d'Écrans | Statut de Qualification | Fonctionnalités Clés Ouvertes |
| :--- | :---: | :---: | :--- |
| **1. Particulier / Utilisateur** | **`58`** | `ROLE_USER_PASS` | Onboarding, Catalogue Marketplace, Scanner QR, Messagerie, Tontines, Coffres d'épargne. |
| **2. Marchand & Business** | **`24`** | `ROLE_MERCHANT_PASS` | Dashboard Pro, Catalogue & Stock, Générateur QR dynamique, Caisse POS, Carnet de dettes. |
| **3. Agent Kiosque Switch** | **`28`** | `ROLE_AGENT_PASS` | Dashboard Guichet, Barème commissions, Float démo, Clôture journalière simulée. |
| **4. Point Hybride (Commerce & Guichet)** | **`16`** | `ROLE_FOURTH_PASS` | Double caisse POS + Guichet cash, facturation services démo. |
| **TOTAL GÉNÉRAL** | **`126`** | **`PUBLIC_BETA_ALL_126_SCREENS_READY`** | **118 E2E_VERIFIED / 6 BLOCKED_BY_DESIGN / 2 PASS_WITH_KNOWN_LIMITATION** |

---

## 3. Garde-fous Financiers & Libellés Officiels

Toute tentative d'opération financière réelle est interceptée par le backend de staging et renvoie le code **`HTTP 403 Forbidden` (`FEATURE_NOT_AVAILABLE`)** :

* **Paiements Réels** : `REAL_MONEY_DISABLED` (Aucun prélèvement bancaire ou GSM).
* **Dépôts Réels** : `REAL_DEPOSIT_DISABLED` (Dépôts cash guichet en `DEMO_MODE` uniquement).
* **Retraits Réels** : `REAL_WITHDRAWAL_DISABLED` (Retraits espèces en `DEMO_MODE` uniquement).
* **Paiement par QR Code** : `QR_PAYMENT_DISABLED` (Résolution de payload active, débit bloqué).
* **Cartes Bancaires Visa** : `VISA_DISABLED` (Formulaires marqués en maquette UI).
* **Recharges Électricité SBEE** : `SBEE_DISABLED` (Canary scellé en attente des 24h).
* **Virements Sortants & Payouts** : `PAYOUTS_DISABLED` (Fonds séquestrés verrouillés à 100%).
* **Micro-crédits & Bons du Trésor** : `PASS_WITH_KNOWN_LIMITATION` / `UI_ONLY` (Simulateurs visuels).

---

## 4. Invariants Comptables Scellés

* **Transactions Canary en `processing`** : `13` (`325 000 FCFA` séquestrés).
* **Solde Séquestre UBA** : `50 000 000 FCFA` (Parité 1:1, écart `0 FCFA`).
* **Horloge de Référence** : `PostgreSQL 10.0.1.15 clock_timestamp()` UTC.
