# AVIS OFFICIEL DE GEL DE PUBLICATION — SWITCH HYBRIDE (HYBRID APK v2.1.0)

**Application :** Switch Beta — Hybride  
**Package Android :** `bj.switchhybrid.beta`  
**Binaire :** `switch-beta-hybrid-v2.1.0.apk`  
**Statut actuel :** **GELÉ / BÊTA INTERNE STRICTEMENT RESTREINTE**

---

## 1. MOTIFS DU GEL DE PUBLICATION

L'application **Switch Hybride** réunit sur un seul terminal deux rôles professionnels réglementés par la BCEAO :
1. Le rôle **Marchand Pro** (Encaissement de ventes d'articles sur terminal POS).
2. Le rôle **Agent Guichet** (Traitement des opérations de dépôts/retraits cash et gestion de float).

Bien que l'écran d'accueil dédié [`accueil_hybride/code.html`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/accueil_hybride/code.html) ait été créé et que l'isolation du bundle (205 fichiers) soit effective, **toute publication commerciale ou distribution publique est formellement gelée**.

**Raison technique et de conformité :**  
Le tableau de bord mixte [`tableau_de_bord_agent_mixte`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/tableau_de_bord_agent_mixte/code.html) manipule des flux de caisse et de trésorerie float. Son déverrouillage exige la vérification en ligne par le serveur d'une double habilitation réelle d'un établissement agréé. Aucune session UI locale ne peut autoriser cette double casquette.

---

## 2. CONDITIONS STRICTES DE DÉBLOCAGE (UNBLOCKING CRITERIA)

La levée du gel et la qualification en version candidate pour Switch Hybride nécessitent la satisfaction cumulative des 4 critères suivants :

1. **Vérification Serveur Double Rôle :** Implémentation backend (Supabase / API RLS) d'une méthode d'authentification conjointe validant simultanément le numéro IFU marchand et le matricule d'agent distributeur.
2. **Validation des Gardes Hybrides :** Succès du contrôle CAS B interdisant toute bascule en mode guichet sans jeton serveur d'agence valide.
3. **Qualification des Tests de Navigation 2-en-1 :** Réalisation sans erreur de 50 cycles complets d'encaissement POS suivis immédiatement d'une opération de dépôt d'espèces.
4. **Maintien des Performances :** Confirmation du temps de premier démarrage `TotalTime` < 1500 ms sur terminal physique (actuellement mesuré à 875 ms).

---

## 3. CONSIGNES AUX ÉQUIPES

- **Ne pas inclure l'APK Hybride** dans le centre de téléchargement public ou les cartes de présentation grand public.
- Distribuer la version hybride uniquement via le canal de tests internes fermés aux testeurs habilités.
