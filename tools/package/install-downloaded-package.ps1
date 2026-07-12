param(
    [Parameter(Mandatory = $true)]
    [string]$PackageName
)

$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\mitch\Desktop\GPT Workflow Studio"
$Downloads = "C:\Users\mitch\Downloads"

$ZipPath = Join-Path $Downloads "$PackageName.zip"
$ExtractedPath = Join-Path $Downloads $PackageName
$InstallerPath = Join-Path $ProjectRoot "tools\package\install-package.ps1"

if (-not (Test-Path $ZipPath)) {
    throw "Package ZIP was not found: $ZipPath"
}

if (-not (Test-Path $InstallerPath)) {
    throw "Workflow Studio package installer was not found: $InstallerPath"
}

Write-Host "Preparing package: $PackageName"

if (Test-Path $ExtractedPath) {
    Write-Host "Removing previous extracted package..."
    Remove-Item $ExtractedPath -Recurse -Force
}

Write-Host "Extracting package..."
Expand-Archive `
    -Path $ZipPath `
    -DestinationPath $ExtractedPath `
    -Force

$ManifestPath = Join-Path $ExtractedPath "manifest.json"

if (-not (Test-Path $ManifestPath)) {
    throw "The extracted package does not contain manifest.json at: $ExtractedPath"
}

Write-Host "Installing package..."
Set-Location $ProjectRoot

& $InstallerPath $ExtractedPath

Write-Host "Running build..."
npm run build

if ($LASTEXITCODE -ne 0) {
    throw "Build failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "Package installed and build passed."