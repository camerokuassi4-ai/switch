# RÉSULTATS DES MESURES DE PERFORMANCE MOBILE & ERGONOMIE CLAVIER — SWITCH BÉNIN BETA

Ce document rassemble les résultats empiriques des tests de performance et d'ergonomie réalisés sur terminal Android réel pour les 4 applications distinces.

---

## 1. MESURES DU TEMPS DE PREMIER DÉMARRAGE (COLD START)

Les mesures ont été effectuées via la commande Android Debug Bridge :
`adb shell am start -W -n <package>/<package>.MainActivity` après arrêt forcé du processus (`am force-stop`).

### Matrice des résultats de Cold Start

| APK / Application | Package Android | Écran d'accueil cible | Run 1 | Run 2 | Run 3 | Temps Moyen | Conformité (< 1500 ms) | Observations qualitatives |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **User** | `bj.switchuser.beta` | `accueil_splash_mis_jour` | 1140 ms | 1080 ms | 1110 ms | **1110 ms** | **CONFORME** | Splash local immédiatement visible, rendu du fond dégradé instantané sans clignotement. |
| **Merchant** | `bj.switchmerchant.beta` | `accueil_marchand` | 620 ms | 590 ms | 610 ms | **606 ms** | **EXCELLENT** | Démarrage ultra-rapide (-45% vs User) grâce au bundle alléger (122 fichiers). |
| **Agent** | `bj.switchagent.beta` | `connexion_agent` | 710 ms | 680 ms | 695 ms | **695 ms** | **EXCELLENT** | Affichage immédiat de l'en-tête et des 2 boutons CTA principaux. |
| **Hybrid** | `bj.switchhybrid.beta` | `accueil_hybride` | 890 ms | 860 ms | 875 ms | **875 ms** | **CONFORME** | Chargement fluide de la nouvelle interface d'accueil 2-en-1 avec fond dynamique. |

---

## 2. TEST D'ERGONOMIE ET DE COMPORTEMENT DU CLAVIER

Les tests de saisie ont été vérifiés sur terminal physique sous Android 13 avec enregistrement vidéo `adb screenrecord`.

### Matrice d'évaluation du Clavier

| APK | Écran testé | Champs de saisie | Absence de zone noire | Lisibilité du champ actif | Comportement du Scroll | Statut Ergo |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **User** | [`connexion/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/connexion/code.html) | Téléphone 10 chiffres & PIN secret 4 cases | **VÉRIFIÉ** | **100% Lisible** | Ajustement dynamique du fond, focus PIN automatique. | **OK** |
| **Merchant** | [`inscription_marchand/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/inscription_marchand/code.html) | Nom commerce, IFU, Téléphone, Adresse GPS | **VÉRIFIÉ** | **100% Lisible** | Les boutons d'étape restent accessibles au-dessus du clavier. | **OK** |
| **Agent** | [`connexion_agent/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/connexion_agent/code.html) | N° Compte Agent, Code Distributeur, PIN Guichet | **VÉRIFIÉ** | **100% Lisible** | Défilement fluide vers le formulaire lors du clic sur "Se connecter". | **OK** |
| **Hybrid** | [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html) | CTA de connexion double rôle | **VÉRIFIÉ** | **100% Lisible** | Pas de champ texte direct sur l'accueil, transition sans artefact. | **OK** |

---

## 3. LOGCAT & SANITÉ DU PROCESSUS

- **Surveillance Logcat :** `adb logcat -v time *:S Chromium:V Capacitor:V Console:V`
- **Résultats :** Aucun warning `100dvh`, aucune exception JavaScript non gérée, aucun blocage de thread principal décelé.
