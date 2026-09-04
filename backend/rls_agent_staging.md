# RAPPORT DE DÉPLOIEMENT ET DE VALIDATION RLS AGENT GUICHET (ENVIRONNEMENT STAGING)

**Composant :** Supabase PostgreSQL / Policies RLS Agent Guichet  
**Environnement :** Staging (`staging-db.switch.bj`)  
**Date d'exécution :** 4 septembre 2026  
**Statut :** **DÉPLOYÉ & VALIDÉ (Pass Rate 100%)**

---

## 1. POLITIQUES RLS DÉPLOYÉES EN STAGING

Les politiques RLS ci-dessous ont été appliquées en Staging sur les 4 tables du périmètre Agent Guichet : `agent_operations`, `agent_floats`, `agent_commissions`, `agent_cashiers`.

```sql
-- 1. Activation RLS sur les opérations de dépôt/retrait espèces
ALTER TABLE agent_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent Operations Isolation Policy"
ON agent_operations
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('agent', 'hybrid')
  AND agent_id = (auth.jwt() -> 'app_metadata' ->> 'agent_id')
);

-- 2. Activation RLS sur la réserve float de trésorerie
ALTER TABLE agent_floats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent Floats Isolation Policy"
ON agent_floats
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('agent', 'hybrid')
  AND agent_id = (auth.jwt() -> 'app_metadata' ->> 'agent_id')
);

-- 3. Activation RLS sur les commissions acquises
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent Commissions Isolation Policy"
ON agent_commissions
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('agent', 'hybrid')
  AND agent_id = (auth.jwt() -> 'app_metadata' ->> 'agent_id')
);

-- 4. Activation RLS sur les sous-caissiers de guichet
ALTER TABLE agent_cashiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent Cashiers Isolation Policy"
ON agent_cashiers
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('agent', 'hybrid')
  AND agent_id = (auth.jwt() -> 'app_metadata' ->> 'agent_id')
);
```

---

## 2. RÉSULTATS DES TESTS DE VALIDATION EN STAGING

| Test ID | Jeton JWT d'essai | Table / Endpoint cible | Code HTTP Attendu | Code HTTP Obtenu | Statut |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **AGT-01** | Agent Valid (`role: "agent"`, `agent_id: "AGT-4092"`) | `GET /api/v1/agent/floats` | `200 OK` | `200 OK` | **PASS** |
| **AGT-02** | User Standard (`role: "user"`) | `GET /api/v1/agent/floats` | `403 Forbidden` | `403 Forbidden` | **PASS** |
| **AGT-03** | Merchant Pro (`role: "merchant"`) | `GET /api/v1/agent/floats` | `403 Forbidden` | `403 Forbidden` | **PASS** |
| **AGT-04** | Agent A (`agent_id: "AGT-4092"`) tente de consulter le float de l'Agent B (`AGT-9999`) | `GET /agent_floats?agent_id=eq.AGT-9999` | `200 OK` (0 row / RLS Filter) | `0 Row` | **PASS** |
