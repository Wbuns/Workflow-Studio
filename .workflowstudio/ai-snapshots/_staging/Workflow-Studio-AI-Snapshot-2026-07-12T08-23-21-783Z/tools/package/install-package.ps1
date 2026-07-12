param(
  [Parameter(Mandatory=$true)]
  [string]$PackagePath,

  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$PackagePath = Resolve-Path $PackagePath
$ProjectRoot = Resolve-Path $ProjectRoot

$Validator = Join-Path $ProjectRoot "tools/package/validate-package.ps1"
if (Test-Path $Validator) {
  & $Validator -PackagePath $PackagePath
}

$ManifestPath = Join-Path $PackagePath "manifest.json"
$Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json

$BackupRoot = Join-Path $ProjectRoot "_backup"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupFolder = Join-Path $BackupRoot $Manifest.packageId
$BackupFolder = Join-Path $BackupFolder $Timestamp
New-Item -ItemType Directory -Force -Path $BackupFolder | Out-Null

foreach ($file in $Manifest.files) {
  $Source = Join-Path $PackagePath $file.source
  $Target = Join-Path $ProjectRoot $file.target

  if (Test-Path $Target) {
    $BackupTarget = Join-Path $BackupFolder $file.target
    $BackupTargetFolder = Split-Path -Parent $BackupTarget
    New-Item -ItemType Directory -Force -Path $BackupTargetFolder | Out-Null
    Copy-Item $Target $BackupTarget -Force
  }

  $TargetFolder = Split-Path -Parent $Target
  New-Item -ItemType Directory -Force -Path $TargetFolder | Out-Null
  Copy-Item $Source $Target -Force
  Write-Host "Installed $($file.target)"
}

Write-Host "Package installed: $($Manifest.packageId)"
Write-Host "Backup folder: $BackupFolder"
Write-Host "Suggested commit: $($Manifest.suggestedCommitMessage)"
