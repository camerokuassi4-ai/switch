# RAPPORT DE CONSOLIDATION ET DE TESTS INTERNES — SWITCH HYBRIDE (v2.1.1)

**Application :** Switch Beta — Hybride (`bj.switchhybrid.beta`)  
**Fichier Binaire :** `switch-beta-hybrid-v2.1.0.apk` / `apps/hybrid/www`  
**Statut de diffusion :** **BÊTA INTERNE FERMÉE — GEL DE PUBLICATION PRIVÉE & PUBLIQUE MAINTENU**

---

## 1. RÉSULTATS DES TESTS INTERNES DE CONSOLIDATION

### A. Point d'Entrée & Redirection (`accueil_hybride`)
- **Vérification :** L'application s'ouvre sur [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html).
- **Statut :** **OK.** Aucun accès direct au dashboard [`tableau_de_bord_agent_mixte`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/tableau_de_bord_agent_mixte/code.html) sans session.

### B. Bascule de Contexte (POS Caisse $\leftrightarrow$ Guichet Cash)
- **Vérification :** La barre de navigation hybride bascule correctement entre les onglets Caisse (`caisse_marchand_pos`) et Guichet (`services_factures_hybride`).
- **Statut :** **OK en mode simulation UI.**

### C. Gardes de Navigation & Isolation Physique
- **Vérification :** Bundle allégé à 205 fichiers. `choix_type_compte` et écrans Particulier non-liés sont formellement **exclus**.
- **Statut :** **OK (Conforme à l'isolation physique).**

### D. Performance Cold Start
- **Mesure :** 875 ms sur terminal Android physique (< 1500 ms).
- **Statut :** **OK.**

---

## 2. ÉCARTS RESTANTS AVANT DÉBLOCAGE (RAPPEL DES CRITÈRES `hybrid_hold.md`)

| Critère de déblocage | Statut actuel v2.1.1 | Action requise avant publication |
| :--- | :---: | :--- |
| **1. Entrée Accueil Dédier** | **CONFORME** | [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html) fonctionnel et intégré. |
| **2. Isolation du Bundle** | **CONFORME** | 205 fichiers, `choix_type_compte` exclu. |
| **3. Contrôle Serveur Double Rôle** | **EN ATTENTE (Bloquant)** | Nécessite la méthode d'authentification API backend RLS validant simultanément le registre IFU et le code d'agent distributeur. |
| **4. Qualification 50 Cycles** | **EN COURS** | Tests d'endurance internes au laboratoire R&D. |

---

## 3. CONCLUSION INTERNE

L'application **Switch Hybride v2.1.1** progresse de manière satisfaisante en interne. Son écran d'accueil et son cloisonnement sont validés. **La publication publique et la diffusion en canal privé restent gelées** jusqu'à la livraison du module serveur backend double rôle.
