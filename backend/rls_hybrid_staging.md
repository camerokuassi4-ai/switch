# RAPPORT DE DÉPLOIEMENT ET DE VALIDATION RLS DOUBLE RÔLE HYBRIDE (ENVIRONNEMENT STAGING)

**Composant :** Supabase PostgreSQL / Policies RLS Hybride (2-en-1)  
**Environnement :** Staging (`staging-db.switch.bj`)  
**Date d'exécution :** 4 septembre 2026  
**Statut :** **DÉPLOYÉ & VALIDÉ (Pass Rate 100%)**

---

## 1. POLITIQUES RLS DOUBLE RÔLE DÉPLOYÉES EN STAGING

Les politiques RLS pour l'application **Switch Hybride** permettent à un jeton d'authentification valide disposant de la double qualification d'accéder à la fois aux fonctions Caisse POS et Guichet Cash, tout en rejetant les requêtes si l'une des deux habilitations est absente.

```sql
-- 1. Politique RLS double rôle pour les opérations de caisse POS Hybride
CREATE POLICY "Hybrid POS Access Policy"
ON merchant_sales
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'primary_role') = 'hybrid'
  AND (auth.jwt() -> 'app_metadata' -> 'roles') ?& ARRAY['merchant', 'agent']
  AND merchant_id = (auth.jwt() -> 'app_metadata' ->> 'merchant_id')
);

-- 2. Politique RLS double rôle pour la trésorerie Float Agence Hybride
CREATE POLICY "Hybrid Float Access Policy"
ON agent_floats
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'primary_role') = 'hybrid'
  AND (auth.jwt() -> 'app_metadata' -> 'roles') ?& ARRAY['merchant', 'agent']
  AND agent_id = (auth.jwt() -> 'app_metadata' ->> 'agent_id')
);
```

---

## 2. RÉSULTATS DES TESTS DE VALIDATION DOUBLE RÔLE EN STAGING

| Test ID | Jeton JWT d'essai | Endpoint / Action demandée | Code HTTP Attendu | Code HTTP Obtenu | Statut |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **HYB-01** | Hybrid Dual Token (`primary_role: "hybrid"`, `roles: ["merchant", "agent"]`) | `GET /api/v1/merchant/sales` (Encaissement POS) | `200 OK` | `200 OK` | **PASS** |
| **HYB-02** | Hybrid Dual Token (`primary_role: "hybrid"`, `roles: ["merchant", "agent"]`) | `GET /api/v1/agent/floats` (Trésorerie Guichet) | `200 OK` | `200 OK` | **PASS** |
| **HYB-03** | Single Merchant Token (`role: "merchant"`) | `GET /api/v1/hybrid/mixed-dashboard` | `403 Forbidden` | `403 Forbidden` | **PASS** |
| **HYB-04** | Single Agent Token (`role: "agent"`) | `GET /api/v1/hybrid/mixed-dashboard` | `403 Forbidden` | `403 Forbidden` | **PASS** |
| **HYB-05** | Fraudulent Token (`roles: ["merchant"]` sans `agent`) | `GET /api/v1/agent/floats` via route Hybride | `403 Forbidden` | `403 Forbidden` | **PASS** |
