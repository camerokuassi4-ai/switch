# AUDIT DES GARDES DE SÉCURITÉ SERVEUR ET ANALYSE DES ÉCARTS

**Composant :** Infrastructure Backend & Protection RLS / API  
**Date d'audit :** 4 septembre 2026  
**Objectif :** Recenser les gardes existantes, identifier les vulnérabilités liées au stockage client et spécifier le modèle d'habilitation serveur strict.

---

## 1. ÉTAT DES LIEUX DES GARDES ACTUELLES (FRONTEND VS BACKEND)

### A. Garde Client `assets/switch.router.js` (App Guard & CAS B)
- **Fonctionnalité :** Contrôle local lors des transitions SPA.
- **Principe :** 
  1. `checkAppPackageAccess()` valide que l'écran demandé est autorisé dans l'APK courante (`USER_SCREENS`, `MERCHANT_SCREENS`, `AGENT_SCREENS`, `HYBRID_SCREENS`).
  2. `checkRouteAccess()` refuse tout accès aux espaces `merchant`, `agent` et `hybrid` si la vérification serveur réelle n'est pas établie (`SERVER_ROLE_VERIFICATION_UNAVAILABLE`).
- **Analyse de sécurité :** C'est une excellente protection **UX / visuelle** qui empêche l'affichage accidentel des interfaces d'un autre rôle. Cependant, **toute sécurité sur le client WebView est contournable par un attaquant averti** (ex. modification de la mémoire, inspection DOM).

### B. Garde Backend Supabase / RLS (Row Level Security)
- **Fonctionnalité :** Protection des données au niveau de la base de données PostgreSQL.
- **État actuel :** Les tables financières (`balances`, `transactions`, `merchant_payouts`, `agent_floats`) exigent un jeton Supabase JWT signé.
- **Écart identifié :** Les rôles `merchant` et `agent` doivent disposer de sous-revendications (claims JWT) spécifiques enregistrées dans `auth.users.raw_app_meta_data`, et non d'un simple drapeau local dans `localStorage`.

---

## 2. SYNTHÈSE DES ÉCARTS DE SÉCURITÉ À CORRIGER

| Périmètre | Mécanisme actuel | Écart de sécurité identifié | Correctif requis côté Backend |
| :--- | :--- | :--- | :--- |
| **Merchant** | `switch_merchant_session_active` dans `localStorage` | Clé localement écrivable via la console WebView JS. | Vérification du jeton JWT contenant `app_metadata.role = "merchant"` et la clé IFU entreprise sur chaque requête API POS. |
| **Agent** | `switch_agent_session_active` dans `localStorage` | Clé localement écrivable via la console WebView JS. | Vérification du jeton JWT contenant `app_metadata.role = "agent"` et le matricule agence sur chaque opération cash. |
| **Hybrid** | `switch_is_hybrid` dans `localStorage` | Absolument insuffisant pour accorder l'accès simultané au POS et au Float. | Validation par endpoint d'une **session double habilitation** combinant `role: "hybrid"` avec signature cryptographique. |
| **Révocation** | `sessionStorage.clear()` | Ne détruit pas la session côté serveur/API. | Endpoint `POST /api/v1/auth/revoke-session` pour invalider le Refresh Token serveur. |

---

## 3. ARCHITECTURE DE SÉCURITÉ SERVEUR CIBLE

1. **Règle Zéro Confiance Client :** Le backend Supabase ne se fie à aucun en-tête ou variable provenant du client sans validation cryptographique du jeton `Authorization: Bearer <JWT>`.
2. **Politiques RLS Multi-Tenants :**
   ```sql
   -- Exemple de politique RLS stricte pour l'espace Marchand
   CREATE POLICY "Marchand POS Access Policy"
   ON merchant_transactions
   FOR ALL
   TO authenticated
   USING (
     (auth.jwt() -> 'app_metadata' ->> 'role') IN ('merchant', 'hybrid')
     AND merchant_id = (auth.jwt() -> 'app_metadata' ->> 'merchant_id')
   );
   ```
