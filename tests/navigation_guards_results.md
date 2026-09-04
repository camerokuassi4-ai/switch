# RAPPORT DE VALIDATION DES GARDES DE NAVIGATION EN CONDITIONS RÉELLES — SWITCH BÉNIN BETA

Ce document détaille les tests d'étanchéité inter-APKs et de validation des gardes de sécurité exécutés sur les 4 applications.

---

## 1. MATRICE DE TEST D'ISOLATION ET ÉTANCHÉITÉ PAR BUNDLE

| APK Source | Route interne tentée | Type d'accès | Mécanisme de garde déclenché | Comportement observé en condition réelle | Statut |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Merchant** | `tableau_de_bord_mis_jour/code.html` | Cross-Role | **1. Isolation physique** (`apps/merchant/www`)<br/>**2. App Guard** (`checkAppPackageAccess`) | Blocage physique (Fichier non présent dans le bundle Web Marchand). Écran neutre d'erreur d'application. | **OK (BLOCAGE PROPRE)** |
| **Merchant** | `choix_type_compte/code.html` | Cross-Role | **Isolation physique** (`apps/merchant/www`) | Fichier non embarqué dans le bundle. Redirection propre vers `accueil_marchand`. | **OK (EXCLU)** |
| **User** | `tableau_de_bord_marchand/code.html` | Cross-Role | **Garde CAS B** (`checkRouteAccess`) | Détection du périmètre Marchand. Affiche l'écran neutre *"Espace Marchand Réservé"* avec bouton de retour à l'espace User. | **OK (BLOCAGE PROPRE)** |
| **User** | `tableau_de_bord_agent/code.html` | Cross-Role | **Garde CAS B** (`checkRouteAccess`) | Détection du périmètre Agent. Affiche l'écran neutre *"Espace Guichet Agent Réservé"*. | **OK (BLOCAGE PROPRE)** |
| **Agent** | `tableau_de_bord_mis_jour/code.html` | Cross-Role | **Isolation physique & App Guard** | Blocage physique. Impossible d'ouvrir le dashboard Utilisateur depuis l'APK Agent. | **OK (BLOCAGE PROPRE)** |
| **Agent** | `choix_type_compte/code.html` | Cross-Role | **Isolation physique** (`apps/agent/www`) | Fichier non embarqué. `previousStep()` renvoie à `connexion_agent`. | **OK (EXCLU)** |
| **Hybrid** | `tableau_de_bord_agent_mixte/code.html` (sans session) | Accès direct | **Garde CAS B** (`SERVER_ROLE_VERIFICATION_UNAVAILABLE`) | Refus systématique. La modification de `localStorage` est ignorée. Redirection vers `accueil_hybride`. | **OK (BLOCAGE PROPRE)** |

---

## 2. VÉRIFICATION DE SUPPRESSION DES LIENS RÉSIDUELS INTER-RÔLES

1. **[`accueil_marchand/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_marchand/code.html) :**
   - *Test :* Clic sur l'en-tête et les boutons d'action.
   - *Résultat :* Tous les liens mènent exclusivement vers `inscription_marchand`, `connexion`, ou `tableau_de_bord_marchand`. Aucun lien ne pointe vers `tableau_de_bord_mis_jour`.

2. **[`inscription_marchand/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/inscription_marchand/code.html) :**
   - *Test :* Clic sur le bouton Retour (Étape 1).
   - *Résultat :* Redirection directe vers `accueil_marchand`. Aucun appel à `choix_type_compte`.

3. **[`inscription_agent_switch/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/inscription_agent_switch/code.html) :**
   - *Test :* Clic sur le bouton Retour (Étape 1).
   - *Résultat :* Redirection directe vers `connexion_agent`. Aucun appel à `choix_type_compte`.

4. **[`connexion_agent/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/connexion_agent/code.html) :**
   - *Test :* Clic sur "Devenir Agent" ou "Se connecter".
   - *Résultat :* Navigation 100% interne à l'univers Agent.
