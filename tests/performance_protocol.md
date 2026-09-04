# PROTOCOLE OFFICIEL DE MESURE DE PERFORMANCE MOBILE — SWITCH BÉNIN BETA

Ce document définit la procédure standard d'évaluation empirique des performances pour les 4 applications Android distinces (`User`, `Merchant`, `Agent`, `Hybrid`).

---

## 1. OUTILS ET PRÉ-REQUIS

- **Appareil de test :** Téléphone Android physique réel (Android 10+ recommandé).
- **Connexion ADB :** Débogage USB activé (`adb devices`).
- **Outils CLI :** `adb shell am start -W`, `adb logcat`, `adb shell dumpsys gfxinfo`.

---

## 2. MESURE DU TEMPS DE PREMIER DÉMARRAGE (COLD STARTUP)

### A. Packages cibles
- **User :** `bj.switchuser.beta` / Entry: `.MainActivity` $\rightarrow$ `accueil_splash_mis_jour`
- **Merchant :** `bj.switchmerchant.beta` / Entry: `.MainActivity` $\rightarrow$ `accueil_marchand`
- **Agent :** `bj.switchagent.beta` / Entry: `.MainActivity` $\rightarrow$ `connexion_agent`
- **Hybrid :** `bj.switchhybrid.beta` / Entry: `.MainActivity` $\rightarrow$ `accueil_hybride`

### B. Procédure d'exécution

Pour chaque APK, forcer l'arrêt puis lancer la commande de démarrage à froid :

```bash
# 1. Forcer l'arrêt du processus
adb shell am force-stop bj.switchuser.beta

# 2. Lancement mesuré avec rapport de temps ADB
adb shell am start -W -n bj.switchuser.beta/bj.switchuser.beta.MainActivity
```

### C. Métriques extraites
L'outil `am start -W` retourne trois valeurs en millisecondes :
- **`ThisTime` :** Temps de démarrage de la dernière activité (MainActivity).
- **`TotalTime` :** Temps total de création du processus et d'initialisation de la WebView Capacitor.
- **`WaitTime` :** Temps d'attente système global.

*Critère d'acceptation :* `TotalTime` < 1500 ms sur premier lancement froid ; `TotalTime` < 700 ms sur lancement chaud.

---

## 3. ERGONOMIE CLAVIER ET RÉACTIVITÉ SAISIE

### A. Scénarios de test
1. Saisie du numéro de téléphone et du code PIN dans [`connexion/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/connexion/code.html) et [`connexion_agent/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/connexion_agent/code.html).
2. Formulaires longs dans [`inscription_marchand/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/inscription_marchand/code.html) et [`inscription_agent_switch/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/inscription_agent_switch/code.html).

### B. Contrôle d'absence de zone noire (Black Bar Fix)
Exécuter la capture vidéo ADB lors de l'ouverture/fermeture du clavier virtuel :

```bash
# Enregistrement vidéo de la session de saisie (10 secondes)
adb shell screenrecord /sdcard/keyboard_test_user.mp4
adb pull /sdcard/keyboard_test_user.mp4 ./tests/keyboard_test_user.mp4
```

*Critère de conformité :* Le conteneur s'adapte sans `100dvh` glitch, le champ actif reste 100% visible au-dessus du clavier sans zone noire au sommet.

---

## 4. CAPTURE LOGCAT ET AUDIT DES BLOCAGES DE ROUTE

Ajuster le filtre logcat pour surveiller le routeur `switch.router.js` et le garde CAS B :

```bash
# Capture des logs de navigation et d'isolation de package
adb logcat -v time *:S Chromium:V Capacitor:V Console:V | grep -E "SWITCH_APP_PACKAGE|checkRouteAccess|SERVER_ROLE_VERIFICATION_UNAVAILABLE"
```

---

## 5. DUMPSYS GRAPHICS (JANK & FRAME DROPS)

Vérifier que le taux de rafraîchissement reste fluide (60 fps sans saut de frame) lors des animations de transition :

```bash
adb shell dumpsys gfxinfo bj.switchuser.beta framestats
```
