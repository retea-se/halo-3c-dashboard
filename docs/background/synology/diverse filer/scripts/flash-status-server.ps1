<#
.SYNOPSIS
  Enkel lokal statusvisning för ESP32-flashningar utan att röra COM-porten.

.DESCRIPTION
  Startar en mycket lättviktig HTTP-server (TcpListener) på localhost
  som visar nuvarande status/logg. Kräver inga admin-rättigheter.

  Endpoints:
    GET /        -> HTML-dashboard
    GET /status  -> JSON från `flash-status.json`
    GET /log     -> Senaste 200 raderna från aktiv loggfil
#>
[CmdletBinding()]
param(
    [int]$Port = 8123,
    [string]$StatusFile = "scripts\logs\flash-status.json",
    [int]$LogTailLines = 200
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-StatusPath {
    param([string]$Path)
    $resolved = Resolve-Path -Path $Path -ErrorAction SilentlyContinue
    if ($resolved) { return $resolved.ProviderPath }
    return (Join-Path -Path (Get-Location) -ChildPath $Path)
}

$statusPath = Resolve-StatusPath -Path $StatusFile

function Get-StatusPayload {
    if (-not (Test-Path -Path $statusPath)) {
        return @{
            state = "idle"
            message = "Ingen flash körs just nu"
            updatedAt = (Get-Date).ToString("o")
        }
    }

    try {
        $raw = Get-Content -Path $statusPath -Raw -ErrorAction Stop
        if (-not $raw) {
            throw "Statusfilen är tom."
        }
        return ($raw | ConvertFrom-Json -ErrorAction Stop)
    }
    catch {
        return @{
            state = "error"
            message = "Kunde inte läsa statusfil: $_"
            updatedAt = (Get-Date).ToString("o")
        }
    }
}

function Get-LogText {
    param([int]$Lines = 200)
    $status = Get-StatusPayload
    $logPath = $status.logFile
    if (-not $logPath -or -not (Test-Path -Path $logPath)) {
        return "Ingen logg hittad. Starta en flash först."
    }

    try {
        $content = Get-Content -Path $logPath -Tail $Lines -ErrorAction Stop
        return ($content -join [Environment]::NewLine)
    }
    catch {
        return "Kunde inte läsa loggen: $_"
    }
}

$indexHtml = @'
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <title>ESP32 Flash Status</title>
  <style>
    body { font-family: "Segoe UI", sans-serif; margin: 32px; background: #0f172a; color: #e2e8f0; }
    .card { background: #1e293b; padding: 24px; border-radius: 16px; max-width: 900px; box-shadow: 0 25px 50px -12px rgba(15,23,42,0.5); }
    h1 { margin-top: 0; }
    .status { font-size: 1.1rem; margin-bottom: 16px; line-height: 1.6; }
    pre { background: #0f172a; padding: 16px; border-radius: 12px; max-height: 60vh; overflow-y: auto; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: 600; }
    .badge.running { background: #f59e0b33; color: #fbbf24; }
    .badge.success { background: #22c55e33; color: #4ade80; }
    .badge.error { background: #ef444433; color: #f87171; }
    .badge.idle { background: #38bdf833; color: #7dd3fc; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ESP32 Flash Status</h1>
    <div class="status">
      Status: <span id="state" class="badge idle">Läser...</span><br />
      Senaste rad: <span id="lastLine">-</span><br />
      Projekt: <span id="project">-</span><br />
      Loggfil: <span id="logFile">-</span>
    </div>
    <h2>Logg (senaste 200 raderna)</h2>
    <pre id="log">Ingen data ännu...</pre>
  </div>

  <script>
    async function update() {
      try {
        const statusResp = await fetch('/status');
        const status = await statusResp.json();
        const stateEl = document.getElementById('state');
        stateEl.textContent = status.state ?? 'okänd';
        stateEl.className = 'badge ' + (status.state ?? 'idle');
        document.getElementById('lastLine').textContent = status.lastLine ?? status.message ?? '';
        document.getElementById('project').textContent = status.project ?? '-';
        document.getElementById('logFile').textContent = status.logFile ?? '-';

        const logResp = await fetch('/log');
        const logText = await logResp.text();
        document.getElementById('log').textContent = logText;
      } catch (err) {
        document.getElementById('log').textContent = 'Fel vid hämtning: ' + err;
      }
    }
    update();
    setInterval(update, 2000);
  </script>
</body>
</html>
'@

$listener = [System.Net.Sockets.TcpListener]::Create($Port)
$listener.Start()
Write-Host "ESP32 flash-status server körs på http://localhost:$Port/" -ForegroundColor Green
Write-Host "Tryck Ctrl+C för att stoppa." -ForegroundColor Yellow

function Send-Response {
    param(
        [System.Net.Sockets.TcpClient]$Client,
        [string]$Body,
        [string]$ContentType = "text/plain; charset=utf-8",
        [int]$StatusCode = 200,
        [string]$StatusText = "OK"
    )

    $stream = $Client.GetStream()
    $writer = [System.IO.StreamWriter]::new($stream, [System.Text.Encoding]::UTF8, 1024, $true)
    $writer.NewLine = "`r`n"
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $writer.WriteLine("HTTP/1.1 {0} {1}" -f $StatusCode, $StatusText)
    $writer.WriteLine("Content-Type: {0}" -f $ContentType)
    $writer.WriteLine("Content-Length: {0}" -f $bodyBytes.Length)
    $writer.WriteLine("Cache-Control: no-cache, no-store, must-revalidate")
    $writer.WriteLine("Connection: close")
    $writer.WriteLine()
    $writer.Flush()
    $stream.Write($bodyBytes, 0, $bodyBytes.Length)
    $stream.Flush()
    $writer.Dispose()
    $Client.Close()
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()
            if (-not $requestLine) {
                $client.Close()
                continue
            }
            $parts = $requestLine.Split(" ")
            $path = if ($parts.Length -ge 2) { $parts[1].ToLowerInvariant() } else { "/" }

            while ($reader.ReadLine()) { } # rensa headers

            switch ($path) {
                "/" {
                    Send-Response -Client $client -Body $indexHtml -ContentType "text/html; charset=utf-8"
                }
                "/status" {
                    $payload = (Get-StatusPayload | ConvertTo-Json -Depth 5)
                    Send-Response -Client $client -Body $payload -ContentType "application/json; charset=utf-8"
                }
                "/log" {
                    $logText = Get-LogText -Lines $LogTailLines
                    Send-Response -Client $client -Body $logText -ContentType "text/plain; charset=utf-8"
                }
                default {
                    Send-Response -Client $client -Body "Not Found" -StatusCode 404 -StatusText "Not Found"
                }
            }
        }
        catch {
            try {
                Send-Response -Client $client -Body "Server error: $_" -StatusCode 500 -StatusText "Server Error"
            } catch { }
        }
    }
}
finally {
    $listener.Stop()
}
