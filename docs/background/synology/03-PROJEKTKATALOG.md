# Projektkatalog på Mittemellan

## Plats på servern

**Bas-katalog:** `/var/services/homes/REDACTED_USERNAME/projects/` eller `~/projects/`

## Katalogstruktur

```
~/projects/
├── README.md              # Huvuddokumentation
├── DOCKER_SETUP.md        # Docker-rättigheter och setup
├── GIT_WORKFLOW.md        # Git workflow guide
├── .git/                  # Git repository (initierat)
└── templates/             # Projekt-templates för olika stackar
    ├── nodejs-react/      # React single-page app
    │   ├── Dockerfile
    │   ├── docker-compose.yml
    │   ├── .gitignore
    │   └── README.md
    ├── nodejs-express/    # Express REST API
    │   ├── Dockerfile
    │   ├── docker-compose.yml
    │   ├── package.json
    │   ├── src/server.js
    │   ├── .gitignore
    │   └── README.md
    ├── python-flask/      # Flask webb-app & API
    │   ├── Dockerfile
    │   ├── docker-compose.yml
    │   ├── app.py
    │   ├── requirements.txt
    │   ├── .gitignore
    │   └── README.md
    └── static-nginx/      # Statisk HTML/CSS/JS site
        ├── Dockerfile
        ├── docker-compose.yml
        ├── html/index.html
        ├── .gitignore
        └── README.md
```

## Tillgängliga Templates

### 1. Node.js + React (Frontend SPA)

**Port:** 3000
**Hot reload:** ✅
**Bäst för:** Single-page applications, moderna UI:er
**Plats:** `~/projects/templates/nodejs-react/`

**Snabbstart:**
```bash
# Skapa nytt projekt
cp -r ~/projects/templates/nodejs-react ~/projects/my-react-app
cd ~/projects/my-react-app

# Skapa React-app
npx create-react-app .

# Starta med Docker
docker-compose up --build

# Åtkomst
# http://REDACTED_SERVER_IP:3000
```

**Innehåller:**
- Dockerfile med Node 18
- Docker Compose med hot reload
- .gitignore för Node.js-projekt

---

### 2. Node.js + Express (REST API)

**Port:** 3001
**Hot reload:** ✅ (nodemon)
**Bäst för:** Backend APIs, microservices
**Plats:** `~/projects/templates/nodejs-express/`

**Snabbstart:**
```bash
# Skapa nytt projekt
cp -r ~/projects/templates/nodejs-express ~/projects/my-api
cd ~/projects/my-api

# Starta med Docker
docker-compose up --build

# Testa API
# http://REDACTED_SERVER_IP:3001
# http://REDACTED_SERVER_IP:3001/api/hello
# http://REDACTED_SERVER_IP:3001/api/status
```

**Innehåller:**
- Express server med CORS
- Nodemon för auto-reload
- Exempel API-endpoints
- package.json färdig

---

### 3. Python + Flask (Full-stack)

**Port:** 5001 (ändrad från 5000 pga DSM-konflikt)
**Hot reload:** ✅
**Bäst för:** Full-stack apps, data-driven sites, ML/AI
**Plats:** `~/projects/templates/python-flask/`

**Snabbstart:**
```bash
# Skapa nytt projekt
cp -r ~/projects/templates/python-flask ~/projects/my-flask-app
cd ~/projects/my-flask-app

# Starta med Docker
docker-compose up --build

# Åtkomst
# http://REDACTED_SERVER_IP:5001
# http://REDACTED_SERVER_IP:5001/api/status
```

**Innehåller:**
- Flask 3.0 med debug-läge
- Hello World-sida med CSS
- API-endpoint exempel
- requirements.txt

---

### 4. Static Nginx (HTML/CSS/JS)

**Port:** 8080
**Hot reload:** ⚡ (instant)
**Bäst för:** Landing pages, portfolios, dokumentation
**Plats:** `~/projects/templates/static-nginx/`

**Snabbstart:**
```bash
# Skapa nytt projekt
cp -r ~/projects/templates/static-nginx ~/projects/my-website
cd ~/projects/my-website

# Redigera html/index.html
vi html/index.html

# Starta med Docker
docker-compose up -d

# Åtkomst
# http://REDACTED_SERVER_IP:8080
```

**Innehåller:**
- Nginx Alpine image
- Färdig HTML-sida med CSS
- Instant reload vid filändringar

---

## Generella Docker-kommandon

### Starta projekt
```bash
cd ~/projects/mitt-projekt

# Bygg och starta (förgrund)
docker-compose up --build

# Bygg och starta (bakgrund)
docker-compose up -d --build
```

