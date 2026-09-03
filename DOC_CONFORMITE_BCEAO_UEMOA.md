# Dossier de Sécurité & Conformité Réglementaire BCEAO / UEMOA — Switch Bénin 🇧🇯

**Document Officiel de Cadrage — Version Bêta Réelle 2.1.0**  
**Établissement de Monnaie Électronique (EME) / Prestataire de Services de Paiement (PSP)**

---

## 1. Contexte Réglementaire & Cadre Juridique UEMOA

L'infrastructure applicative et l'écosystème mobile de **Switch Bénin S.A.S** sont conçus en stricte conformité avec les directives bancaires de l'Union Économique et Monétaire Ouest-Africaine (UEMOA) et la Banque Centrale des États de l'Afrique de l'Ouest (BCEAO) :

1. **Instruction N° 01/2010/RB** du 26 juillet 2010 relative à l'émission de monnaie électronique et aux Établissements de Monnaie Électronique dans l'UMOA.
2. **Loi Uniforme relative à la lutte contre le blanchiment de capitaux et le financement du terrorisme (LCB/FT)** dans les États membres de l'UMOA.
3. **Règlement N° 15/2002/CM/UEMOA** relatif aux systèmes de paiement dans les États membres de l'UEMOA.
4. **Loi N° 2017-20** portant code du numérique en République du Bénin (protection des données à caractère personnel - APDP Bénin).

---

## 2. Matrice des Niveaux KYC & Plafonds UEMOA

Switch Bénin applique une politique d'identification graduée (KYC - Know Your Customer) synchronisée avec l'ANIP (Agence Nationale d'Identification des Personnes du Bénin) :

| Niveau KYC | Justificatifs Requis | Solde Maximal Autorisé | Plafond Mensuel de Transactions | Fonctionnalités Débloquées |
| :--- | :--- | :--- | :--- | :--- |
| **Niveau 1 (Basique)** | Numéro de téléphone + Nom & Prénom | 300 000 FCFA | 300 000 FCFA | Dépôt, Transfert P2P, Recharge GSM |
| **Niveau 2 (Vérifié)** | NPI ANIP + Pièce d'identité officielle | 2 000 000 FCFA | 2 000 000 FCFA | Paiement factures SBEE/SONEB, QR Marchand, Vault |
| **Niveau 3 (Pro / Agent)** | IFU Entreprise + Registre du Commerce (RCCM) | Illimité (Sous réserve de convention) | Illimité | Caisse POS, Float Agent, Retrait de commissions |

---

## 3. Architecture de Sécurité Applicative & Mobile

### 3.1. Authentification & Verrouillage de Session
- **Code PIN Sécurisé** : Hachage PBKDF2/SHA-256 avec sel dynamique unique par utilisateur. Aucun PIN en clair n'est stocké en local ou sur serveur.
- **Politique Anti-Brute Force** : Après **5 tentatives consécutives de PIN erroné**, le compte est verrouillé temporairement pendant 15 minutes, avec alerte SMS de sécurité.
- **Expiration de Session** : Déconnexion automatique après **5 minutes d'inactivité au premier plan**.
- **Isolation par Rôle (RBAC)** : Les jetons de session contiennent la matrice de rôle (`user`, `merchant`, `agent`, `hybrid`). Un utilisateur standard tentant d'accéder aux API Guichetier/Agent est immédiatement bloqué avec enregistrement d'incident.

### 3.2. Protection des Données Financières & Chiffrement
- **Chiffrement Transport & Stockage** : Flux HTTPS/TLS 1.3 avec HSTS (HTTP Strict Transport Security) et chiffrement AES-256 des données sensibles au repos.
- **Principe du Moindre Privilège** : Masquage automatique des numéros de téléphone et des identifiants bancaires (ex: `+229 97 ** ** 56`).
- **Prévention Fuite de Données Mobile** : Désactivation des captures d'écran sur les écrans PIN et masquage de l'application dans le sélecteur de tâches Android.

---

## 4. Procédures de Gestion des Incidents Financiers & Fraude

### 4.1. Procédure en Cas de Perte ou Vol de Smartphone
1. **Blocage Immédiat** : L'utilisateur contacte le support d'urgence au `+229 01 90 75 17 86` ou envoie un mot-clé `BLOCK` par SMS.
2. **Révocation de Session** : Le serveur révoque instantanément tous les jetons de session actifs associés à l'account_id.
3. **Réactivation Récurée** : Réactivation du compte uniquement sur présentation en agence avec la pièce d'identité originale.

### 4.2. Gestion des Contestations & Transactions Suspectes
1. **Idempotence & Anti-Double Clic** : Chaque transaction génère une référence unique `tx_ref` au client. Un second envoi avec la même référence retourne le résultat mis en cache sans réitérer le débit.
2. **Période de Gèle Conservatoire** : En cas de détection d'anomalie LCB/FT (volume atypique), le solde concerné est gelé pendant 48h pour investigation de l'Officier de Conformité (Compliance Officer).
3. **Remboursement & Réconciliation** : Procédure de régularisation automatique pour les transactions interrompues par rupture réseau.

---

## 5. Composition du Dossier d'Agrément BCEAO

Pour l'obtention de la licence définitive d'Établissement de Monnaie Électronique au Bénin, le dossier technique comprend :

1. **Capital Social & Garanties** : Fonds propres minimums conformes au barème BCEAO (déposés dans une banque de la place).
2. **Gouvernance & Organigramme** : Direction Générale, Responsable Conformité & LCB/FT, Responsable Sécurité des Systèmes d'Information (RSSI).
3. **Système de Cantonnements des Fonds** : Compte de cantonnement bancaire ouvert auprès d'une institution partenaire de l'UEMOA garantissant la parité 1:1 de la monnaie électronique émise.
4. **Manuel des Procédures Opérationnelles** : Procédures de contrôle interne, audit annuel, plan de continuité d'activité (PCA) et plan de reprise (PRA).

---

© 2026 Switch Bénin S.A.S — Direction de la Conformité & Sécurité Financière.
