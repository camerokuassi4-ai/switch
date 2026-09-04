# CHECKLIST DE PUBLICATION — SWITCH AGENT GUICHET (AGENT APK v2.1.0)

**Application :** Switch Beta — Agent  
**Package Android :** `bj.switchagent.beta`  
**Binaire cible :** `switch-beta-agent-v2.1.0.apk`  
**Point d'entrée :** [`connexion_agent/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/connexion_agent/code.html)

---

## 1. PRÉREQUIS & AUDIT QUALITÉ

- [x] **Accueil Conforme :** Présence des 2 CTA majeurs d'égales visibilités ("Se connecter à mon Guichet" vs "Devenir Agent").
- [x] **Exclusion physique :** `choix_type_compte` formellement **exclu** du bundle Web (146 fichiers dans `www/`).
- [x] **Redirection des Retours :** `previousStep()` redirige vers `connexion_agent` sans fuite.
- [x] **Performance Cold Start :** Temps moyen 695 ms (< 1500 ms).
- [x] **Ergonomie Clavier :** Saisie N° Compte Agent + Code Distributeur + PIN 100% lisibles sans bande noire.
- [x] **Garde CAS B :** Dashboard trésorerie agent bloqué sans rôle serveur d'agence.

---

## 2. VALIDATION DES BINAIRES ET CANAUX

- **Nom du fichier APK :** `switch-beta-agent-v2.1.0.apk` (Alias: `switch_agent_beta.apk`)
- **Clef de signature :** Android Key (Keystore certifié Switch Agent Distributeur).
- **Canal de diffusion :** Portail privé d'enrôlement des agents agréés Switch Bénin.
- **URL publique de téléchargement :** `https://camerokuassi4-ai.github.io/switch/download/agent/agent-beta.apk`

---

## 3. PROCÉDURE DE ROLLBACK D'URGENCE

En cas d'anomalie critique sur la gestion du float cash :
1. Bloquer l'ouverture de nouvelles sessions guichet via le flag d'urgence du routeur.
2. Basculer les kiosques concernés sur l'interface de secours Web Guichet v2.0.8.
