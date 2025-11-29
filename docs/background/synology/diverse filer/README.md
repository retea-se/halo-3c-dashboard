# Synology Development Workspace

This repository contains projects, configurations, and automation tools for development on Synology NAS with Tailscale integration.

## 📋 Översikt

Detta workspace innehåller:
- **Utvecklingsprojekt** - Fullstack-applikationer som körs på Synology
- **Tailscale Integration** - VPN och Funnel för säker fjärråtkomst
- **Automation Scripts** - PowerShell och Bash för deployment
- **Dokumentation** - Setup-guider och POC-rapporter

## 🎄 Projekt

### Christmas Wishlist
En fullstack julönskelista-applikation med Node.js backend och PostgreSQL databas.

**Tekniker:**
- Node.js + Express
- PostgreSQL 15
- Docker Compose
- Tailscale Funnel (för publik åtkomst)

**Status:** ✅ Aktiv och kan exponeras publikt via Tailscale Funnel

**Lokal åtkomst:**
- Internt nätverk: http://REDACTED_SERVER_IP:4001
- Via Tailscale: http://mittemellan:4001
- Publikt (när Funnel är aktivt): https://mittemellan.retea-se-github.ts.net

**Dokumentation:**
- Se `docs/tailscale-funnel-poc.md` för att exponera publikt
- Se `scripts/` för automation

## 🔧 Automation Scripts

Verktyg för att hantera deployment och Tailscale Funnel:

### Windows (PowerShell)
```powershell
cd scripts
.\setup-wishlist-funnel.ps1        # Aktivera Funnel
.\setup-wishlist-funnel.ps1 -Status  # Visa status
.\setup-wishlist-funnel.ps1 -Stop    # Stoppa Funnel
```

### Linux/Synology (Bash)
```bash
sudo bash scripts/setup-wishlist-funnel.sh
sudo bash scripts/setup-wishlist-funnel.sh stop
```

**Funktioner:**
- ✅ Automatisk kontroll av Tailscale-status
- ✅ Verifiering av applikation
- ✅ Konfiguration av Serve + Funnel
- ✅ Extraherar publik URL
- ✅ Felhantering och guidning

## 📚 Dokumentation

### 🚀 **Quick Start**
**`docs/QUICK-REFERENCE.md`** - Snabbkommandon och one-liners
- Deploy nytt projekt på 1 minut
- Common commands
- Port registry
- Troubleshooting one-liners

### 📖 **Deployment Guide**
**`docs/tailscale-deployment-guide.md`** - Komplett deployment-guide
- Steg-för-steg instruktioner
- Hantera flera projekt
- Secrets management integration
- Best practices
- Felsökning

### 🔐 **Security**
**`docs/secrets-management.md`** - Secrets & credentials hantering
- Environment variables setup
- .env best practices
- Rotation schedule
- Incident response
- Tailscale credentials inventory

### 🔬 **POC Report**
**`docs/tailscale-funnel-poc.md`** - Detaljerad POC-rapport
- Vad som fungerar/inte fungerar
- API-begränsningar
- Säkerhetsöverväganden
- Alternativa lösningar

### ⚙️ **Infrastructure**
**`docs/synology.txt`** - Grundläggande setup
- SSH-konfiguration med nyckelpar
- VS Code Remote-SSH
- Tailscale credentials
- Nätverksinställningar

### 🤖 **Automation**
**`scripts/README.md`** - Automation-script
- Bash & PowerShell scripts
- Användningsinstruktioner
- Felsökning

### 🧠 **MCP‑servrar**
**`docs/MCP_SETUP.md`** - Konfiguration och drift av MCP‑servrar
- chrome‑devtools, github (remote), homey, docker, postgres, fetch
- Krav per server, säkerhet och felsökning
- Exempel på Docker/SSH och klientkonfig

## 🌐 Tailscale Integration

### Tailnet Information
- **Display:** retea-se.github
- **Tailnet ID:** REDACTED_TAILNET_ID
- **Identity Provider:** GitHub (retea-se)

### Anslutna Enheter
- **mittemellan** (Synology DS2188) - 100.94.213.121
- **mackanspc** (Windows) - 100.125.146.86

