# SPÉCIFICATIONS ET IMPLÉMENTATION DES ENDPOINTS DE SESSION HYBRID EN STAGING

**Statut du projet :** JALON 3 — STAGING ONLY  
**Date :** 4 septembre 2026  
**Auteur :** Antigravity AI — Lead Backend & Security Architect  
**Environnement :** Staging / Préproduction Supabase (Strictement hors production)

---

## 1. VUE D'ENSEMBLE

La solution **Switch Hybride** s'adresse aux points de vente exerçant simultanément une activité commerciale de détail (Caisse POS) et un guichet de services financiers d'espèces (Dépôt / Retrait Mobile Money & Cash).

Pour garantir une étanchéité absolue et prévenir toute élévation de privilèges locale (ex: modification de `localStorage` par un client), l'accès aux fonctionnalités double rôle exige l'émission par le serveur d'un **jeton JWT à double signature** délivré uniquement après la vérification croisée des identifiants Marchand et Agent.

---

## 2. SPÉCIFICATIONS DES ENDPOINTS API (STAGING)

### A. Endpoint 1 : Création de Session Hybride (`POST /api/v1/auth/hybrid/session`)

#### URL & Méthode
- **URL :** `https://staging-api.switch.bj/api/v1/auth/hybrid/session`
- **Méthode :** `POST`
- **Headers :** `Content-Type: application/json`

#### Validation des Entrées (Input Validation)
1. `merchant_ifu` : Chaîne numérique à 13 chiffres (N° IFU Bénin valide).
2. `merchant_pin` : Code PIN caisse à 4 chiffres.
3. `agent_code` : Matricule distributeur agréé (ex: `AGT-4092`).
4. `agent_pin` : Code PIN guichet à 4 chiffres.
5. `device_fingerprint` : Empreinte de l'appareil mobile Capacitor.

#### Exemple de Requête (Request Body)
```json
{
  "merchant_ifu": "1202619482019",
  "merchant_pin": "4920",
  "agent_code": "AGT-4092",
  "agent_pin": "8492",
  "device_fingerprint": "dev_android_948201_hybrid"
}
```

#### Exemple de Réponse 200 (Succès — Émission JWT Double Rôle)
```json
{
  "status": "success",
  "token_type": "Bearer",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTQ4MjAxNDgyOTAxIiwiZW1haWwiOiJwb2ludC5oeWJyaWRlLmNvdG9ub3VAc3dpdGNoLmJqIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhcHBfbWV0YWRhdGEiOnsicHJpbWFyeV9yb2xlIjoiaHlicmlkIiwicm9sZXMiOlsibWVyY2hhbnQiLCJhZ2VudCJdLCJtZXJjaGFudF9pZCI6Im1jaF84NDkyMDE5NCIsIm1lcmNoYW50X2lmdSI6IjEyMDI2MTk0ODIwMTkiLCJhZ2VudF9jb2RlIjoiQUdULTQwOTIiLCJ2ZXJpZmllZF9ieV9zZXJ2ZXIiOnRydWV9LCJpYXQiOjE3ODg1NjAwMDAsImV4cCI6MTc4ODU2MzYwMH0.signature_hash",
  "refresh_token": "ref_hybrid_9482019482019_staging",
  "expires_in": 3600,
  "user": {
    "id": "usr_948201482901",
    "primary_role": "hybrid",
    "roles": ["merchant", "agent"],
    "merchant_name": "Commerce & Kiosque La Plage",
    "agent_code": "AGT-4092",
    "ifu": "1202619482019"
  }
}
```

#### Exemples de Réponses d'Erreur (403 / 400)
- **403 Forbidden (Qualif. Partielle ou Invalide) :**
  ```json
  {
    "status": "error",
    "code": "HYBRID_QUALIFICATION_FAILED",
    "message": "L'établissement ne dispose pas d'une double habilitation Marchand et Agent validée par la BCEAO."
  }
  ```
- **400 Bad Request (PIN / IFU erroné) :**
  ```json
  {
    "status": "error",
    "code": "INVALID_CREDENTIALS",
    "message": "Le N° IFU Marchand ou le Code Agent fourni est incorrect."
  }
  ```

---

### B. Endpoint 2 : Vérification de Rôle en Direct (`GET /api/v1/auth/verify-role`)

#### URL & Méthode
- **URL :** `https://staging-api.switch.bj/api/v1/auth/verify-role`
- **Méthode :** `GET`
- **Headers :** `Authorization: Bearer <access_token>`

#### Description
Cet endpoint est interrogé par le routeur frontend (`switch.router.js`) lors de chaque transition vers une page restreinte (`space: "hybrid"`, `space: "merchant"`, ou `space: "agent"`).

#### Exemple de Réponse 200 (Accès Autorisé)
```json
{
  "verified": true,
  "primary_role": "hybrid",
  "roles": ["merchant", "agent"],
  "allowed_spaces": ["merchant", "agent", "hybrid"],
  "merchant_id": "mch_84920194",
  "agent_code": "AGT-4092",
  "server_timestamp": 1788560120
}
```

#### Exemple de Réponse 403 (Rôle non autorisé ou Jeton expiré)
```json
{
  "verified": false,
  "error": "UNAUTHORIZED_ROLE_OR_EXPIRED_TOKEN",
  "message": "Session invalide ou expirée. Veuillez vous re-connecter à l'Espace Hybride."
}
```

---

### C. Endpoint 3 : Révocation de Session (`POST /api/v1/auth/revoke-session`)

#### URL & Méthode
- **URL :** `https://staging-api.switch.bj/api/v1/auth/revoke-session`
- **Méthode :** `POST`
- **Headers :** `Authorization: Bearer <access_token>`

#### Description
Détruit la session côté serveur, invalide le Refresh Token dans Supabase Staging et clôture les flux de caisse et guichet actifs.

#### Exemple de Réponse 200 (Révocation Effective)
```json
{
  "status": "revoked",
  "message": "La session hybride a été fermée et révoquée avec succès sur le serveur de staging."
}
```

---

## 3. APPLIQUABILITÉ DES POLITIQUES RLS SUPABASE ASSOCIÉES

Toutes les requêtes exécutées avec le jeton double rôle bénéficient des politiques RLS de Staging validées au Jalon 1 & 2 :
- **Table `ventes` / `produits` :** Filtrées par `app_metadata.merchant_id = "mch_84920194"`.
- **Table `opérations` / `float` :** Filtrées par `app_metadata.agent_code = "AGT-4092"`.
- **Accès Interdits (403) :** Tout jeton ne contenant qu'un rôle unique (`["merchant"]` ou `["agent"]`) est rejeté avec un code HTTP `403` lorsqu'il tente une opération croisée sur la route hybride.

---

## 4. CONFORMITÉ AUX RÈGLES DE MISSION
- **Environnement :** Staging exclusivement.
- **Production :** Aucune modification ni déploiement en production.
- **Gel Hybrid :** Application candidate Bêta privée uniquement (`bj.switchhybrid.beta`).
