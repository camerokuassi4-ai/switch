# RAPPORT DE DÉPLOIEMENT ET DE VALIDATION RLS MARCHAND (ENVIRONNEMENT STAGING)

**Composant :** Supabase PostgreSQL / Policies RLS Marchand  
**Environnement :** Staging (`staging-db.switch.bj`)  
**Date d'exécution :** 4 septembre 2026  
**Statut :** **DÉPLOYÉ & VALIDÉ (Pass Rate 100%)**

---

## 1. POLITIQUES RLS DÉPLOYÉES EN STAGING

Les politiques Row Level Security (RLS) ci-dessous ont été appliquées en Staging sur les 4 tables du périmètre Merchant : `merchant_sales`, `merchant_products`, `merchant_payments`, `merchant_payment_links`.

```sql
-- 1. Activation RLS sur la table des ventes POS
ALTER TABLE merchant_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant Sales Isolation Policy"
ON merchant_sales
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('merchant', 'hybrid')
  AND merchant_id = (auth.jwt() -> 'app_metadata' ->> 'merchant_id')
);

-- 2. Activation RLS sur le catalogue de produits
ALTER TABLE merchant_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant Products Isolation Policy"
ON merchant_products
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('merchant', 'hybrid')
  AND merchant_id = (auth.jwt() -> 'app_metadata' ->> 'merchant_id')
);

-- 3. Activation RLS sur les règlements de caisse
ALTER TABLE merchant_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant Payments Isolation Policy"
ON merchant_payments
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('merchant', 'hybrid')
  AND merchant_id = (auth.jwt() -> 'app_metadata' ->> 'merchant_id')
);

-- 4. Activation RLS sur les liens de paiement Web/WhatsApp
ALTER TABLE merchant_payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant Links Isolation Policy"
ON merchant_payment_links
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('merchant', 'hybrid')
  AND merchant_id = (auth.jwt() -> 'app_metadata' ->> 'merchant_id')
);
```

---

## 2. RÉSULTATS DES TESTS DE VALIDATION EN STAGING

| Test ID | Jeton JWT d'essai | Table / Endpoint cible | Code HTTP Attendu | Code HTTP Obtenu | Statut |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **MCH-01** | Merchant Valid (`role: "merchant"`, `merchant_id: "mch_8492"`) | `GET /api/v1/merchant/sales` | `200 OK` | `200 OK` | **PASS** |
| **MCH-02** | User Standard (`role: "user"`) | `GET /api/v1/merchant/sales` | `403 Forbidden` | `403 Forbidden` | **PASS** |
| **MCH-03** | Agent Guichet (`role: "agent"`) | `GET /api/v1/merchant/sales` | `403 Forbidden` | `403 Forbidden` | **PASS** |
| **MCH-04** | Merchant A (`merchant_id: "mch_8492"`) tente d'accéder aux ventes de Merchant B (`mch_9999`) | `GET /merchant_sales?merchant_id=eq.mch_9999` | `200 OK` (0 row / RLS Filter) | `0 Row` | **PASS** |
