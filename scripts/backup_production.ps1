# scripts/backup_production.ps1
# Script PowerShell de Sauvegarde Automatique & Plan de Reprise d'Urgence (PRA) — Switch Bénin

param(
    [string]$SourceDb = "./backend/switch_benin.db",
    [string]$BackupDir = "./backups"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SWITCH BÉNIN 🇧🇯 — PLAN DE SAUVEGARDE & REPRISE (PRA)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "📁 Dossier de sauvegarde crée : $BackupDir" -ForegroundColor Green
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "switch_benin_backup_$Timestamp.db"
$SnapshotMetadata = Join-Path $BackupDir "snapshot_manifest_$Timestamp.json"

if (Test-Path $SourceDb) {
    Copy-Item -Path $SourceDb -Destination $BackupFile -Force
    Write-Host "✅ Sauvegarde réussie de la base centrale SQLite -> $BackupFile" -ForegroundColor Green
    
    $Manifest = @{
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        source_db = $SourceDb
        backup_file = $BackupFile
        status = "SUCCESS"
        integrity_hash = (Get-FileHash $BackupFile -Algorithm SHA256).Hash
        regulatory_compliance = "UEMOA_BCEAO_INSTRUCTION_01_2010"
    } | ConvertTo-Json -Depth 4
    
    $Manifest | Out-File -FilePath $SnapshotMetadata -Encoding utf8
    Write-Host "📋 Manifeste d'intégrité généré : $SnapshotMetadata" -ForegroundColor Green
} else {
    Write-Host "❌ Base de données source introuvable à : $SourceDb" -ForegroundColor Red
}

Write-Host "==========================================================" -ForegroundColor Cyan
