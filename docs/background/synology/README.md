# Mittemellan - Utvecklingsdokumentation

Komplett dokumentation för webbutveckling på din Synology NAS (Mittemellan).

## Innehåll

📖 **[00-QUICK-START.md](00-QUICK-START.md)** - Börja här!
Snabbguide för att komma igång direkt. Anslut, starta första projektet, och börja utveckla.

🔐 **[01-SSH-ANSLUTNING.md](01-SSH-ANSLUTNING.md)** - SSH & Remote-SSH
Server-info, SSH-kommandon, VS Code Remote-SSH setup, och nyckelautentisering.

🐳 **[02-DOCKER-SETUP.md](02-DOCKER-SETUP.md)** - Docker-konfiguration
Fixa Docker-rättigheter, grundläggande kommandon, och felsökning.

📁 **[03-PROJEKTKATALOG.md](03-PROJEKTKATALOG.md)** - Templates & Projekt
Katalogstruktur, 4 färdiga templates, och projektworkflow.

📝 **[04-GIT-WORKFLOW.md](04-GIT-WORKFLOW.md)** - Git & Versionskontroll
Git-kommandon, best practices, GitHub-integration, och felsökning.

🌐 **[PORT-ÖVERSIKT.md](PORT-ÖVERSIKT.md)** - Port-hantering
Alla portar, konflikter, och hur man ändrar portar.

🚀 **[FULLSTACK-DEMO.md](FULLSTACK-DEMO.md)** - Fullstack-projekt
Node.js + PostgreSQL med Docker-nätverk, volymer, och databas-integration.

📦 **[FULLSTACK-GIT-WORKFLOW.md](FULLSTACK-GIT-WORKFLOW.md)** - Fullstack Git-workflow
Git-workflow för fullstack-projektet, VS Code Remote-SSH, och samarbete.

## Serveröversikt

**Namn:** Mittemellan
**IP:** REDACTED_SERVER_IP
**SSH:** `ssh REDACTED_USERNAME@REDACTED_SERVER_IP`
**DSM:** http://REDACTED_SERVER_IP:5000

## Snabbstart (3 steg)

```bash
# 1. Anslut
ssh REDACTED_USERNAME@REDACTED_SERVER_IP

# 2. Skapa projekt från template
cp -r ~/projects/templates/python-flask ~/projects/my-app
cd ~/projects/my-app

# 3. Starta
docker-compose up --build
# → http://REDACTED_SERVER_IP:5000
```

## Vad har vi byggt?

### På servern (Mittemellan)
```
~/projects/
├── README.md              # Huvuddokumentation
├── DOCKER_SETUP.md        # Docker-guide
├── GIT_WORKFLOW.md        # Git-guide
├── .git/                  # Git repository (3 commits)
└── templates/
    ├── nodejs-react/      # React SPA
    ├── nodejs-express/    # Express API
    ├── python-flask/      # Flask webapp
    └── static-nginx/      # Static HTML
```

### På din dator (Lokal backup)
```
C:\Users\marcu\OneDrive\Dokument\_synology_1\
├── synology.txt                    # Original info
└── mittemellan-docs/
    ├── README.md                   # Denna fil
    ├── 00-QUICK-START.md
    ├── 01-SSH-ANSLUTNING.md
    ├── 02-DOCKER-SETUP.md
    ├── 03-PROJEKTKATALOG.md
    └── 04-GIT-WORKFLOW.md
```

## Tillgängliga Templates

| Template | Stack | Port | Användning |
|----------|-------|------|------------|
| **nodejs-react** | React + Node 18 | 3000 | Single-page apps, moderna UI:er |
| **nodejs-express** | Express + Nodemon | 3001 | REST APIs, microservices |
| **python-flask** | Flask 3.0 | 5001 | Full-stack, data-driven apps, ML/AI |
| **static-nginx** | Nginx Alpine | 8080 | Landing pages, portfolios, docs |

Alla templates inkluderar:
- ✅ Dockerfile
- ✅ docker-compose.yml med hot reload
- ✅ .gitignore
- ✅ README med instruktioner

## Teknisk Setup

### Git
- ✅ Installerat (version 2.39.1)
- ✅ Konfigurerat (Marcus / REDACTED_USERNAME@mittemellan.local)
- ✅ Repository initierat i ~/projects/

### Docker
- ✅ Installerat (version 20.10.3)
- ⚠️ Kräver rättigheter (se 02-DOCKER-SETUP.md)

