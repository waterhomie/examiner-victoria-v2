param(
    [int]$Port = 5173,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "_common.ps1")

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")
$frontendRoot = Join-Path $repoRoot "frontend"
$pnpm = Resolve-V2Pnpm

Write-Host "Examiner Victoria frontend" -ForegroundColor Cyan
Write-Host "Frontend: $frontendRoot"

Set-Location $frontendRoot
if (-not $SkipInstall) {
    Invoke-V2Native $pnpm install
}
Invoke-V2Native $pnpm exec vite --host 0.0.0.0 --port $Port
