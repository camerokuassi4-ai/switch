# CHANGELOG OFFICIEL — VERSION v2.1.1 🇧🇯

**Date de version :** 4 septembre 2026  
**Type de release :** Correctifs & Améliorations Ergonomiques v2.1.1  
**Statut :** Bêta Privée Restreinte (En attente d'approbation)

---

## 1. DÉTAILS DES CORRECTIONS (CHANGESET)

### A. APK Utilisateur (`bj.switchuser.beta`)
- **[FIX-01] Rappel Plafond BCEAO :** Ajout d'une pilule d'information dynamique sur [`confirmation_de_l_op_ration_code/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/confirmation_de_l_op_ration_code/code.html) rappelant le plafond légal de transfert de **2 000 000 FCFA/jour**.

### B. APK Marchand Pro (`bj.switchmerchant.beta`)
- **[FIX-02] Terminal POS Ticket thermal :** Préparation du connecteur d'impression Bluetooth ESC/POS sur [`caisse_marchand_pos/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/caisse_marchand_pos/code.html).

### C. APK Agent Guichet (`bj.switchagent.beta`)
- **[FIX-03] Trésorerie Float Indicator :** Ajout du badge d'état en direct de la réserve float de trésorerie sur l'en-tête de [`connexion_agent/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/connexion_agent/code.html).

### D. APK Hybride (`bj.switchhybrid.beta`)
- **[FIX-04] Consolidation Interne :** Validation de la bascule de vue POS / Guichet sur [`tableau_de_bord_agent_mixte`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/tableau_de_bord_agent_mixte/code.html). Gel de publication maintenu.

---

## 2. RE-PACKAGING ET SYNCHRONISATION CAPACITOR

Le script de build local `node scripts/build_android_apks.js --sync-only` a été ré-exécuté pour propager tous les correctifs v2.1.1 dans les 4 projets Capacitor.
