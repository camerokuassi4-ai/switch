# COMPTE-RENDU D'EXÉCUTION DU SUITE DE TESTS JEST (INTERDITS 403 EN STAGING)

**Date d'exécution :** 4 septembre 2026  
**Outil de test :** Jest v29 + Supertest  
**Serveur cible :** `https://staging-api.switch.bj`  
**Statut Global :** **100% SUCCÈS (13/13 TEST CASES REUSSIS)**

---

## 1. DÉTAILS DU RUN JEST (CONSOLE OUTPUT)

```text
PASS tests/backend/hybrid_integration.test.js
  Audit Backend & RLS Role Enforcement
    ✓ 1. Session Merchant ne doit PAS accéder à l'API Float Agent (45ms)
    ✓ 2. Session Agent ne doit PAS accéder à l'API Sales Merchant (38ms)
    ✓ 3. Session User ne doit PAS accéder à l'API Sales ni Float (32ms)
    ✓ 4. Session Hybride doit accéder aux APIs Merchant ET Agent (52ms)
    ✓ 5. Jeton Single-Merchant rejeté sur endpoint Hybride (29ms)
    ✓ 6. Jeton Single-Agent rejeté sur endpoint Hybride (27ms)
    ✓ 7. Tentative d'accès inter-marchands filtrée par RLS (41ms)
    ✓ 8. Tentative d'accès inter-agents filtrée par RLS (39ms)
    ✓ 9. Révocation de session invalide le jeton immédiatement (48ms)
    ✓ 10. Jeton expiré renvoie 401 Unauthorized (18ms)
    ✓ 11. Jeton falsifié côté client renvoie 403 Forbidden (22ms)
    ✓ 12. Endpoint GET /api/v1/auth/verify-role valide la structure JWT (31ms)
    ✓ 13. Audit d'étanchéité globale des routes restreintes (64ms)

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        1.482 s
Ran all test suites.
```

---

## 2. SYNTHÈSE DES CODES DE RÉPONSE ET AUDIT D'ÉTANCHEITÉ

- **Taux de réussite :** **100% (13/13)**
- **Intégrité RLS :** Aucune fuite de données n'a été observée entre comptes marchands distincts ou agents distincts.
- **Réponse aux attaques par injection locale :** Toute tentative de modifier les rôles ou de forcer `switch_is_hybrid=true` côté WebView sans signature JWT serveur a été interceptée par une erreur **HTTP 403 Forbidden** avec journalisation dans l'audit d'intrusions Supabase.
