# Manuel de Support, Dictionnaire d'Erreurs & Procédures d'Incidents

## 1. Dictionnaire des Codes d'Erreurs Métier (En Français Clair)

| Code d'Erreur | Message Affiché à l'Utilisateur | Action Recommandée pour le Support |
| :--- | :--- | :--- |
| `ERR_AUTH_PIN_INVALID` | « Code PIN incorrect. Veuillez réessayer. » | Vérifier les tentatives restantes (max 5 avant blocage temporaire). |
| `ERR_KYC_LIMIT_EXCEEDED` | « Vous avez atteint le plafond de votre compte. Passez au niveau KYC supérieur. » | Inviter le client à soumettre sa pièce d'identité (Niveau 2). |
| `ERR_SBEE_COUNTER_NOT_FOUND` | « Numéro de compteur SBEE introuvable. Veuillez vérifier votre saisie. » | Contrôler le format du numéro de police / compteur. |
| `ERR_NETWORK_TIMEOUT_24H` | « Paiement en cours de confirmation auprès de la SBEE. Délai maximum : 24h. » | Rassurer le client : si aucune confirmation sous 24h, remboursement automatique intégral. |
| `ERR_INSUFFICIENT_FLOAT` | « Solde de caisse insuffisant pour cette opération. » | L'agent doit effectuer une demande de réapprovisionnement Float. |

## 2. Guide d'Assistance & Gestion des Litiges
1. **Paiement Facture Non Reçu Immédiatement** :
   - Vérifier le statut dans la table `bill_payment_transactions`.
   - Si `processing` $\rightarrow$ provision séquestre verrouillée sur le compte UBA, le client ne subit aucune perte.
2. **Double Débit Signalé** :
   - Vérifier la clé d'idempotence (`idempotency_key`). Grâce au verrouillage strict, aucun double débit ne peut être commité.
3. **Escalade d'Incident Critique** :
   - Contacter l'administrateur système si le statut `BLOCKED` est levé sur le worker.
