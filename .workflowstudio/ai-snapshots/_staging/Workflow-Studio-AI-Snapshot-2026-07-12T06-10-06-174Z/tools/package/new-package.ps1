param(
  [Parameter(Mandatory=$true)]
  [string]$Name,

  [Parameter(Mandatory=$true)]
  [string]$Version,

  [string]$Description = "Workflow Studio milestone package.",

  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$SafeName = $Name.Trim().ToLowerInvariant() -replace "[^a-z0-9._-]+", "-"
$PackageId = "workflowstudio-v$Version-$SafeName"
$PackageRoot = Join-Path $ProjectRoot "_packages"
$PackagePath = Join-Path $PackageRoot $PackageId

if (Test-Path $PackagePath) {
  throw "Package already exists: $PackagePath"
}

New-Item -ItemType Directory -Force -Path $PackagePath | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $PackagePath "files") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $PackagePath "scripts") | Out-Null

$manifest = [ordered]@{
  packageId = $PackageId
  name = $Name
  version = $Version
  targetProject = "Workflow Studio"
  description = $Description
  files = @()
  suggestedCommitMessage = "Add $Name"
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $PackagePath "manifest.json") -Encoding UTF8

@"
# $PackageId

$Description

## Files Changed

Add file entries to `manifest.json`, then copy replacement files into `files/`.

## Suggested Commit

`Add $Name`
"@ | Set-Content -Path (Join-Path $PackagePath "README.md") -Encoding UTF8

@"
# Install

From the project root:

```powershell
.\tools\package\install-package.ps1 ".\_packages\$PackageId"
npm run build
```
"@ | Set-Content -Path (Join-Path $PackagePath "INSTALL.md") -Encoding UTF8

@"
# Changelog

## v$Version — $Name

- Package created.
"@ | Set-Content -Path (Join-Path $PackagePath "CHANGELOG.md") -Encoding UTF8

@"
param(
  [string]`$ProjectRoot = (Get-Location).Path
)

`$PackagePath = Split-Path -Parent `$PSScriptRoot
& (Join-Path `$ProjectRoot "tools/package/install-package.ps1") -PackagePath `$PackagePath -ProjectRoot `$ProjectRoot
"@ | Set-Content -Path (Join-Path $PackagePath "scripts/install.ps1") -Encoding UTF8

Write-Host "Created package: $PackagePath"
Write-Host "Next: add files to the files folder and update manifest.json."