### Funnel Status
Tailscale Funnel möjliggör publik åtkomst till önskelistan via en krypterad tunnel:
- ✅ End-to-end kryptering (TLS)
- ✅ Automatiska SSL-certifikat
- ✅ Ingen IP-exponering
- ✅ Revocerbar åtkomst

## 🚀 Snabbstart

### 1. Anslut via SSH

**Snabbaste sättet (Windows):**
```powershell
# Dubbelklicka eller kör från PowerShell:
.\scripts\connect-dsv.ps1
```

**Eller via kommandorad:**
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22
# Eller använd alias (om SSH-konfiguration är kopierad till ~/.ssh/):
ssh dsv
```

### 2. Starta önskelistan
```bash
cd /var/services/homes/REDACTED_USERNAME/projects/christmas-wishlist
docker-compose up -d
```

### 3. Exponera publikt (valfritt)
```powershell
# Från Windows
cd C:\Users\marcu\OneDrive\Dokument\_synology_1\scripts
.\setup-wishlist-funnel.ps1
```

### 4. Få publik URL
Scriptet visar URL:en automatiskt:
```
https://mittemellan.retea-se-github.ts.net
```

## 📦 Projektstruktur

```
_synology_1/
├── projects/               # Utvecklingsprojekt
│   └── christmas-wishlist/ # Julönskelista-app
├── scripts/                # Automation-script
│   ├── connect-dsv.ps1    # SSH-anslutning (PowerShell)
│   ├── connect-dsv.bat    # SSH-anslutning (Batch)
│   ├── setup-wishlist-funnel.sh   # Bash-version
│   ├── setup-wishlist-funnel.ps1  # PowerShell-version
│   └── README.md          # Script-dokumentation
├── .ssh/                   # SSH-konfiguration
│   └── config             # Dedikerad SSH-config för workspace
├── docs/                   # Dokumentation
│   ├── CREDENTIALS.md     # Lösenord och sökvägar
│   ├── synology.txt       # Synology setup-guide
│   └── tailscale-funnel-poc.md  # Tailscale POC-rapport
├── archive/               # Äldre dokumentation
└── README.md             # Denna fil
```

## 🔐 Säkerhet

### SSH-åtkomst
- Nyckelbaserad autentisering (RSA 2048-bit)
- Ingen lösenordsinloggning
- Port 22 (internt nätverk endast)

### Tailscale
- Zero-trust nätverksmodell
- End-to-end kryptering
- Device authorization
- Funnel med automatiska SSL-certifikat

### Rekommendationer
- Lägg till autentisering i önskelistan vid publik exponering
- Implementera rate-limiting
- Monitora åtkomstloggar
- Använd Tailscale ACLs för åtkomstkontroll

## 🛠️ Felsökning

### SSH-problem
```bash
# Testa med verbose
ssh -i ~/.ssh/id_rsa REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 -vvv
```

### Docker-problem
```bash
# Kontrollera containers
docker ps -a
docker-compose logs
```

### Tailscale-problem
```bash
# Status
/volume1/@appstore/Tailscale/bin/tailscale status

# Funnel-status
/volume1/@appstore/Tailscale/bin/tailscale funnel status

# Reset
sudo /volume1/@appstore/Tailscale/bin/tailscale serve reset
```

## 📝 Nästa steg

1. ☐ Lägg till autentisering i önskelistan
2. ☐ Implementera session-hantering
3. ☐ Sätt upp monitoring/logging
4. ☐ Konfigurera backup-lösning för databas
5. ☐ Utforska CI/CD för automatisk deployment

## 🔗 Resurser

- [Tailscale Funnel Docs](https://tailscale.com/kb/1223/funnel)
- [Tailscale API](https://tailscale.com/api)
- [Synology DSM](http://REDACTED_DS218_IP:5000)
- [Docker Docs](https://docs.docker.com/)

## Archive

Äldre dokumentation och script har flyttats till `archive/`-mappen.

---

**Författare:** Marcus
**Senast uppdaterad:** 2025-11-10