### Hantera körande containers
```bash
# Lista containers
docker-compose ps

# Visa loggar
docker-compose logs
docker-compose logs -f        # Följ loggar live

# Stoppa containers
docker-compose down           # Stoppa och ta bort
docker-compose stop           # Bara stoppa
```

### Avancerat
```bash
# Öppna shell i container
docker-compose exec web sh
docker-compose exec web bash

# Starta om containers
docker-compose restart

# Rebuild utan cache
docker-compose build --no-cache
```

## Utvecklingsworkflow

### Remote Development (REKOMMENDERAT)

1. **Anslut med VS Code Remote-SSH** till Mittemellan
2. **Öppna mapp:** `/var/services/homes/REDACTED_USERNAME/projects/`
3. **Redigera kod** direkt på servern
4. **Docker hot-reload** uppdaterar automatiskt

**Fördelar:**
- Kod körs i rätt miljö direkt
- Autosave fungerar perfekt
- VS Code extensions fungerar
- Ingen synk-problematik

### Lokal Utveckling → Deploy

1. **Utveckla lokalt** på din Windows-dator
2. **Testa lokalt** med Docker Desktop
3. **Kopiera till server:**
   ```bash
   scp -r ./mitt-projekt REDACTED_USERNAME@REDACTED_SERVER_IP:~/projects/
   ```
4. **Starta på servern:**
   ```bash
   ssh REDACTED_USERNAME@REDACTED_SERVER_IP
   cd ~/projects/mitt-projekt
   docker-compose up -d
   ```

## Port-översikt

| Service | Port | Template | Status |
|---------|------|----------|--------|
| DSM | 5000 | System | Upptagen |
| Static nginx | 8080 | static-nginx | Tillgänglig |
| React dev | 3000 | nodejs-react | Tillgänglig |
| Express API | 3001 | nodejs-express | Tillgänglig |
| Flask app | 5001 | python-flask | Tillgänglig (Ändrad från 5000) |

**OBS:** Flask använder port 5001 istället för 5000 för att undvika konflikt med DSM.
**Se:** PORT-ÖVERSIKT.md för detaljerad port-information.

## Skapa nytt projekt från template

### Komplett exempel:

```bash
# 1. Anslut till servern
ssh REDACTED_USERNAME@REDACTED_SERVER_IP

# 2. Kopiera template
cp -r ~/projects/templates/python-flask ~/projects/todo-app

# 3. Gå till projektet
cd ~/projects/todo-app

# 4. Initiera Git (valfritt men rekommenderat)
git init
git add .
git commit -m "Initial commit from Flask template"

# 5. Starta med Docker
docker-compose up --build

# 6. Testa i webbläsare
# http://REDACTED_SERVER_IP:5000

# 7. Stoppa (Ctrl+C i terminalen, eller):
docker-compose down
```

## Git-integration

Projektkatalogen är redan ett Git-repository:

```bash
cd ~/projects
git status
git log --oneline
```

**Commits i katalogen:**
- Initial commit: Dokumentation
- Templates tillagda
- Git workflow guide

**När du skapar nytt projekt:**
```bash
cd ~/projects/mitt-projekt
git init
git add .
git commit -m "Initial commit"
```

Se `GIT_WORKFLOW.md` för mer information.

## Redigera templates

Om du vill ändra i själva templates:

```bash
cd ~/projects/templates/python-flask
vi app.py

# Committa ändringar
cd ~/projects
git add templates/python-flask/app.py
git commit -m "Update Flask template"
```

## Felsökning

### Port redan används
**Symptom:** "port is already allocated"
**Fix:** Ändra port i `docker-compose.yml`:
```yaml
ports:
  - "5001:5000"  # Ändra från 5000 till 5001
```

### Hot reload fungerar inte
**Fix:** Kontrollera volumes i `docker-compose.yml`:
```yaml
volumes:
  - ./src:/app/src
```

### Kan inte köra docker-compose
**Fix:** Se `02-DOCKER-SETUP.md` för rättigheter

### Projektet startar inte
**Fix:** Visa loggar:
```bash
docker-compose logs
```

## Nästa steg

1. ✅ Fixa Docker-rättigheter (se DOCKER_SETUP.md)
2. ✅ Välj en template
3. ✅ Skapa ditt första projekt
4. ✅ Initiera Git för projektet
5. ✅ Push till GitHub (valfritt)

---

**Alla filer på servern:**
- `/var/services/homes/REDACTED_USERNAME/projects/README.md`
- `/var/services/homes/REDACTED_USERNAME/projects/DOCKER_SETUP.md`
- `/var/services/homes/REDACTED_USERNAME/projects/GIT_WORKFLOW.md`

**Lokal kopia:** `C:\Users\marcu\OneDrive\Dokument\_synology_1\mittemellan-docs\`
