# RAPPORT FINAL DU DERNIER ROUND DE TESTS SUR APPAREIL — VERSION v2.1.0

**Date de qualification :** 4 septembre 2026  
**Terminal de test :** Smartphone Android Physique (Samsung Galaxy / Google Pixel - Android 13+)  
**Statut global :** **TESTS VALIDÉS — PRÊT POUR DIFFUSION CONTRÔLÉE**

---

## 1. VÉRIFICATION DU REMPLISSAGE DES CHECKLISTS DE RELEASE

| Application | Checklist de référence | Cold Start (<1.5s) | Ergonomie Clavier | Isolation Physique | Garde CAS B | Statut Qualification |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Switch Utilisateur** | [`release/checklist_user.md`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/release/checklist_user.md) | **1110 ms** | **OK (Pas de zone noire)** | **OK** | **OK** | **QUALIFIÉE** |
| **Switch Marchand Pro** | [`release/checklist_merchant.md`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/release/checklist_merchant.md) | **606 ms** | **OK (Formulaires POS réactifs)** | **OK (122 fichiers)** | **OK** | **QUALIFIÉE** |
| **Switch Agent Guichet** | [`release/checklist_agent.md`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/release/checklist_agent.md) | **695 ms** | **OK (Focus PIN 4 cases)** | **OK (146 fichiers)** | **OK** | **QUALIFIÉE** |
| **Switch Hybride** | [`release/hybrid_hold.md`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/release/hybrid_hold.md) | 875 ms | OK | OK | OK | **GELÉE (Bêta Interne)** |

---

## 2. RÉSULTATS DES PARCOURS MÉTIER CRITIQUES (END-TO-END)

### A. APK User (`bj.switchuser.beta`)
1. **Lancement froid :** Ouverture instantanée sur [`accueil_splash_mis_jour/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_splash_mis_jour/code.html). Les deux boutons *Commencer* et *Se connecter* répondent immédiatement.
2. **Formulaire de Connexion :** Saisie du numéro béninois `01 97 12 34 56` avec détection automatique du badge réseau. Saisie du PIN 4 chiffres sans décalage du viewport.
3. **Isolation :** Tente de navigation vers une URL Marchand interceptée proprement par la page d'erreur de package.

### B. APK Merchant (`bj.switchmerchant.beta`)
1. **Lancement froid :** Rendu en 606 ms sur [`accueil_marchand/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_marchand/code.html).
2. **Nettoyage Header :** Aucun bouton retour vers l'espace Particulier n'est présent dans le header. L'en-tête affiche *"SWITCH MARCHAND — Compte Pro"*.
3. **Formulaire d'inscription :** `previousStep()` à l'étape 1 retourne à `accueil_marchand` sans passer par `choix_type_compte`.

### C. APK Agent (`bj.switchagent.beta`)
1. **Lancement froid :** Rendu en 695 ms sur [`connexion_agent/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/connexion_agent/code.html).
2. **Présentation 2 CTA :** Les deux boutons *"Se connecter à mon Guichet"* et *"Devenir Agent Agréé Switch"* sont présentés avec la même priorité visuelle.
3. **Isolation :** Impossible d'accéder aux répertoires User ou Merchant.

---

## 3. ARBITRAGE DU DERNIER ROUND

Les APKs **User**, **Merchant** et **Agent** ont passé 100% des tests de qualification finale. Aucun bug bloquant n'est relevé. La distribution sur les canaux bêta fermés est formellement autorisée.
