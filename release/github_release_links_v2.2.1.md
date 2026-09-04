# LIENS DE TÉLÉCHARGEMENT OFFICIELS — RELEASE GITHUB BÊTA v2.2.1

**Document :** Fiche de Release GitHub v2.2.1  
**Date :** 4 septembre 2026  
**Dépôt GitHub :** `camerokuassi4-ai/switch`  
**Tag de Release :** `v2.2.1` (Build 2210)  
**Canal :** Bêta Privée Restreinte (Aucune publication Play Store)

---

## 1. LIENS DE TÉLÉCHARGEMENT DIRECTS DES 4 APKS v2.2.1

Les 4 APKs de la suite Switch Bénin v2.2.1 ont été compilées, auditées et publiées sur la Release GitHub officielle :

| Application Mobile | Package Android ID | Nom du Binaire APK | Taille | Lien de Téléchargement Direct GitHub |
| :--- | :--- | :--- | :---: | :--- |
| **1. Switch Utilisateur** | `bj.switchuser.beta` | `switch-beta-user-v2.2.1.apk` | 41.56 MB | [Télécharger User v2.2.1](https://github.com/camerokuassi4-ai/switch/releases/download/v2.2.1/switch-beta-user-v2.2.1.apk) |
| **2. Switch Marchand Pro** | `bj.switchmerchant.beta` | `switch-beta-merchant-v2.2.1.apk` | 34.65 MB | [Télécharger Merchant v2.2.1](https://github.com/camerokuassi4-ai/switch/releases/download/v2.2.1/switch-beta-merchant-v2.2.1.apk) |
| **3. Switch Agent Guichet** | `bj.switchagent.beta` | `switch-beta-agent-v2.2.1.apk` | 33.57 MB | [Télécharger Agent v2.2.1](https://github.com/camerokuassi4-ai/switch/releases/download/v2.2.1/switch-beta-agent-v2.2.1.apk) |
| **4. Switch Hybride** | `bj.switchhybrid.beta` | `switch-beta-hybrid-v2.2.1.apk` | 35.93 MB | [Télécharger Hybrid v2.2.1](https://github.com/camerokuassi4-ai/switch/releases/download/v2.2.1/switch-beta-hybrid-v2.2.1.apk) |

---

## 2. NOTES DE RELEASE ASSOCIÉES (v2.2.1)

- **Harmonisation globale de la suite :** VersionCode `2210` / VersionName `2.2.1` appliqué sur les 4 rôles.
- **Switch Hybride (`switch-beta-hybrid-v2.2.1.apk`) :** Intégration de l'écran d'accueil bi-ton [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html), gestionnaire de session JWT double rôle (`roles: ["merchant", "agent"]`), et isolation du bundle (227 écrans, exclusion stricte de `choix_type_compte`).
- **Sécurité et Gardes RLS :** Validation backend Staging avec réponse 403 stricte sur les accès croisés non autorisés.
- **Règle d'Or :** Strictement aucun déploiement sur les canaux publics (Play Store). Réservé à la qualification bêta restreinte.

---

## 3. STATUT EXACT DE FIN DE MISSION
```text
GITHUB_RELEASE_V2.2.1_PUSHEE_AUCUNE_PUBLICATION_PLAY_STORE
```
