# =============================================================================
# SCRIPT POWERSHELL SÉCURISÉ : PREFLIGHT PRODUCTION & RESTAURATION ISOLÉE
# =============================================================================

$ErrorActionPreference = "Stop"

# 1. Vérification des variables d'environnement PRODUCTION
$prodVars = @("PROD_HOST", "PROD_USER", "PROD_DB", "PROD_DB_PASSWORD")
foreach ($var in $prodVars) {
    $val = [Environment]::GetEnvironmentVariable($var)
    if ([string]::IsNullOrWhiteSpace($val)) {
        throw "Variable d'environnement de production obligatoire manquante ou vide : $var"
    }
}

$prodHost = $env:PROD_HOST
$prodUser = $env:PROD_USER
$prodDb   = $env:PROD_DB

# 2. Vérification des variables d'environnement ISOLÉES (Strictement distinctes)
$isoVars = @("ISOLATED_TEST_HOST", "ISOLATED_TEST_USER", "ISOLATED_TEST_DB", "ISOLATED_TEST_PASSWORD")
foreach ($var in $isoVars) {
    $val = [Environment]::GetEnvironmentVariable($var)
    if ([string]::IsNullOrWhiteSpace($val)) {
        throw "Variable d'environnement de test isolé obligatoire manquante ou vide : $var"
    }
}

$isoHost = $env:ISOLATED_TEST_HOST
$isoUser = $env:ISOLATED_TEST_USER
$isoDb   = $env:ISOLATED_TEST_DB

# 3. GARDE-FOUS ANTI-COLLISION & REFUS DE RESTAURATION DANGEREUSE
if ($isoDb.Trim().ToLower() -eq $prodDb.Trim().ToLower()) {
    throw "[REFUS CRITIQUE] La base de test isolée (ISOLATED_TEST_DB) est identique à la base de production (PROD_DB) !"
}

if ($isoHost.Trim().ToLower() -eq $prodHost.Trim().ToLower() -and $isoUser.Trim().ToLower() -eq $prodUser.Trim().ToLower()) {
    throw "[REFUS CRITIQUE] L'hôte et l'utilisateur isolés sont identiques à la production. Risque de pollution critique !"
}

# 4. Résolution des exécutables PostgreSQL (PATH ou PG_BIN_DIR)
function Get-PgCommand {
    param([string]$cmdName)
    if (-not [string]::IsNullOrWhiteSpace($env:PG_BIN_DIR)) {
        $candidate = Join-Path $env:PG_BIN_DIR "$cmdName.exe"
        if (Test-Path $candidate) { return $candidate }
    }
    $inPath = Get-Command $cmdName -ErrorAction SilentlyContinue
    if ($null -ne $inPath) { return $cmdName }
    throw "Exécutable '$cmdName' introuvable dans le PATH ni dans PG_BIN_DIR."
}

$psqlCmd      = Get-PgCommand "psql"
$pgDumpCmd    = Get-PgCommand "pg_dump"
$pgRestoreCmd = Get-PgCommand "pg_restore"

$backupDir = Join-Path $PSScriptRoot "..\backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpPath  = Join-Path $backupDir "switch_prod_backup_$timestamp.dump"

