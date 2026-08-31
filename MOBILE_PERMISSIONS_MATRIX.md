# Matrice des Permissions & Fonctionnalités Natives — Switch Bénin Mobile

Inventaire exhaustif des fonctionnalités matérielles et logicielles mobiles avec leur statut d'implémentation :

| Fonctionnalité | Rôle / Utilisation | Permission Android | Permission iOS (`Info.plist`) | Classification |
| :--- | :--- | :--- | :--- | :---: |
| **Scanner QR Code** | Paiement démo, identification compte | `android.permission.CAMERA` | `NSCameraUsageDescription` | **NATIVE_REQUIRED** |
| **Galerie Photo** | Upload photo produit marchand | `READ_MEDIA_IMAGES` | `NSPhotoLibraryUsageDescription` | **NATIVE_REQUIRED** |
| **Notifications Push** | Alertes compte, nouveaux messages | `POST_NOTIFICATIONS` | APNs / Notification Center | **PLUGIN_REQUIRED** |
| **Stockage Local** | Session utilisateur, cache catalogue | Stockage interne App | Sandboxed Container | **WEB_SUFFICIENT** |
| **Bouton Retour Android** | Navigation entre les 126 écrans | Géré par Capacitor App Listener | N/A | **NATIVE_REQUIRED** |
| **Partage Système** | Partage lien reçu ou produit | Standard Android Intent | `UIActivityViewController` | **WEB_SUFFICIENT** |
| **Biométrie (FaceID / Fingerprint)** | Déverrouillage rapide | `USE_BIOMETRIC` | `NSFaceIDUsageDescription` | **NOT_IMPLEMENTED** *(Prévu Phase Post-Bêta)* |
| **Géolocalisation** | Recherche d'agents kiosques proches | `ACCESS_FINE_LOCATION` | `NSLocationWhenInUseUsageDescription` | **NOT_IMPLEMENTED** |
| **Paiements Réels** | Transactions financières | Interdit | Interdit | **BLOCKED_BY_BETA** |
