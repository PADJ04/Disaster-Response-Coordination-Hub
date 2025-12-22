<#
Start.ps1 - Windows PowerShell helper to run services.
Run from repository root (where this file is located).

Usage:
  .\start.ps1                # start services as background jobs (default)
  .\start.ps1 -NewWindow     # open each service in its own PowerShell window

If executed interactively and policy prevents running, use:
  powershell -ExecutionPolicy Bypass -File .\start.ps1
#>

param(
    [switch] $NewWindow
)

Set-StrictMode -Version Latest

# ensure logs dir
$logsDir = Join-Path $PSScriptRoot 'logs'
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

# Helper to start a named job that runs a command in a working dir and redirects output
function Start-ServiceJob {
    param(
        [Parameter(Mandatory=$true)] [string] $Name,
        [Parameter(Mandatory=$true)] [string] $WorkingDirectory,
        [Parameter(Mandatory=$true)] [string] $Command
    )

    $out = Join-Path $logsDir "${Name}.log"
    $err = Join-Path $logsDir "${Name}.err"

    # If job exists remove it
    $existing = Get-Job -Name $Name -ErrorAction SilentlyContinue
    if ($existing) { Stop-Job -Job $existing.Id -Force -ErrorAction SilentlyContinue; Remove-Job -Job $existing.Id -Force -ErrorAction SilentlyContinue }

    Start-Job -Name $Name -ScriptBlock {
        param($wd, $cmd, $outFile, $errFile)
        Set-Location $wd
        Invoke-Expression "$cmd *> \"$outFile\" 2> \"$errFile\""
    } -ArgumentList $WorkingDirectory, $Command, $out, $err | Out-Null

    Write-Host "Started job '$Name' -> logs: $out, $err"
}

function Start-InNewWindow {
    param(
        [Parameter(Mandatory=$true)] [string] $Name,
        [Parameter(Mandatory=$true)] [string] $WorkingDirectory,
        [Parameter(Mandatory=$true)] [string] $Command
    )

    $out = Join-Path $logsDir "${Name}.log"
    $err = Join-Path $logsDir "${Name}.err"

    # Build command to run inside new window: change dir; run command redirecting output; keep window open
    $escapedCmd = "Set-Location -LiteralPath '$WorkingDirectory'; $Command *> '$out' 2> '$err'; Write-Host 'Process exited. Check logs: $out, $err'"

    # Start new PowerShell window (uses 'powershell' for Windows PowerShell, adjust to 'pwsh' if using PowerShell Core)
    Start-Process -FilePath powershell -ArgumentList '-NoExit','-Command',$escapedCmd -WorkingDirectory $WorkingDirectory | Out-Null
    Write-Host "Launched new window for '$Name' -> logs: $out, $err"
}

function Stop-AllServices {
    # Stop background jobs
    Get-Job | Where-Object { $_.Name -in @('backend','frontend','server','graphhopper') } | ForEach-Object {
        Write-Host "Stopping job $($_.Name)..."
        Stop-Job -Job $_ -Force -ErrorAction SilentlyContinue
        Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue
    }
    # Note: windows opened with Start-Process must be closed by user (or script could attempt to find processes and kill them)
}

function Show-Logs {
    param([string[]] $Names = @('backend','frontend','server','graphhopper'))
    foreach ($n in $Names) {
        $f = Join-Path $logsDir ("$n.log")
        if (Test-Path $f) {
            Write-Host "--- $n log ---"
            Get-Content $f -Tail 50
        } else { Write-Host "Log not found: $f" }
    }
}

# Commands to start
$services = @(
    @{ Name='backend'; wd=Join-Path $PSScriptRoot 'backend'; cmd='python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000' },
    @{ Name='frontend'; wd=Join-Path $PSScriptRoot 'frontend'; cmd='npm run dev' },
    @{ Name='server'; wd=$PSScriptRoot; cmd='node server.js' },
    @{ Name='graphhopper'; wd=Join-Path $PSScriptRoot 'graphhopper'; cmd='java -Xmx8g -jar graphhopper-web-11.0.jar server config.yml' }
)

if ($NewWindow) {
    Write-Host "Launching each service in its own PowerShell window..."
    foreach ($s in $services) { Start-InNewWindow -Name $s.Name -WorkingDirectory $s.wd -Command $s.cmd }
    Write-Host "Launched windows for all services. Close windows to stop them.`nUseful: Show-Logs, Get-Job (for any background jobs), Stop-AllServices (stops jobs)"
} else {
    Write-Host "Starting services as background jobs..."
    foreach ($s in $services) { Start-ServiceJob -Name $s.Name -WorkingDirectory $s.wd -Command $s.cmd }
    Write-Host "All jobs started. Use Get-Job to list jobs. Use Stop-AllServices to stop them. Useful: Show-Logs, Get-Content logs\backend.log -Wait"
}
Write-Host "Done."