# =============================================================================
# PHASE 1 : PREFLIGHT & DUMP PRODUCTION (CREDENTIALS PROD UNIQUEMENT)
# =============================================================================
try {
    $env:PGPASSWORD = $env:PROD_DB_PASSWORD

    Write-Host "=== 1. CONTRÔLE D'IDENTITÉ DE LA BASE DE PRODUCTION ==="
    $preflightSql = "SELECT current_database(), current_user, inet_server_addr(), inet_server_port();"
    $prodTargetInfo = & $psqlCmd -h $prodHost -U $prodUser -d $prodDb -t -A -c $preflightSql
    if ($LASTEXITCODE -ne 0) {
        throw "Échec de connexion en lecture seule sur la production."
    }
    Write-Host "Cible de production vérifiée : $prodTargetInfo"

    Write-Host "`n=== 2. EXÉCUTION DU DUMP DE PRODUCTION (pg_dump) ==="
    & $pgDumpCmd -h $prodHost -U $prodUser -d $prodDb -F c -b -v -f $dumpPath
    if ($LASTEXITCODE -ne 0) {
        throw "Échec critique lors de pg_dump (Code retour : $LASTEXITCODE)"
    }

    $dumpItem = Get-Item $dumpPath
    if ($dumpItem.Length -lt 1024) {
        throw "Archive dump invalide ou vide ($($dumpItem.Length) octets)."
    }
    Write-Host "Taille de l'archive validée : $($dumpItem.Length) octets."

    $restoreList = & $pgRestoreCmd --list $dumpPath
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($restoreList)) {
        throw "L'archive générée est illisible ou corrompue."
    }
    Write-Host "Archive pg_restore vérifiée avec succès."

    $dumpHash = (Get-FileHash -Path $dumpPath -Algorithm SHA256).Hash
    Write-Host "Empreinte SHA-256 du Dump : $dumpHash"
    Set-Content -Path "$dumpPath.sha256" -Value "$dumpHash  $($dumpItem.Name)"

} finally {
    if (Test-Path Env:\PGPASSWORD) {
        Remove-Item Env:\PGPASSWORD
        Write-Host "Credentials de production immédiatement effacés de la mémoire."
    }
}

# =============================================================================
# PHASE 2 : RESTAURATION SUR INSTANCE ISOLÉE (CREDENTIALS ISOLÉS UNIQUEMENT)
# =============================================================================
try {
    $env:PGPASSWORD = $env:ISOLATED_TEST_PASSWORD

    Write-Host "`n=== 3. CONTRÔLE D'IDENTITÉ DE LA CIBLE ISOLÉE ==="
    $isoCheckSql = "SELECT current_database(), current_user, inet_server_addr(), inet_server_port();"
    $isoTargetInfo = & $psqlCmd -h $isoHost -U $isoUser -d $isoDb -t -A -c $isoCheckSql
    if ($LASTEXITCODE -ne 0) {
        throw "Échec de connexion sur l'instance isolée."
    }
    Write-Host "Cible isolée vérifiée : $isoTargetInfo"

    Write-Host "`n=== 4. RESTAURATION DU DUMP SUR L'INSTANCE ISOLÉE ==="
    & $pgRestoreCmd -h $isoHost -U $isoUser -d $isoDb --clean --if-exists $dumpPath
    if ($LASTEXITCODE -ne 0) {
        throw "Échec de la restauration sur l'instance isolée."
    }
    Write-Host "Restauration réussie sur l'instance isolée."

    Write-Host "`n=== 5. EXÉCUTION DU SCRIPT D'ANONYMISATION SUR LA BASE ISOLÉE ==="
    $anonymizeSqlPath = Join-Path $PSScriptRoot "anonymize_isolated_database.sql"
    & $psqlCmd -h $isoHost -U $isoUser -d $isoDb -v ON_ERROR_STOP=1 -f $anonymizeSqlPath
    if ($LASTEXITCODE -ne 0) {
        throw "Échec du script d'anonymisation sur l'instance isolée."
    }
    Write-Host "Anonymisation validée sur l'instance isolée."

    Write-Host "`n=== 6. AUDIT SQL DE RÉCONCILIATION POST-ANONYMISATION ==="
    $auditSqlPath = Join-Path $PSScriptRoot "audit_reconciliation_exact.sql"
    & $psqlCmd -h $isoHost -U $isoUser -d $isoDb -v ON_ERROR_STOP=1 -f $auditSqlPath
    if ($LASTEXITCODE -ne 0) {
        throw "Échec de l'audit SQL de réconciliation sur l'instance isolée."
    }
    Write-Host "Audit SQL de réconciliation terminé avec succès."

} finally {
    if (Test-Path Env:\PGPASSWORD) {
        Remove-Item Env:\PGPASSWORD
        Write-Host "Credentials de test isolé effacés de la mémoire."
    }
}
