param(
  [Parameter(Mandatory=$true)]
  [string]$PackagePath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $PackagePath)) {
  throw "Package path not found: $PackagePath"
}

$ManifestPath = Join-Path $PackagePath "manifest.json"

if (-not (Test-Path $ManifestPath)) {
  throw "Invalid package: manifest.json is missing."
}

$Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json

if (-not $Manifest.packageId) {
  throw "Invalid package: packageId is missing."
}

if (-not $Manifest.version) {
  throw "Invalid package: version is missing."
}

if (-not $Manifest.files) {
  throw "Invalid package: files array is missing or empty."
}

foreach ($file in $Manifest.files) {
  if (-not $file.source -or -not $file.target) {
    throw "Invalid package: every file entry needs source and target."
  }

  $SourcePath = Join-Path $PackagePath $file.source
  if (-not (Test-Path $SourcePath)) {
    throw "Invalid package: source file missing: $($file.source)"
  }
}

Write-Host "Package is valid: $($Manifest.packageId)"
