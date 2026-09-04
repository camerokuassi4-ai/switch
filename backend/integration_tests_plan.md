# PLAN DE TESTS D'INTÉGRATION BACKEND ET SCRIPTS D'AUDIT SERVEUR

**Document :** Cahier de Recette Backend v1.0  
**Date :** 4 septembre 2026  
**Objectif :** Valider l'étanchéité des rôles, la sécurité RLS Supabase et l'invalidation des sessions sur le serveur de Staging.

---

## 1. SCÉNARIOS DE TEST D'INTÉGRATION

### Scénario 1 : Création de session Merchant & Vérification RLS
- **Étape 1 :** Appel `POST /api/v1/auth/merchant/session` avec identifiant IFU et PIN.
- **Résultat attendu :** Réception d'un JWT avec `app_metadata.role = "merchant"`.
- **Étape 2 :** Appel API `GET /api/v1/merchant/sales` avec le JWT.
- **Résultat attendu :** Succès 200 avec les données de caisse.
- **Étape 3 :** Appel API `GET /api/v1/agent/floats` avec le même JWT Marchand.
- **Résultat attendu :** **Refus 403 Forbidden (Violation RLS).**

### Scénario 2 : Création de session Agent Guichet & Vérification RLS
- **Étape 1 :** Appel `POST /api/v1/auth/agent/session` avec N° Compte Agent et PIN.
- **Résultat attendu :** Réception d'un JWT avec `app_metadata.role = "agent"`.
- **Étape 2 :** Appel API `GET /api/v1/agent/floats` avec le JWT.
- **Résultat attendu :** Succès 200 avec le solde float agence.
- **Étape 3 :** Appel API `GET /api/v1/merchant/sales` avec le même JWT Agent.
- **Résultat attendu :** **Refus 403 Forbidden (Violation RLS).**

### Scénario 3 : Création de session Hybride (Double Rôle)
- **Étape 1 :** Appel `POST /api/v1/auth/hybrid/session` avec les doubles identifiants.
- **Résultat attendu :** Réception d'un JWT avec `roles: ["merchant", "agent"]`.
- **Étape 2 :** Appels successifs `GET /api/v1/merchant/sales` ET `GET /api/v1/agent/floats`.
- **Résultat attendu :** **Succès 200 sur les deux endpoints.**

### Scénario 4 : Révocation de Session & Invalidation Token
- **Étape 1 :** Appel `POST /api/v1/auth/revoke-session`.
- **Étape 2 :** Tentative de réutilisation de l'ancien `access_token`.
- **Résultat attendu :** **Refus 401 Unauthorized.**

---

## 2. SCRIPT DE TEST REUTILISABLE (JEST / SUPERTEST)

```javascript
/**
 * tests/backend/hybrid_integration.test.js
 * Script d'intégration automatisé pour les sessions Backend Switch Bénin
 */
const request = require('supertest');
const API_URL = process.env.STAGING_API_URL || 'http://localhost:3000';

describe('Audit Backend & RLS Role Enforcement', () => {
  let merchantToken = '';
  let agentToken = '';
  let hybridToken = '';

  test('1. Session Merchant ne doit PAS accéder à l\'API Float Agent', async () => {
    const login = await request(API_URL)
      .post('/api/v1/auth/merchant/session')
      .send({ merchant_ifu: '1202619482019', merchant_pin: '4920' });
    
    expect(login.statusCode).toBe(200);
    merchantToken = login.body.access_token;

    const forbiddenAccess = await request(API_URL)
      .get('/api/v1/agent/floats')
      .set('Authorization', `Bearer ${merchantToken}`);

    expect(forbiddenAccess.statusCode).toBe(403);
  });

  test('2. Session Hybride doit accéder aux APIs Merchant ET Agent', async () => {
    const login = await request(API_URL)
      .post('/api/v1/auth/hybrid/session')
      .send({
        merchant_ifu: '1202619482019', merchant_pin: '4920',
        agent_account: '0197004092', agent_code: 'AGT-4092', agent_pin: '8492'
      });
    
    expect(login.statusCode).toBe(200);
    hybridToken = login.body.access_token;

    const posRes = await request(API_URL)
      .get('/api/v1/merchant/sales')
      .set('Authorization', `Bearer ${hybridToken}`);
    expect(posRes.statusCode).toBe(200);

    const floatRes = await request(API_URL)
      .get('/api/v1/agent/floats')
      .set('Authorization', `Bearer ${hybridToken}`);
    expect(floatRes.statusCode).toBe(200);
  });

  test('3. Révocation de session doit invalider le jeton immédiatement', async () => {
    const revoke = await request(API_URL)
      .post('/api/v1/auth/revoke-session')
      .set('Authorization', `Bearer ${hybridToken}`);
    
    expect(revoke.statusCode).toBe(200);

    const expiredCall = await request(API_URL)
      .get('/api/v1/auth/verify-role')
      .set('Authorization', `Bearer ${hybridToken}`);
    
    expect(expiredCall.statusCode).toBe(401);
  });
});
```