### Python
- ✅ Python 3.8.12 tillgängligt

### Portar
| Service | Port | Status |
|---------|------|--------|
| DSM | 5000 | Upptagen |
| Templates | 3000, 3001, 5001, 8080 | Tillgängliga |

**OBS:** Flask port ändrad från 5000 till 5001 (DSM-konflikt)

## Utvecklingsworkflow

### Rekommenderad (Remote Development)
1. **Anslut** med VS Code Remote-SSH
2. **Öppna** `/var/services/homes/REDACTED_USERNAME/projects/`
3. **Redigera** kod direkt på servern
4. **Hot reload** uppdaterar automatiskt
5. **Commit** med Git
6. **Push** till GitHub

### Alternativ (Lokal → Deploy)
1. **Utveckla** lokalt
2. **Testa** med Docker Desktop
3. **SCP** till servern
4. **Starta** på servern

## Vad ska göras härnäst?

### Obligatoriskt
1. ⚠️ **Fixa Docker-rättigheter** - Se 02-DOCKER-SETUP.md, Lösning 1
   - Gå till DSM → Kontrollpanel → Användare & Grupper
   - Ge `REDACTED_USERNAME` Docker-behörighet

### Rekommenderat
2. **Testa alla templates** - Bekanta dig med varje stack
3. **Konfigurera VS Code Remote-SSH** - För bästa utvecklingsupplevelse
4. **Skapa GitHub-konto** (om du inte har) - För remote backup

### Valfritt
5. **Konfigurera SSH-nyckel** - För passwordless login
6. **Installera Git Server-paketet** - För lokal Git-server
7. **Sätt upp reverse proxy** - För produktion till internet

## Användbara kommandon

### SSH
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
```

### Docker
```bash
docker-compose up --build    # Starta
docker-compose down          # Stoppa
docker-compose logs -f       # Loggar
docker ps                    # Lista containers
```

### Git
```bash
git status                   # Status
git add .                    # Stagea
git commit -m "Message"      # Commit
git push                     # Push
```

### Navigera på servern
```bash
cd ~/projects                # Projektkatalog
cd ~/projects/templates      # Templates
ls -la                       # Lista filer
```

## Felsökning

**Problem:** "Permission denied" när du kör docker
→ Fixa Docker-rättigheter: 02-DOCKER-SETUP.md

**Problem:** Port redan används
→ Ändra port i docker-compose.yml

**Problem:** Hot reload fungerar inte
→ Använd VS Code Remote-SSH

**Problem:** Kan inte ansluta
→ Kontrollera IP och SSH-tjänst i DSM

## Resurser

### På servern
```bash
cat ~/projects/README.md
cat ~/projects/DOCKER_SETUP.md
cat ~/projects/GIT_WORKFLOW.md
```

### DSM Web-gränssnitt
http://REDACTED_SERVER_IP:5000

### Extern dokumentation
- Docker: https://docs.docker.com/
- Git: https://git-scm.com/doc
- Flask: https://flask.palletsprojects.com/
- React: https://react.dev/
- Express: https://expressjs.com/

## Vad vi gjorde idag (2025-11-09)

1. ✅ Testade SSH-anslutning till Mittemellan
2. ✅ Kollade serverstatus (uptime, disk, minne)
3. ✅ Satte upp första webbservern (Python HTTP-server, port 8080)
4. ✅ Diskuterade Docker vs Web Station
5. ✅ Skapade projektkatalog med 4 templates
6. ✅ Installerade och konfigurerade Git
7. ✅ Fixade Docker-rättigheter (chmod 666 docker.sock)
8. ✅ Löste Flask port-konflikt (5000 → 5001)
9. ✅ Skapade fullstack-projekt (Node.js + PostgreSQL)
10. ✅ Implementerade Docker-nätverk och volymer
11. ✅ Skapade Git-repository för fullstack-demo
12. ✅ Skapade komplett dokumentation (lokalt + på server)

## Support

För frågor eller problem:
1. Läs relevant dokumentationsfil
2. Kolla felsökningssektionen
3. Använd `git status` / `docker-compose logs` för debug
4. Testa med enklaste template (static-nginx) först

---

**Skapad:** 2025-11-09
**Server:** Mittemellan (DS218+)
**Användare:** REDACTED_USERNAME (Marcus)

**Nästa:** Fixa Docker-rättigheter och skapa ditt första projekt! 🚀
