# DOCUMENTATION DU RACCORDEMENT FRONTEND HYBRID AUX SESSIONS JWT (STAGING)

**Fichier :** `frontend/hybrid_jwt_integration.md`  
**Date :** 4 septembre 2026  
**Environnement :** Staging (APK Candidate `bj.switchhybrid.beta`)

---

## 1. RACCORDEMENT DE L'ÉCRAN D'ACCUEIL `accueil_hybride/code.html`

L'écran `accueil_hybride/code.html` constitue le point d'entrée unique de l'APK **Switch Hybride**.

### A. Flux d'Authentification Double Rôle
1. L'utilisateur clique sur **« Se connecter à mon Point Hybride »**.
2. Une modal d'authentification double rôle s'ouvre, sollicitant les identifiants combinés :
   - Identifiant Marchand (N° IFU) + PIN Caisse
   - Code Agent Distributeur + PIN Guichet
3. La fonction `submitHybridSession()` envoie une requête AJAX à l'endpoint Staging :
   `POST /api/v1/auth/hybrid/session`
4. En cas de réponse 200 OK :
   - Le jeton `access_token` JWT est stocké de manière sécurisée (SessionStorage encodé / Mémoire volatile Capacitor).
   - Le drapeau de rôle `switch_active_role = "hybrid"` et les métadonnées sont initialisés.
   - Redirection immédiate vers le Dashboard Hybride (`tableau_de_bord_agent_mixte/code.html`).
5. En cas de réponse 403 Forbidden :
   - Un message d'erreur s'affiche : *"Double habilitation Marchand & Agent requise"*.
   - Aucun jeton n'est enregistré.

---

## 2. MODIFICATIONS DANS LES ÉCRANS HYBRIDES

Toutes les requêtes API émises par les 12 écrans de l'APK Hybride incluent obligatoirement l'en-tête d'autorisation Bearer JWT :

```javascript
// Dynamic Header Injection pour les requêtes Hybrides
async function fetchHybridApi(endpoint, options = {}) {
  const token = sessionStorage.getItem('switch_hybrid_jwt');
  if (!token) {
    window.switchNavigate('../accueil_hybride/code.html');
    return null;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  const response = await fetch(endpoint, { ...options, headers });

  // Interception stricte des erreurs 403 / 401
  if (response.status === 403 || response.status === 401) {
    sessionStorage.removeItem('switch_hybrid_jwt');
    localStorage.removeItem('switch_is_hybrid');
    alert('Session Hybride révoquée ou invalide. Redirection vers l\'accueil.');
    window.switchNavigate('../accueil_hybride/code.html');
    return null;
  }

  return response.json();
}
```

### Liste des Écrans Synchronisés :
1. [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html) — Connexion & Validation de session.
2. [`tableau_de_bord_agent_mixte/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/tableau_de_bord_agent_mixte/code.html) — Synthèse Caisse POS & Guichet Cash.
3. [`services_factures_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/services_factures_hybride/code.html) — Guichet Kiosque SBEE/SONEB.
4. [`cloture_de_caisse_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/cloture_de_caisse_hybride/code.html) — Clôture combinée Fin de Journée.
5. [`param_tres_et_profil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/param_tres_et_profil_hybride/code.html) — Profil Établissement Agregé.

---

## 3. INTÉGRATION AVEC LE ROUTEUR FRONTEND (`assets/switch.router.js`)

Le routeur SPA central vérifie le jeton JWT lors des transitions de page :

1. **Garde d'Application (Layer 1) :** Vérifie que l'écran demandé possède `allowedApps: ["hybrid"]` (ou partagé).
2. **Garde CAS B (Layer 2) :**
   - Si `space === "hybrid"`, le routeur lance une vérification de jeton auprès de `GET /api/v1/auth/verify-role`.
   - Si la vérification échoue, l'écran d'accès restreint `renderAccessDeniedScreen()` est affiché sans chargement de données sensibles.

---

## 4. GESTION DE DÉCONNEXION ET RÉVOCATION

Un clic sur **« Déconnexion »** ou sur **« Clôturer la Session Hybride »** exécte :
1. `POST /api/v1/auth/revoke-session` (notification au serveur Staging).
2. Destruction des jetons locaux (`sessionStorage.removeItem('switch_hybrid_jwt')`).
3. Redirection propre vers `accueil_hybride/code.html`.
