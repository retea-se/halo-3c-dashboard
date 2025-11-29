###############################################################################
# Tailscale Funnel Setup Script - Christmas Wishlist (PowerShell)
###############################################################################
# Detta script konfigurerar Tailscale Funnel från Windows genom att köra
# kommandon på Synology NAS via SSH.
#
# KRAV:
# - SSH-nycklar måste vara konfigurerade för Synology
# - Tailscale måste vara installerat på Synology
# - Funnel måste vara aktiverat i Tailscale Admin Console
#
# ANVÄNDNING:
#   .\setup-wishlist-funnel.ps1           # Aktivera Funnel
#   .\setup-wishlist-funnel.ps1 -Stop     # Stoppa Funnel
#   .\setup-wishlist-funnel.ps1 -Status   # Visa status
#
###############################################################################

param(
    [switch]$Stop,
    [switch]$Status
)

# Konfiguration
$SynologyHost = "REDACTED_SERVER_IP"
$SynologyUser = "REDACTED_USERNAME"
$SynologyPort = 22
$TailscaleBin = "/volume1/@appstore/Tailscale/bin/tailscale"
$WishlistPort = 4001
$HttpsPort = 443

# Färgkoder
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

# Kör SSH-kommando
function Invoke-SshCommand {
    param(
        [string]$Command,
        [switch]$NoExit
    )

    $sshCmd = "ssh $SynologyUser@$SynologyHost -p $SynologyPort `"$Command`""

    if ($NoExit) {
        $result = Invoke-Expression $sshCmd 2>&1
        return $result
    } else {
        Invoke-Expression $sshCmd
        if ($LASTEXITCODE -ne 0) {
            throw "SSH command failed with exit code $LASTEXITCODE"
        }
    }
}

# Kontrollera SSH-anslutning
function Test-SshConnection {
    Write-Info "Testar SSH-anslutning till Synology..."

    try {
        $result = Invoke-SshCommand -Command "echo 'Connected'" -NoExit
        if ($result -match "Connected") {
            Write-Info "SSH-anslutning OK"
            return $true
        }
    } catch {
        Write-Error-Custom "Kunde inte ansluta via SSH"
        Write-Error-Custom "Kontrollera att SSH-nycklar är konfigurerade"
        Write-Error-Custom "Använd: ssh $SynologyUser@$SynologyHost -p $SynologyPort"
        return $false
    }
}

# Kontrollera Tailscale
function Test-Tailscale {
    Write-Info "Kontrollerar Tailscale på Synology..."

    try {
        $version = Invoke-SshCommand -Command "$TailscaleBin version" -NoExit
        Write-Info "Tailscale version: $version"
        return $true
    } catch {
        Write-Error-Custom "Tailscale hittades inte eller körs inte"
        return $false
    }
}

# Kontrollera om önskelistan körs
function Test-Wishlist {
    Write-Info "Kontrollerar om önskelistan körs på port $WishlistPort..."

    try {
        $result = Invoke-SshCommand -Command "curl -s -f http://localhost:$WishlistPort" -NoExit
        if ($result -match "Julönskelista" -or $result -match "DOCTYPE") {
            Write-Info "Önskelistan är tillgänglig"
            return $true
        }
    } catch {}

    Write-Warn "Önskelistan verkar inte köra på port $WishlistPort"
    Write-Warn "Starta den med: docker-compose up -d"
    return $false
}

# Visa Funnel-status
function Show-FunnelStatus {
    Write-Info "Hämtar Funnel-status..."
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    try {
        $status = Invoke-SshCommand -Command "$TailscaleBin funnel status" -NoExit
        Write-Host $status

        # Extrahera URL
        if ($status -match "(https://[^\s]+)") {
            $url = $matches[1]
            Write-Host ""
            Write-Host "🎄 Önskelistan är publikt tillgänglig på:" -ForegroundColor Green
            Write-Host ""
            Write-Host "  $url" -ForegroundColor Cyan
            Write-Host ""
        }
    } catch {
        Write-Host "Ingen aktiv Funnel-konfiguration" -ForegroundColor Yellow
    }

    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

# Stoppa Funnel
function Stop-Funnel {
    Write-Info "Stoppar Tailscale Funnel och Serve..."

    try {
        Invoke-SshCommand -Command "sudo $TailscaleBin serve reset"
        Write-Info "Funnel och Serve har stoppats"
        Write-Info "Önskelistan är inte längre tillgänglig publikt"
    } catch {
        Write-Error-Custom "Kunde inte stoppa Funnel. Kör eventuellt på Synology direkt."
        Write-Error-Custom "SSH in och kör: sudo $TailscaleBin serve reset"
    }
}

# Sätt upp Funnel
function Start-Funnel {
    Write-Info "Sätter upp Tailscale Funnel..."

    # Steg 1: Konfigurera Serve
    Write-Info "Konfigurerar Tailscale Serve..."
    try {
        Invoke-SshCommand -Command "sudo $TailscaleBin serve reset" -NoExit | Out-Null
        Invoke-SshCommand -Command "sudo $TailscaleBin serve --bg --https $HttpsPort http://localhost:$WishlistPort"
        Write-Info "Serve konfigurerat"
    } catch {
        Write-Error-Custom "Kunde inte konfigurera Serve"
        Write-Error-Custom "Kör scriptet på Synology direkt för mer detaljer"
        return $false
    }

    # Steg 2: Aktivera Funnel
    Write-Info "Aktiverar Funnel för publik åtkomst..."
    try {
        $result = Invoke-SshCommand -Command "sudo $TailscaleBin funnel --bg $HttpsPort" -NoExit
        Write-Host $result

        if ($result -match "not enabled on your tailnet") {
            Write-Error-Custom "Funnel är inte aktiverat i Tailscale Admin Console"
            Write-Host ""
            Write-Host "Aktivera Funnel genom att:" -ForegroundColor Yellow
            Write-Host "1. Besök: https://login.tailscale.com/admin/machines" -ForegroundColor Yellow
            Write-Host "2. Välj din enhet (mittemellan)" -ForegroundColor Yellow
            Write-Host "3. Aktivera 'Funnel' i inställningarna" -ForegroundColor Yellow
            Write-Host ""

            # Extrahera direkt-länk om tillgänglig
            if ($result -match "(https://login.tailscale.com/[^\s]+)") {
                Write-Host "Eller besök direkt: $($matches[1])" -ForegroundColor Cyan
            }
            return $false
        }

        Write-Info "Funnel aktiverat!"
        return $true
    } catch {
        Write-Error-Custom "Kunde inte aktivera Funnel"
        return $false
    }
}

# Huvudfunktion
function Main {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║     Tailscale Funnel Setup - Christmas Wishlist 🎄         ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    # Kontrollera SSH
    if (-not (Test-SshConnection)) {
        exit 1
    }

    # Om Status-flagga
    if ($Status) {
        Show-FunnelStatus
        exit 0
    }

    # Om Stop-flagga
    if ($Stop) {
        Stop-Funnel
        exit 0
    }

    # Kör alla kontroller
    if (-not (Test-Tailscale)) {
        exit 1
    }

    if (-not (Test-Wishlist)) {
        $continue = Read-Host "Vill du fortsätta ändå? (y/N)"
        if ($continue -ne "y") {
            exit 1
        }
    }

    Write-Host ""
    Write-Info "Alla kontroller godkända! Sätter upp Funnel..."
    Write-Host ""

    # Sätt upp Funnel
    if (Start-Funnel) {
        Write-Host ""
        Write-Info "Setup komplett!"
        Write-Host ""
        Show-FunnelStatus

        Write-Host ""
        Write-Info "Tips:"
        Write-Host "  - För att stoppa: .\$($MyInvocation.MyCommand.Name) -Stop"
        Write-Host "  - För att se status: .\$($MyInvocation.MyCommand.Name) -Status"
        Write-Host ""
    } else {
        Write-Error-Custom "Setup misslyckades. Se felmeddelanden ovan."
        exit 1
    }
}

# Kör huvudfunktionen
Main
