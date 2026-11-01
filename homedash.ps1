# Start, stop, restart or check the local server.
#
#   .\homedash.ps1 start      runs the server in the background on port 8081
#   .\homedash.ps1 stop
#   .\homedash.ps1 restart
#   .\homedash.ps1 status
#   .\homedash.ps1 run        runs it in this window (Ctrl+C stops it)
#
# Both start and run go through a supervisor: when the server exits with code
# 75 after applying an update it is launched again, and if the new version
# does not answer /api/heartbeat in time the update is rolled back
# (docs/system/updates.md). Any other exit ends the supervisor.
#
# The background process id (the supervisor's) is kept in
# data\homedash-<port>.pid; the output goes to data\server-<port>.out.txt and
# .err.txt. PORT can be set in the environment before starting, and each port
# runs its own instance.

param(
  [ValidateSet('start', 'stop', 'restart', 'status', 'run', 'supervise')]
  [string]$Command = 'status'
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$data = Join-Path $root 'data'
$entry = Join-Path $root 'server\server.js'
$port = if ($env:PORT) { $env:PORT } else { '8081' }
$pidFile = Join-Path $data "homedash-$port.pid"
$outFile = Join-Path $data "server-$port.out.txt"
$errFile = Join-Path $data "server-$port.err.txt"
$updateExit = 75
$pendingFile = Join-Path $data 'update-pending.json'
$stateFile = Join-Path $data 'update-state.json'
$logFile = Join-Path $data 'log.txt'

New-Item -ItemType Directory -Force -Path $data | Out-Null

function Get-Running {
  if (-not (Test-Path $pidFile)) { return $null }
  $id = Get-Content $pidFile | Select-Object -First 1
  try {
    $p = Get-Process -Id $id -ErrorAction Stop
    if ($p.ProcessName -match '^(node|powershell|pwsh)') { return $p }
  } catch {}
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  return $null
}

function Start-Server {
  if (Get-Running) { Write-Host "homedash is already running (pid $((Get-Running).Id)) on http://localhost:$port"; return }
  $env:PORT = $port
  $shell = (Get-Process -Id $PID).Path
  $p = Start-Process -FilePath $shell -WorkingDirectory $root -PassThru -WindowStyle Hidden `
    -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"", 'supervise' `
    -RedirectStandardOutput $outFile -RedirectStandardError $errFile
  Set-Content -Path $pidFile -Value $p.Id -Encoding ascii
  Start-Sleep -Milliseconds 1200
  if ($p.HasExited) { Write-Host "homedash failed to start; see data\server-$port.err.txt"; exit 1 }
  Write-Host "homedash started (pid $($p.Id)) on http://localhost:$port"
}

function Stop-Server {
  $p = Get-Running
  if (-not $p) { Write-Host 'homedash is not running'; return }
  # The supervisor and the server under it.
  & taskkill /PID $p.Id /T /F | Out-Null
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  Write-Host "homedash stopped (pid $($p.Id))"
}

# ------------------------------------------------------------- supervisor

function Write-HomedashLog([string]$level, [string]$text) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $($level.ToUpper().PadRight(5)) $text"
  Write-Host $line
  Add-Content -Path $logFile -Value $line -ErrorAction SilentlyContinue
}

function Read-JsonFile([string]$file) {
  if (-not (Test-Path $file)) { return $null }
  try { return Get-Content $file -Raw | ConvertFrom-Json } catch { return $null }
}

function Get-RollbackSeconds {
  $c = Read-JsonFile (Join-Path $data 'update.json')
  if ($c -and $c.rollbackSeconds) { return [int]$c.rollbackSeconds }
  return 30
}

# True once the new server answers the heartbeat; false if it exits or stays
# silent for the whole window.
function Wait-Heartbeat($proc, [int]$seconds) {
  $deadline = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $deadline) {
    if ($proc.HasExited) { return $false }
    try {
      $r = Invoke-WebRequest -Uri "http://127.0.0.1:$port/api/heartbeat" -UseBasicParsing -TimeoutSec 2
      if ($r.StatusCode -eq 200) { return $true }
    } catch {}
    Start-Sleep -Milliseconds 500
  }
  return $false
}

# Go back to the commit that worked. `reset --keep` moves the branch and the
# tracked files, refuses to overwrite a local edit and never touches data\. It
# is not the hard reset the update rules forbid.
function Invoke-Rollback($pending, [int]$seconds, [string]$why) {
  $bad = $pending.to.Substring(0, 7)
  $good = $pending.from.Substring(0, 7)
  Write-HomedashLog 'error' "update=rejected commit=$bad reason=$why"
  & git -C $root reset --keep $pending.from | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-HomedashLog 'error' "update=rollback_failed restore=$good"
  } else {
    Write-HomedashLog 'warn' "update=rolled_back restored=$good rejected=$bad"
  }
  $state = @{}
  $old = Read-JsonFile $stateFile
  if ($old) { $old.PSObject.Properties | ForEach-Object { $state[$_.Name] = $_.Value } }
  $at = (Get-Date).ToUniversalTime().ToString('o')
  $state['rejected'] = @{ commit = $pending.to; at = $at; reason = $why }
  $state['lastUpdate'] = @{ status = 'rolled-back'; from = $pending.from; to = $pending.to; at = $at; message = "The new version did not start ($why); went back" }
  $state['available'] = $null
  $state | ConvertTo-Json -Depth 5 | Set-Content -Path $stateFile -Encoding utf8
  Remove-Item $pendingFile -Force -ErrorAction SilentlyContinue
}

function Invoke-Supervisor {
  $env:PORT = $port
  $env:HOMEDASH_SUPERVISED = '1'
  while ($true) {
    $pending = Read-JsonFile $pendingFile
    $proc = Start-Process -FilePath 'node' -ArgumentList "`"$entry`"" -WorkingDirectory $root -PassThru -NoNewWindow
    $null = $proc.Handle
    if ($pending) {
      $seconds = Get-RollbackSeconds
      if (Wait-Heartbeat $proc $seconds) {
        Remove-Item $pendingFile -Force -ErrorAction SilentlyContinue
        Write-HomedashLog 'info' "update=verified commit=$($pending.to.Substring(0, 7))"
      } else {
        $why = if ($proc.HasExited) { 'exited_during_startup' } else { "no_heartbeat_in_$($seconds)s" }
        if (-not $proc.HasExited) { & taskkill /PID $proc.Id /T /F | Out-Null }
        $proc.WaitForExit()
        Invoke-Rollback $pending $seconds $why
        continue
      }
    }
    $proc.WaitForExit()
    if ($proc.ExitCode -ne $updateExit) { exit $proc.ExitCode }
    Write-HomedashLog 'info' 'update=restarting'
  }
}

switch ($Command) {
  'start'   { Start-Server }
  'stop'    { Stop-Server }
  'restart' { Stop-Server; Start-Server }
  'status'  {
    $p = Get-Running
    if ($p) { Write-Host "homedash is running (pid $($p.Id)) on http://localhost:$port" }
    else { Write-Host 'homedash is not running' }
  }
  'run'       { Invoke-Supervisor }
  'supervise' { Invoke-Supervisor }
}
