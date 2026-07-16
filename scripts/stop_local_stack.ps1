param(
    [string]$Ports = "8010,5174"
)

$ErrorActionPreference = "Stop"

function Resolve-RealPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    $item = Get-Item -LiteralPath $Path -Force
    if ($item.LinkType -eq "Junction" -and $item.Target) {
        return [string]$item.Target[0]
    }
    return $item.FullName
}

$repoRoot = Resolve-RealPath (Join-Path $PSScriptRoot "..")
$tmpRoot = Join-Path $repoRoot "tmp"
$pidFiles = @(
    (Join-Path $tmpRoot "server_pids.txt"),
    (Join-Path $tmpRoot ("v2_" + "server_pids.txt"))
)
$tunnelPidFiles = @(
    (Join-Path $tmpRoot "tunnel_pid.txt"),
    (Join-Path $tmpRoot ("v2_" + "tunnel_pid.txt"))
)
$tunnelUrlFiles = @(
    (Join-Path $tmpRoot "tunnel_url.txt"),
    (Join-Path $tmpRoot ("v2_" + "tunnel_url.txt"))
)
$portList = $Ports -split "[,\s;]+" |
    Where-Object { $_ } |
    ForEach-Object { [int]$_ }

Write-Host "Stopping Examiner Victoria local stack..." -ForegroundColor Cyan
Write-Host "Ports: $($portList -join ', ')"

function Stop-RecordedPids {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $pidLines = Get-Content -LiteralPath $Path
    $seenPids = @{}
    foreach ($line in $pidLines) {
        if ($line -match "=(\d+)$") {
            $pidValue = [int]$Matches[1]
            if ($seenPids.ContainsKey($pidValue)) {
                continue
            }
            $seenPids[$pidValue] = $true
            Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped recorded process $pidValue"
        }
    }
}

function Stop-ListenersOnPort {
    param([int]$Port)

    for ($attempt = 1; $attempt -le 5; $attempt++) {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if (-not $connections) {
            return
        }

        foreach ($connection in $connections) {
            Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $($connection.OwningProcess) listening on port $Port"
        }

        Start-Sleep -Milliseconds 500
    }

    $remaining = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($remaining) {
        Write-Host "Port $Port is still in use. You may need to close it manually." -ForegroundColor Yellow
    }
}

foreach ($recordedPidFile in ($pidFiles + $tunnelPidFiles)) {
    Stop-RecordedPids -Path $recordedPidFile
}

Start-Sleep -Seconds 1

foreach ($port in $portList) {
    Stop-ListenersOnPort -Port $port
}

Remove-Item -LiteralPath ($pidFiles + $tunnelPidFiles + $tunnelUrlFiles) -Force -ErrorAction SilentlyContinue
Write-Host "Local stack stop command finished." -ForegroundColor Green
