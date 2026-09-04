# RAPPORT DE MISE À JOUR VERSION v2.2.0 → v2.2.1 — SWITCH HYBRIDE

**Fichier :** `release/hybrid_version_update_v2.2.1.md`  
**Date :** 4 septembre 2026  
**Auteur :** Antigravity AI — Lead Release & Packaging Architect  
**Statut :** **MISE À JOUR EFFECTUÉE EN CONFIGURATION LOCALE**

---

## 1. DÉTAILS DE LA MISE À JOUR DE VERSION HYBRID

L'application **Switch Hybride** a été mise à jour de la version `v2.2.0` vers la version `v2.2.1` afin d'aligner l'ensemble de la suite mobile des 4 rôles (`User`, `Merchant`, `Agent`, `Hybrid`) sur le même cycle d'itération et d'audit qualitatif.

### Paramètres de la Version Mise à Jour :
- **Package ID :** `bj.switchhybrid.beta`
- **Version Name :** `2.2.1`
- **Version Code :** `2210` (incrémenté depuis 2200)
- **Nom du Binaire Produit :** `switch-beta-hybrid-v2.2.1.apk`
- **Alias de Distribution :** `switch_hybrid_beta.apk`

---

## 2. MODIFICATIONS APPORTÉES AUX FICHIERS DE CONFIGURATION ET DESCRIPTEURS

1. **Incrémentation des Descripteurs de Version :**
   - Mise à jour des clés `versionCode: 2210` et `versionName: "2.2.1"` dans les configurations Capacitor et Android Gradle (`android/app/build.gradle` et `variables.gradle`).
2. **Notes de Version & Changelog :**
   - Remplacement / Consolidation de `release/hybrid_changelog_v2.2.0.md` par [`release/changelog_v2.2.1.md`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/release/changelog_v2.2.1.md).
3. **Maintien de l'Isolation du Bundle :**
   - Inscription stricte des 227 écrans hybrides dans `build_android_apks.js` avec conservation de l'exclusion physique de `choix_type_compte`.
   - Conservation du point d'entrée unique sur [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html).

---

## 3. OBJECTIFS DE LA MISE À JOUR v2.2.1
- **Alignement de la Suite :** Assurer une synchronisation stricte des versions entre les 4 APKs candidates.
- **Préparation des Tests Locaux :** Permettre l'exécution du protocole d'audit et de qualification sur matériel réel pour les 4 rôles avant tout arbitrage de release.
- **Zéro Déploiement Public :** Maintien du gel de publication publique (bêta privée restreinte).
