# PLAN DE SURVEILLANCE ET DE TÉLÉMÉTRIE — BÊTA PRIVÉE HYBRID v2.2.0

**Application :** Switch Hybride (`bj.switchhybrid.beta`)  
**Période d'observation :** Bêta Privée 14 Jours  
**Auteur :** Antigravity AI — Lead Site Reliability & Operations Engineer  
**Date :** 4 septembre 2026

---

## 1. INDICATEURS CLÉS DE PERFORMANCE (KPIs SERVEUR & CLIENT)

L'utilisation de l'APK v2.2.0 par la cohorte restreinte de testeurs sera suivie via les 4 métriques fondamentales suivantes :

| Métrique de Surveillance | Seuil Nominal | Seuil d'Alerte (War Room) | Action Corrective / Escalade |
| :--- | :---: | :---: | :--- |
| **Taux de Succès des Sessions JWT** | **>= 99.5%** | < 97.0% | Investigation API Gateway / Supabase Auth logs. |
| **Taux d'Erreurs HTTP 403 / 401** | **< 0.5%** | > 2.0% | Analyse des tentatives d'accès invalides ou re-connexion. |
| **Latence Moyenne API Staging** | **< 150 ms** | > 350 ms | Optimisation des index PostgreSQL Staging. |
| **Taux de Crash APK (Crashlytics)** | **0.00%** | > 0.10% | Activation immédiate du plan de Rollback v2.2.0. |

---

## 2. CANAUX DE REMONTÉE ET FEEDBACK TESTEURS

1. **Canal Telegram Privé "War Room Hybride v2.2.0" :**
   Canal direct réunissant les 20 commerçants/agents bêta-testeurs et l'équipe technique pour remonter les anomalies en temps réel.
2. **Collecte Automatique des Logs Client :**
   En cas d'erreur de réseau ou de rejet 403, les logs anonymisés de l'application Capacitor sont enregistrés localement puis soumis lors du rétablissement réseau.
3. **Formulaire de Feedback Hebdomadaire :**
   Évaluation de la réactivité UI, de la lisibilité du clavier et de la pertinence du tableau de bord unifié.

---

## 3. CALENDRIER DE REVUE DE QUALIFICATION PUBLIQUE

- **J+1 à J+3 :** Surveillance renforcée des ouvertures de session et du débit des opérations POS/Guichet.
- **J+7 :** Rapport d'étape de mi-parcours et revue des logs d'erreurs HTTP 403.
- **J+14 :** Bilan d'homologation final soumis au Chef de Projet pour décider de l'ouverture de la publication publique sur le Play Store.
