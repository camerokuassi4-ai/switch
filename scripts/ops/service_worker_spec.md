# Spécification Technique & Déploiement Service Windows du Worker PostgreSQL

## 1. Objectifs
- Exécuter le worker `worker_auto_loop.js` sous forme de service d'arrière-plan Windows (Windows Service) résilient.
- Redémarrage automatique immédiat en cas de défaillance matérielle ou crash système.
- Isolation complète par rapport à la session utilisateur interactive.

## 2. Déploiement via NSSM (Non-Sucking Service Manager)
```powershell
# 1. Installation du service
nssm install SwitchPostgresWorker "C:\Program Files\nodejs\node.exe" "C:\Users\camer\OneDrive\Documents\Nouveau dossier\stitch_switch_fintech_app_benin\scripts\worker_auto_loop.js"

# 2. Configuration du répertoire de travail
nssm set SwitchPostgresWorker AppDirectory "C:\Users\camer\OneDrive\Documents\Nouveau dossier\stitch_switch_fintech_app_benin"

# 3. Paramétrage des journaux de sortie et d'erreur
nssm set SwitchPostgresWorker AppStdout "C:\Users\camer\OneDrive\Documents\Nouveau dossier\stitch_switch_fintech_app_benin\logs\worker_service_stdout.log"
nssm set SwitchPostgresWorker AppStderr "C:\Users\camer\OneDrive\Documents\Nouveau dossier\stitch_switch_fintech_app_benin\logs\worker_service_stderr.log"

# 4. Politique de redémarrage automatique en cas de crash
nssm set SwitchPostgresWorker AppRestartDelay 5000
nssm set SwitchPostgresWorker AppThrottle 1500

# 5. Démarrage du service
nssm start SwitchPostgresWorker
```

## 3. Matrice de Récupération (Recovery Actions)
* **Crash 1er niveau** : Redémarrage automatique dans les 5 secondes.
* **Crash 2ème niveau** : Reconnexion PostgreSQL avec backoff exponentiel (1s, 2s, 4s, 8s max).
* **Crash persistant (> 3 échecs)** : Notification d'urgence Ops et bascule en mode `BLOCKED` pour éviter toute altération de données.
