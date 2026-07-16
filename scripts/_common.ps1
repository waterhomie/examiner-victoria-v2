$ErrorActionPreference = "Stop"

function Resolve-ProjectPython {
    if ($env:PYTHON) {
        return $env:PYTHON
    }

    $bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
    if (Test-Path -LiteralPath $bundledPython) {
        return $bundledPython
    }

    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCommand) {
        return $pythonCommand.Source
    }

    throw "Python was not found. Install Python 3.12+ or set `$env:PYTHON to python.exe."
}

function Resolve-ProjectPnpm {
    if ($env:PNPM) {
        return $env:PNPM
    }

    $pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
    if ($pnpmCommand) {
        $bundledNodeBin = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
        if ((Test-Path -LiteralPath $bundledNodeBin) -and ($pnpmCommand.Source -like "*codex-runtimes*")) {
            if (-not ($env:PATH -split ';' | Where-Object { $_ -eq $bundledNodeBin })) {
                $env:PATH = "$bundledNodeBin;$env:PATH"
            }
        }
        return $pnpmCommand.Source
    }

    $bundledNodeBin = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
    $bundledPnpm = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"
    if ((Test-Path -LiteralPath $bundledPnpm) -and (Test-Path -LiteralPath $bundledNodeBin)) {
        if (-not ($env:PATH -split ';' | Where-Object { $_ -eq $bundledNodeBin })) {
            $env:PATH = "$bundledNodeBin;$env:PATH"
        }
        return $bundledPnpm
    }

    throw "pnpm was not found. Install Node.js + pnpm, or set `$env:PNPM to pnpm.cmd."
}

function Add-ProjectPythonPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoRoot
    )

    $parts = @()
    $localDeps = Join-Path $RepoRoot "tmp\backend_deps"
    $legacyLocalDeps = Join-Path $RepoRoot ("tmp\" + "v2_backend_deps")
    if (Test-Path -LiteralPath $localDeps) {
        $parts += $localDeps
    } elseif (Test-Path -LiteralPath $legacyLocalDeps) {
        $parts += $legacyLocalDeps
    }
    $parts += $RepoRoot

    if ($env:PYTHONPATH) {
        $existingParts = $env:PYTHONPATH -split ';' | Where-Object { $_ }
        foreach ($existingPart in $existingParts) {
            if (-not ($parts -contains $existingPart)) {
                $parts += $existingPart
            }
        }
    }

    $env:PYTHONPATH = $parts -join ';'
}

function Invoke-ProjectNative {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }
}
