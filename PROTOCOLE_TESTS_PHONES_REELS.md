# Protocole de Tests sur Téléphones Réels — Switch Bêta Réelle 🇧🇯

**Guide de Validation Terrain sur Équipements Android Réels & Réseaux Mobiles Béninois**

---

## 1. Matrice des Téléphones Android de Test

Afin de garantir une expérience fluide sur 100% du parc mobile au Bénin, les 4 applications Android (`User`, `Merchant`, `Agent`, `Hybrid`) sont soumises au protocole de test sur 3 gammes d'appareils :

| Gamme d'Appareil | Modèles de Référence | Version Android | Spécifications Clés | Objectif de Performance |
| :--- | :--- | :--- | :--- | :--- |
| **Entrée de Gamme** | Tecno Pop 7 / Infinix Smart 7 / Samsung A03 | Android 9 - 11 | RAM 2 Go, Écran HD+ | Lancement app < 2.0s, empreinte mémoire < 45 Mo |
| **Milieu de Gamme** | Samsung Galaxy A34 / Xiaomi Redmi Note 12 | Android 12 - 13 | RAM 6 Go, Écran 90Hz | Fluidité animations 60 FPS, scan QR < 500ms |
| **Haut de Gamme** | Samsung Galaxy S23 / Google Pixel 8 | Android 14+ | RAM 8+ Go, Biométrie | Réponse UI immédiate < 100ms |

---

## 2. Matrice de Tests Réseaux Mobiles (Bénin 🇧🇯)

Les tests sont exécutés sous les 3 opérateurs télécoms nationaux (**MTN Bénin**, **Moov Africa Bénin**, **Celtiis Bénin**) :

1. **Réseau 4G LTE High-Speed** (Cotonou Centre, Calavi, Porto-Novo) : Validation de la latence standard API (< 200ms).
2. **Réseau 3G / H+** (Zones périurbaines & marchés) : Validation de la légèreté des payloads JSON.
3. **Zone à Couverture Faible / Micro-Coupure** : Simulation de perte de paquet réseau pendant l'étape d'envoi du PIN.
4. **Basculement Réseau Dynamique (Wi-Fi <-> 4G)** : Vérification du maintien de la session utilisateur sans déconnexion intempestive.

---

## 3. Scénarios de Test : Cas Nominaux & Cas Dégradés

### 3.1. Scénarios Nominaux (Parcours Standard)
- **Scénario N1 — Dépôt d'Espèces Guichet (Cash-In)** : L'agent saisit le numéro du client, valide avec son PIN agent et crédite le solde client.
- **Scénario N2 — Transfert P2P Instantané** : Envoi de solde 0% de frais entre 2 utilisateurs.
- **Scénario N3 — Encaissement Marchand QR** : Le marchand présente le QR Standee, le client scanne et règle son achat.
- **Scénario N4 — Recharge SBEE Électricité** : Achat de crédit d'électricité, génération du code STS 20 chiffres et impression/partage du reçu.

### 3.2. Scénarios Dégradés & Robustesse (Edge Cases)
- **Scénario D1 — Perte de Réseau en Cours d'Opération** : Coupe du réseau mobile lors de l'appui sur "Valider". L'application affiche un statut "Vérification en cours..." sans ré-imputer le solde à la reconnexion.
- **Scénario D2 — Expiration du QR Code (5 min)** : Tentative de paiement sur un QR dynamique expiré. Le système rejette la demande avec le message "QR Code expiré, veuillez régénérer".
- **Scénario D3 — Double Clic & Double Scan Rapid** : Appui simultané ou répété sur le bouton de paiement. L'idempotence bloque le deuxième appel et retourne la référence originale.
- **Scénario D4 — Solde ou Float Insuffisant** : Tentative de retrait ou de transfert dépassant le solde disponible. Message d'erreur clair avec option de rechargement.

---

## 4. Canaux de Collecte des Bugs & Feedbacks Bêta

Les testeurs bêta et utilisateurs pilotes disposent de 4 canaux structurés de remontee d'anomalies :

1. **Bouton Support In-App** : Accessible dans le menu latéral de chaque application.
2. **Canal WhatsApp Dédier Bêta** : `https://wa.me/2290190751786` (Réponse immédiate de l'équipe technique).
3. **Formulaire de Feedback Formel** : Lien direct depuis la page de téléchargement `/download/*`.
4. **Email d'Assistance Directe** : `support-beta@switch.bj`.

---

© 2026 Switch Bénin S.A.S — Équipe Assurance Qualité & Mobile QA.
