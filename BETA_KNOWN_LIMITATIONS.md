# Limitations Connues — Bêta Publique Switch Bénin v2.1.0-RC1

Le présent document consigne l'ensemble des fonctionnalités fonctionnant en mode restreint ou démonstration au sein de la Bêta Publique.

---

## 1. Tableau des Limitations par Domaine

| Domaine Fonctionnel | Fonctionnalité Concernée | Comportement en Bêta Publique | Libellé Officiel | Code HTTP Reçu |
| :--- | :--- | :--- | :---: | :---: |
| **Paiements & Débits** | Paiement Facture SBEE | Module suspendu en attente du terme des 24h canary. | `SBEE_DISABLED` | `403 FEATURE_NOT_AVAILABLE` |
| **Paiements & Débits** | Carte Bancaire Visa | Écrans de saisie PAN/CVV en démonstration sans passerelle. | `VISA_DISABLED` | `403 FEATURE_NOT_AVAILABLE` |
| **Paiements & Débits** | Paiement par QR Code | Résolution et calcul du panier actifs ; paiement réel bloqué. | `QR_PAYMENT_DISABLED` | `403 FEATURE_NOT_AVAILABLE` |
| **Transferts & P2P** | Transfert d'argent réel | Envoi de fonds réel désactivé ; solde fictif de test. | `REAL_MONEY_DISABLED` | `403 FEATURE_NOT_AVAILABLE` |
| **Opérations Guichet** | Dépôts d'espèces agent | Simulation d'approvisionnement en mode bac à sable. | `REAL_DEPOSIT_DISABLED` (`DEMO_MODE`) | `200 OK (Simulé)` |
| **Opérations Guichet** | Retraits d'espèces agent | Simulation de retrait en mode bac à sable sans cash réel. | `REAL_WITHDRAWAL_DISABLED` (`DEMO_MODE`) | `200 OK (Simulé)` |
| **Payouts Marchand** | Virement vers banque/GSM | Recettes de démonstration non transférables vers l'extérieur. | `PAYOUTS_DISABLED` | `403 FEATURE_NOT_AVAILABLE` |
| **Crédit & Investissement** | Micro-crédit instantané | Simulateur de calcul d'échéance sans octroi de fonds réel. | `PASS_WITH_KNOWN_LIMITATION` (`UI_ONLY`) | N/A |
| **Crédit & Investissement** | Bons du Trésor | Simulateur de rendement sans souscription financière. | `PASS_WITH_KNOWN_LIMITATION` (`UI_ONLY`) | N/A |

---

## 2. Notification Utilisateur & Bandeau Bêta

* **Bannière d'Avertissement** : Tous les écrans transactionnels affichent la mention légale :  
  *« Mode Bêta Publique — Les transactions financières sont désactivées. Aucune somme réelle n'est débitée. »*
* **Comptabilité Staging** : Toutes les données d'articles, de messagerie et de QR codes sont isolées dans le stockage persistant [`scratch/preprod_storage.json`](file:///c:/Users/camer/OneDrive/Documents/Nouveau%20dossier/stitch_switch_fintech_app_benin/scratch/preprod_storage.json).
