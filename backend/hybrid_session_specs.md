# SPÉCIFICATIONS TECHNIQUES DES SESSIONS DOUBLE RÔLE (HYBRID)

**Document :** Spécifications API Backend v1.0  
**Date :** 4 septembre 2026  
**Composants concernés :** API Gateway, Auth Microservice, Supabase JWT Claims & App Hybrid

---

## 1. MODÈLE DE SESSION DOUBLE RÔLE (HYBRID DUAL-ROLE MODEL)

L'application **Switch Hybride** s'adresse aux établissements exerçant simultanément une activité de commerce (POS) et de guichet de services financiers (Dépôt/Retrait Cash).

### A. Structure des Claims JWT Supabase
Pour qu'une session soit reconnue comme Hybride valide par le serveur, le jeton `access_token` JWT émis par Supabase doit impérativement contenir les données suivantes dans `app_metadata` :

```json
{
  "sub": "usr_948201482901",
  "email": "point.hybride.cotonou@switch.bj",
  "role": "authenticated",
  "app_metadata": {
    "provider": "email",
    "primary_role": "hybrid",
    "roles": ["merchant", "agent"],
    "merchant_id": "mch_84920194",
    "merchant_ifu": "1202619482019",
    "agent_code": "AGT-4092",
    "agent_account": "0197004092",
    "verified_by_server": true,
    "issued_at": 1788560000
  }
}
```

---

## 2. SPÉCIFICATIONS DES ENDPOINTS API SERVEUR

### A. Endpoint 1 : Création de Session Hybride (`POST /api/v1/auth/hybrid/session`)

- **Description :** Valide simultanément les identifiants Marchand (N° IFU + PIN Caisse) et Agent (N° Compte Agent + Code Distributeur + PIN Guichet).
- **Request Body :**
  ```json
  {
    "merchant_ifu": "1202619482019",
    "merchant_pin": "4920",
    "agent_account": "0197004092",
    "agent_code": "AGT-4092",
    "agent_pin": "8492",
    "device_fingerprint": "dev_android_948201"
  }
  ```
- **Response 200 (Succès) :**
  ```json
  {
    "status": "success",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "ref_9482019482019...",
    "expires_in": 3600,
    "user": {
      "id": "usr_948201482901",
      "primary_role": "hybrid",
      "roles": ["merchant", "agent"],
      "merchant_name": "Boutique & Guichet La Plage",
      "agent_name": "Kiosque Switch Agréé #4092"
    }
  }
  ```
- **Response 403 (Refus Habilitation) :**
  ```json
  {
    "status": "error",
    "code": "HYBRID_QUALIFICATION_FAILED",
    "message": "L'établissement ne dispose pas de la double habilitation validée par la BCEAO."
  }
  ```

---

### B. Endpoint 2 : Vérification en Direct des Rôles (`GET /api/v1/auth/verify-role`)

- **Description :** Interrogé par le routeur `switch.router.js` pour valider l'accès aux interfaces restreintes.
- **Headers :** `Authorization: Bearer <access_token>`
- **Response 200 :**
  ```json
  {
    "verified": true,
    "primary_role": "hybrid",
    "allowed_spaces": ["merchant", "agent", "hybrid"],
    "server_timestamp": 1788560120
  }
  ```

---

### C. Endpoint 3 : Révocation & Déconnexion (`POST /api/v1/auth/revoke-session`)

- **Description :** Invalide le Refresh Token et détruit la session côté serveur.
- **Headers :** `Authorization: Bearer <access_token>`
- **Response 200 :**
  ```json
  {
    "status": "revoked",
    "message": "La session hybride a été fermée et révoquée sur le serveur."
  }
  ```
