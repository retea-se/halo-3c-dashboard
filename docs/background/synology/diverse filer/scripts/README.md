# Automation Scripts

Denna mapp innehåller automation-script för att hantera Synology NAS och Tailscale Funnel.

## Innehåll

### `setup-wishlist-funnel.sh` (Bash)
Automation-script för att konfigurera Tailscale Funnel direkt på Synology NAS.

**Användning:**
```bash
# SSH in på Synology
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22

# Kopiera scriptet till Synology
scp scripts/setup-wishlist-funnel.sh REDACTED_USERNAME@REDACTED_SERVER_IP:/var/services/homes/REDACTED_USERNAME/

# Kör scriptet
sudo bash setup-wishlist-funnel.sh

# Stoppa Funnel
sudo bash setup-wishlist-funnel.sh stop
```

**Funktioner:**
- ✅ Verifierar Tailscale-installation
- ✅ Kontrollerar anslutning till Tailscale-nätverket
- ✅ Verifierar att önskelistan körs på port 4001
- ✅ Konfigurerar Tailscale Serve
- ✅ Aktiverar Tailscale Funnel
- ✅ Visar publik URL
- ✅ Kan stoppa Funnel

### `flash-esp32.ps1` (PowerShell)
Automatiserar PlatformIO-build/flash i bakgrunden och skickar Windows-notis när jobbet är klart.

**Användning:**
```powershell
# Standard (waveshare firmware → COM3)
.\flash-esp32.ps1 -Action upload -Notify -OpenMonitor

# Endast build
.\flash-esp32.ps1 -Action build

# Annan port/projekt
.\flash-esp32.ps1 -ProjectPath projects\homey\firmware -Port COM4
```

**Funktioner:**
- ✅ Kör PlatformIO i separat process → terminalen blockeras inte
- ✅ Loggar output till `scripts/logs/esp32-flash-*.log`
- ✅ Windows-notis (valfri) vid klart/fel
- ✅ Anpassningsbar port/projekt/action (`build`, `upload`, `uploadfs`)
- ✅ Dödar automatiskt processer som låser vald COM-port innan uppladdning
- ✅ Streamar logg + status till `scripts/logs/flash-status.json` (kan öppnas i viewer)
- ✅ Loggfilen kan tailas live med `Get-Content -Wait scripts\logs\esp32-flash-*.log`
- ✅ `-OpenMonitor` startar `pio device monitor --port <PORT>` i egen terminal efter lyckad upload

### `flash-status-server.ps1` (PowerShell)
Startar ett litet `HttpListener`-UI på `http://localhost:8123` som visar status/logg utan att röra COM-porten.

```powershell
pwsh -NoProfile -File scripts\flash-status-server.ps1
# Öppna sedan http://localhost:8123 i valfri browser
```

- `/status` exponeras som JSON (används av UI:t)
- `/log` visar senaste 200 loggrader (kan ändras med `-LogTailLines`)
- Bra för att följa uppladdning i realtid från soffan/laptop
- Tips: kör servern parallellt med flash-scriptet för visuellt läge (`Start-Job { pwsh ...flash-status-server.ps1 }`)

### `setup-wishlist-funnel.ps1` (PowerShell)
Automation-script för Windows som kör kommandon på Synology via SSH.

**Användning:**
```powershell
# Navigera till script-mappen
cd C:\Users\marcu\OneDrive\Dokument\_synology_1\scripts

# Aktivera Funnel
.\setup-wishlist-funnel.ps1

# Visa status
.\setup-wishlist-funnel.ps1 -Status

# Stoppa Funnel
.\setup-wishlist-funnel.ps1 -Stop
```

**Funktioner:**
- ✅ Testar SSH-anslutning automatiskt
- ✅ Verifierar Tailscale på Synology
- ✅ Kontrollerar att önskelistan körs
- ✅ Konfigurerar Serve och Funnel via SSH
- ✅ Visar publik URL
- ✅ Hanterar fel och guidar användaren

## Krav

### För Bash-script:
- Tailscale installerat på Synology
- Root/sudo-åtkomst på Synology
- Funnel aktiverat i Tailscale Admin Console (engångsinställning)
- Christmas wishlist körs på port 4001

### För PowerShell-script:
- SSH-nycklar konfigurerade för Synology
- SSH-åtkomst från Windows till Synology
- Tailscale installerat på Synology
- Root/sudo-åtkomst på Synology
- Funnel aktiverat i Tailscale Admin Console (engångsinställning)

## Första gången: Aktivera Funnel

Innan du kan använda scripten måste Funnel aktiveras i Tailscale Admin Console:

1. Besök: https://login.tailscale.com/admin/machines
2. Välj din enhet: `mittemellan`
3. Aktivera "Funnel" i inställningarna

Eller använd direkt-länk:
https://login.tailscale.com/f/serve?node=nmSYZYvzF921CNTRL

Detta behöver bara göras en gång per tailnet.

## Felsökning

### "Access denied: watch IPN bus access denied"
- Du måste köra scriptet med sudo/root-rättigheter
- Lösning: `sudo bash setup-wishlist-funnel.sh`

### "Serve is not enabled on your tailnet"
- Funnel är inte aktiverat i Admin Console
- Lösning: Följ instruktionerna ovan för att aktivera Funnel

### "Permission denied (publickey)"
- SSH-nycklar är inte konfigurerade korrekt
- Lösning: Se `docs/synology.txt` för SSH-setup

### "Önskelistan körs inte på port 4001"
- Docker-containern är inte startad
- Lösning:
  ```bash
  cd /var/services/homes/REDACTED_USERNAME/projects/christmas-wishlist
  docker-compose up -d
  ```

## Säkerhet

### Vad scripten gör:
- ✅ Läser Tailscale-konfiguration
- ✅ Kör Tailscale CLI-kommandon
- ✅ Testar lokal nätverksanslutning
- ✅ Konfigurerar Serve/Funnel

### Vad scripten INTE gör:
- ❌ Exponerar känslig information
- ❌ Öppnar portar i brandväggen
- ❌ Ändrar systemkonfiguration
- ❌ Installerar ny mjukvara
- ❌ Raderar data

### Observera:
- Scripten kräver sudo-åtkomst för att köra Tailscale CLI
- Alla ändringar är reversibla med `stop`-kommandot
- Funnel skapar en krypterad tunnel, inte port forwarding

## Se också

- **POC-dokumentation:** `docs/tailscale-funnel-poc.md`
- **Synology-inställningar:** `docs/synology.txt`
- **Tailscale Funnel Docs:** https://tailscale.com/kb/1223/funnel
- **Tailscale CLI Docs:** https://tailscale.com/kb/1080/cli

## Författare

- **Datum:** 2025-11-10
- **Av:** Claude Code
- **Projekt:** Synology Development Workspace
