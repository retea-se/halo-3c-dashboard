# Quick Start Guide - Mittemellan

Snabbguide för att komma igång med utveckling på din Synology NAS.

## Serverinformation

**Server:** Mittemellan
**IP:** REDACTED_SERVER_IP
**Användare:** REDACTED_USERNAME
**Lösenord:** REDACTED_PASSWORD

## 1. Anslut till servern

### SSH (Terminal)
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
```

### VS Code Remote-SSH (REKOMMENDERAT)
1. Installera "Remote - SSH" extension i VS Code
2. Tryck F1 → "Remote-SSH: Connect to Host"
3. Välj "Mittemellan" (om konfigurerad) eller ange `REDACTED_USERNAME@REDACTED_SERVER_IP`
4. Ange lösenord: `REDACTED_PASSWORD`
5. Öppna mapp: `/var/services/homes/REDACTED_USERNAME/projects`

## 2. Fixa Docker-rättigheter (GÖR DETTA FÖRST!)

För att kunna köra Docker utan fel:

1. Öppna DSM: http://REDACTED_SERVER_IP:5000
2. Gå till **Kontrollpanel** → **Användare & Grupper**
3. Välj `REDACTED_USERNAME` → **Redigera**
4. Under **Behörigheter** eller **Applikationer**: Bocka i **Docker**
5. Spara
6. Logga ut och in igen från SSH

**Verifiera:**
```bash
docker --version
docker ps
```

Om du inte får "permission denied" är du klar!

## 3. Välj en template

Du har 4 färdiga templates att välja mellan:

| Template | Stack | Port | Användning |
|----------|-------|------|------------|
| nodejs-react | React | 3000 | Single-page apps, moderna UI:er |
| nodejs-express | Express | 3001 | REST APIs, backends |
| python-flask | Flask | 5000 | Full-stack, data-driven apps |
| static-nginx | HTML/CSS/JS | 8080 | Statiska sidor, portfolios |

## 4. Skapa ditt första projekt

### Exempel: Flask-projekt

```bash
# Anslut till servern
ssh REDACTED_USERNAME@REDACTED_SERVER_IP

# Kopiera template
cp -r ~/projects/templates/python-flask ~/projects/my-first-app

# Gå till projektet
cd ~/projects/my-first-app

# Starta med Docker
docker-compose up --build

# Öppna i webbläsare:
# http://REDACTED_SERVER_IP:5000
```

**Stoppa:** Tryck `Ctrl+C` eller kör `docker-compose down`

## 5. Redigera och utveckla

### Med VS Code Remote-SSH (rekommenderat):
1. Anslut till Mittemellan i VS Code
2. Öppna `/var/services/homes/REDACTED_USERNAME/projects/my-first-app`
3. Redigera filer direkt
4. Spara - ändringar uppdateras automatiskt (hot reload)!

### Med terminal:
```bash
cd ~/projects/my-first-app
vi app.py
# Spara och starta om: docker-compose restart
```

## 6. Använd Git (valfritt men rekommenderat)

```bash
cd ~/projects/my-first-app

# Initiera Git
git init

# Första commit
git add .
git commit -m "Initial commit"

# Koppla till GitHub (om du har ett repo)
git remote add origin https://github.com/dittnamn/my-first-app.git
git push -u origin main
```

## Snabbreferens

### SSH-kommandon
```bash
# Anslut
ssh REDACTED_USERNAME@REDACTED_SERVER_IP

# Kopiera fil till server
scp myfile.txt REDACTED_USERNAME@REDACTED_SERVER_IP:~/projects/

# Kopiera mapp till server
scp -r myfolder REDACTED_USERNAME@REDACTED_SERVER_IP:~/projects/
```

### Docker-kommandon
```bash
# Starta projekt
docker-compose up --build       # Förgrund
docker-compose up -d --build    # Bakgrund

# Stoppa
docker-compose down

# Visa loggar
docker-compose logs -f

# Lista containers
docker ps
```

### Git-kommandon
```bash
git status                      # Se ändringar
git add .                       # Stagea alla filer
git commit -m "Message"         # Commit
git push                        # Push till GitHub
git pull                        # Hämta från GitHub
```

## Viktiga sökvägar

**På servern:**
- Projektkatalog: `~/projects/` eller `/var/services/homes/REDACTED_USERNAME/projects/`
- Templates: `~/projects/templates/`
- Dokumentation: `~/projects/README.md`, `DOCKER_SETUP.md`, `GIT_WORKFLOW.md`

**På din dator:**
- Lokal dokumentation: `C:\Users\marcu\OneDrive\Dokument\_synology_1\mittemellan-docs\`

## Tillgängliga portar

| Service | Port |
|---------|------|
| DSM | 5000 |
| Static nginx | 8080 |
| React dev | 3000 |
| Express API | 3001 |
| Flask app | 5000* |

*Flask kolliderar med DSM - ändra port vid behov

## Exempel workflows

### Skapa React-app
```bash
cp -r ~/projects/templates/nodejs-react ~/projects/my-react-app
cd ~/projects/my-react-app
npx create-react-app .
docker-compose up --build
# http://REDACTED_SERVER_IP:3000
```

### Skapa Express API
```bash
cp -r ~/projects/templates/nodejs-express ~/projects/my-api
cd ~/projects/my-api
docker-compose up --build
# http://REDACTED_SERVER_IP:3001/api/hello
```

### Skapa statisk webbplats
```bash
cp -r ~/projects/templates/static-nginx ~/projects/my-site
cd ~/projects/my-site
# Redigera html/index.html
docker-compose up -d
# http://REDACTED_SERVER_IP:8080
```

## Nästa steg

1. ✅ **Läs dokumentationen:**
   - `01-SSH-ANSLUTNING.md` - SSH och VS Code setup
   - `02-DOCKER-SETUP.md` - Docker-konfiguration och kommandon
   - `03-PROJEKTKATALOG.md` - Templates och projektstruktur
   - `04-GIT-WORKFLOW.md` - Git best practices

2. ✅ **Experimentera:**
   - Prova alla 4 templates
   - Redigera och se live-uppdateringar
   - Lär dig Docker och Git kommandon

3. ✅ **Bygg något riktigt:**
   - Välj en idé
   - Skapa från template
   - Utveckla steg för steg
   - Versionskontrollera med Git
   - Pusha till GitHub

## Felsökning

**Problem:** "Permission denied" när du kör docker
**Lösning:** Fixa Docker-rättigheter (steg 2 ovan)

**Problem:** Port redan används
**Lösning:** Ändra port i `docker-compose.yml`

**Problem:** Kan inte ansluta via SSH
**Lösning:** Kontrollera IP (REDACTED_SERVER_IP) och att SSH är aktiverat i DSM

**Problem:** Hot reload fungerar inte
**Lösning:** Använd VS Code Remote-SSH istället för lokal redigering

## Support

**Dokumentation på servern:**
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
cat ~/projects/README.md
```

**DSM:**
http://REDACTED_SERVER_IP:5000

**Lokal dokumentation:**
`C:\Users\marcu\OneDrive\Dokument\_synology_1\mittemellan-docs\`

---

**Lycka till med utvecklingen! 🚀**

**Tips:** Börja med `static-nginx` för att bekanta dig med workflow, sedan gå vidare till Flask eller Express för dynamiska appar.
