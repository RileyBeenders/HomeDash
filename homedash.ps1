# Start, stop, restart or check the local server.
#
#   .\homedash.ps1 start      runs the server in the background on port 8081
#   .\homedash.ps1 stop
#   .\homedash.ps1 restart
#   .\homedash.ps1 status
#   .\homedash.ps1 run        runs it in this window (Ctrl+C stops it)
#
# The background process id is kept in data\homedash-<port>.pid; its output
# goes to data\server-<port>.out.txt and .err.txt. PORT can be set in the
# environment before starting, and each port runs its own instance.

param(
  [ValidateSet('start', 'stop', 'restart', 'status', 'run')]
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

New-Item -ItemType Directory -Force -Path $data | Out-Null

function Get-Running {
  if (-not (Test-Path $pidFile)) { return $null }
  $id = Get-Content $pidFile | Select-Object -First 1
  try {
    $p = Get-Process -Id $id -ErrorAction Stop
    if ($p.ProcessName -like 'node*') { return $p }
  } catch {}
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  return $null
}

function Start-Server {
  if (Get-Running) { Write-Host "homedash is already running (pid $((Get-Running).Id)) on http://localhost:$port"; return }
  $env:PORT = $port
  $p = Start-Process -FilePath 'node' -ArgumentList "`"$entry`"" -WorkingDirectory $root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput $outFile -RedirectStandardError $errFile
  Set-Content -Path $pidFile -Value $p.Id -Encoding ascii
  Start-Sleep -Milliseconds 600
  if ($p.HasExited) { Write-Host "homedash failed to start; see data\server-$port.err.txt"; exit 1 }
  Write-Host "homedash started (pid $($p.Id)) on http://localhost:$port"
}

function Stop-Server {
  $p = Get-Running
  if (-not $p) { Write-Host 'homedash is not running'; return }
  Stop-Process -Id $p.Id -Force
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  Write-Host "homedash stopped (pid $($p.Id))"
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
  'run' {
    $env:PORT = $port
    & node $entry
  }
}
