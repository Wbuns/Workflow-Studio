param(
  [Parameter(Mandatory=$true)]
  [string]$PackagePath,

  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
$StartedAt = Get-Date
$Operations = New-Object System.Collections.Generic.List[object]
$RollbackEntries = New-Object System.Collections.Generic.List[object]

function Resolve-SafeChildPath {
  param([string]$Root, [string]$RelativePath, [string]$Label)
  if ([string]::IsNullOrWhiteSpace($RelativePath) -or [System.IO.Path]::IsPathRooted($RelativePath)) {
    throw "$Label path is invalid: $RelativePath"
  }
  $ResolvedRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd('\','/')
  $ResolvedPath = [System.IO.Path]::GetFullPath((Join-Path $ResolvedRoot $RelativePath))
  if (-not $ResolvedPath.StartsWith($ResolvedRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "$Label path escapes its root: $RelativePath"
  }
  return $ResolvedPath
}

function Test-FilesMatch {
  param([string]$Source, [string]$Target)
  if (-not (Test-Path -LiteralPath $Target -PathType Leaf)) { return $false }
  $SourceInfo = Get-Item -LiteralPath $Source
  $TargetInfo = Get-Item -LiteralPath $Target
  if ($SourceInfo.Length -ne $TargetInfo.Length) { return $false }
  return (Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash -eq (Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash
}

try {
  $PackageRoot = (Resolve-Path -LiteralPath $PackagePath).Path
  $ResolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
  if (-not (Test-Path -LiteralPath $ResolvedProjectRoot -PathType Container)) { throw "The selected project root is invalid." }

  $ManifestPath = Join-Path $PackageRoot "manifest.json"
  if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf)) { throw "Package manifest.json was not found." }

  $Validator = Join-Path $ResolvedProjectRoot "tools/package/validate-package.ps1"
  if (Test-Path -LiteralPath $Validator -PathType Leaf) { & $Validator -PackagePath $PackageRoot }

  $Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
  if ([string]::IsNullOrWhiteSpace($Manifest.packageId) -or -not $Manifest.files -or $Manifest.files.Count -eq 0) {
    throw "Package manifest is incomplete or contains no files."
  }

  $PreparedFiles = @()
  $DestinationSet = @{}
  foreach ($File in $Manifest.files) {
    $Source = Resolve-SafeChildPath -Root $PackageRoot -RelativePath $File.source -Label "Source"
    $Target = Resolve-SafeChildPath -Root $ResolvedProjectRoot -RelativePath $File.target -Label "Destination"
    if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { throw "Package source is missing: $($File.source)" }
    if ((Get-Item -LiteralPath $Source).Length -le 0) { throw "Package source is empty: $($File.source)" }
    $DestinationKey = $Target.ToLowerInvariant()
    if ($DestinationSet.ContainsKey($DestinationKey)) { throw "Duplicate destination path: $($File.target)" }
    $DestinationSet[$DestinationKey] = $true
    $PreparedFiles += [pscustomobject]@{ Source=$Source; Target=$Target; SourceLabel=$File.source; TargetLabel=$File.target }
  }

  $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $BackupFolder = Join-Path (Join-Path (Join-Path $ResolvedProjectRoot "_backup") $Manifest.packageId) $Timestamp

  foreach ($File in $PreparedFiles) {
    $Existed = Test-Path -LiteralPath $File.Target -PathType Leaf
    if ($Existed -and (Test-FilesMatch -Source $File.Source -Target $File.Target)) {
      $Operations.Add([pscustomobject]@{ source=$File.Source; destination=$File.Target; target=$File.TargetLabel; action="skipped"; verified=$true; message="Destination already matches source." })
      Write-Host "SKIPPED $($File.TargetLabel)"
      continue
    }

    $Action = if ($Existed) { "overwrite" } else { "new" }
    $BackupTarget = $null
    if ($Existed) {
      $BackupTarget = Resolve-SafeChildPath -Root $BackupFolder -RelativePath $File.TargetLabel -Label "Backup"
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $BackupTarget) | Out-Null
      Copy-Item -LiteralPath $File.Target -Destination $BackupTarget -Force
      if (-not (Test-Path -LiteralPath $BackupTarget -PathType Leaf)) { throw "Backup verification failed: $($File.TargetLabel)" }
    }

    $RollbackEntries.Add([pscustomobject]@{ target=$File.Target; backup=$BackupTarget; created=(-not $Existed) })
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $File.Target) | Out-Null
    Copy-Item -LiteralPath $File.Source -Destination $File.Target -Force
    if (-not (Test-Path -LiteralPath $File.Target -PathType Leaf)) { throw "Destination was not created: $($File.TargetLabel)" }
    if ((Get-Item -LiteralPath $File.Target).Length -le 0) { throw "Destination is empty: $($File.TargetLabel)" }
    if (-not (Test-FilesMatch -Source $File.Source -Target $File.Target)) { throw "Destination verification failed: $($File.TargetLabel)" }

    $Operations.Add([pscustomobject]@{ source=$File.Source; destination=$File.Target; target=$File.TargetLabel; action=$Action; verified=$true; message="Verified" })
    Write-Host "$($Action.ToUpperInvariant()) $($File.TargetLabel)"
  }

  $Copied = @($Operations | Where-Object action -eq "new").Count
  $Overwritten = @($Operations | Where-Object action -eq "overwrite").Count
  $Skipped = @($Operations | Where-Object action -eq "skipped").Count
  if (($Copied + $Overwritten) -lt 1) { throw "No files were installed. Every file was skipped." }

  Write-Host ""
  Write-Host "Package Installed"
  Write-Host "Files Copied: $Copied"
  Write-Host "Files Overwritten: $Overwritten"
  Write-Host "Files Skipped: $Skipped"
  Write-Host "Files Failed: 0"
  Write-Host "Destination: $ResolvedProjectRoot"
  Write-Host "Validation: Manifest verified; Project verified; Files verified"
  Write-Host "Backup folder: $BackupFolder"
  Write-Host "Elapsed: $([math]::Round(((Get-Date) - $StartedAt).TotalMilliseconds)) ms"
  Write-Host "Suggested commit: $($Manifest.suggestedCommitMessage)"
}
catch {
  $Reason = $_.Exception.Message
  $RollbackErrors = @()
  foreach ($Entry in @($RollbackEntries | Select-Object -Reverse)) {
    try {
      if ($Entry.created) { Remove-Item -LiteralPath $Entry.target -Force -ErrorAction SilentlyContinue }
      elseif ($Entry.backup -and (Test-Path -LiteralPath $Entry.backup -PathType Leaf)) {
        Copy-Item -LiteralPath $Entry.backup -Destination $Entry.target -Force
      }
    } catch { $RollbackErrors += "$($Entry.target): $($_.Exception.Message)" }
  }
  Write-Error "Installation Failed`nReason: $Reason`nRollback: $(if ($RollbackErrors.Count) { $RollbackErrors -join '; ' } else { 'Completed when required.' })`nSuggested Fix: Review manifest paths and the selected project root."
  exit 1
}
