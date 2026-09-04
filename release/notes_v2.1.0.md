# NOTES DE VERSION — SWITCH BÉNIN BETA v2.1.0 🇧🇯

**Date de préparation :** 4 septembre 2026  
**Type de version :** Migration Majeure d'Architecture — APKs Distinctes & Isolation par Rôle  
**Statut global :** Préparation de Release Contrôlée (En attente d'approbation finale)

---

## 1. TABLEAU DE VERSIONING DES APPLICATIONS

| Application | Package Android | Version | Entrée d'accueil | Bundle Size | Cold Start | Qualification |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| **Switch Utilisateur** | `bj.switchuser.beta` | **v2.1.0** | [`accueil_splash_mis_jour`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_splash_mis_jour/code.html) | 41.56 MB | 1110 ms | **QUALIFIÉE (Release Candidate)** |
| **Switch Marchand Pro** | `bj.switchmerchant.beta` | **v2.1.0** | [`accueil_marchand`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_marchand/code.html) | **23.01 MB** | **606 ms** | **QUALIFIÉE (Release Candidate)** |
| **Switch Agent Guichet** | `bj.switchagent.beta` | **v2.1.0** | [`connexion_agent`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/connexion_agent/code.html) | **25.79 MB** | **695 ms** | **QUALIFIÉE (Release Candidate)** |
| **Switch Hybride** | `bj.switchhybrid.beta` | **v2.1.0** | [`accueil_hybride`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html) | 32.14 MB | 875 ms | **GELÉE (Bêta Interne Uniquement)** |

---

## 2. NOUVEAUTÉS ET CHANGEMENTS MAJEURS (CHANGELOG v2.1.0)

### A. Architecture 4 APKs Physiquement Isolées
- Abandon du modèle monolithique (126 écrans embarqués dans chaque application).
- Chaque APK n'embarque désormais **que les écrans et assets de son rôle métier** :
  - **Marchand :** Allégé de **-65%** (122 fichiers dans `www/`).
  - **Agent :** Allégé de **-58%** (146 fichiers dans `www/`).
  - **Hybride :** Allégé de **-42%** (205 fichiers dans `www/`).
  - **User :** 284 fichiers (74 écrans d'usage client).

### B. Écrans d'Accueil & Entrées Conformes
- Suppression des ouvertures directes sur les formulaires d'inscription ou les tableaux de bord.
- Chaque APK s'ouvre sur un écran d'accueil dédié présentant les deux choix non négociables :
  1. **"Commencer / Créer un compte"**
  2. **"Se connecter"**
- Création de l'écran d'accueil dédié [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html) pour l'application Hybride.

### C. Sécurité & Gardes de Navigation Multi-Niveaux
- **Niveau 1 (Isolation Physique) :** Exclusions strictes des répertoires inter-rôles lors de la préparation Capacitor (ex. `choix_type_compte` exclu de Merchant, Agent et Hybrid).
- **Niveau 2 (App Guard) :** Interception par `checkAppPackageAccess()` des tentatives de navigation directe.
- **Niveau 3 (Garde CAS B) :** Blocage neutre `SERVER_ROLE_VERIFICATION_UNAVAILABLE` interdisant l'ouverture d'un dashboard pro sans session serveur validée.

### D. Correctif Ergonomie Clavier (Black Bar Fix)
- Correction du conteneur dynamique pour éliminer toute zone noire lors de l'ouverture du clavier virtuel sur Android 13+.

---

## 3. RAPPORTS DE QUALIFICATION ET MESURES EMPIRIQUES

Les tests d'intégration ont été formellement validés et documentés dans les répertoires de test :
- [Protocole de Mesure de Performance](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/tests/performance_protocol.md)
- [Résultats Cold Start & Clavier](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/tests/performance_results.md)
- [Résultats des Gardes de Navigation](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/tests/navigation_guards_results.md)
- [Synthèse et Qualification des APKs](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/tests/release_readiness.md)
