# Fullstack Demo - Git Workflow

Guide för att arbeta med fullstack-projektet via Git.

## Status

✅ Git-repository initierat: `/volume1/homes/REDACTED_USERNAME/projects/fullstack-demo/.git/`
✅ Första commit klar: `71c1f75`
✅ Branch: `main`

## Projekt-info

**Repository på servern:** `~/projects/fullstack-demo/`
**Lokal klon:** (skapas nedan)
**Rekommenderad remote:** GitHub/GitLab

## Utvecklingsworkflows

### Workflow 1: VS Code Remote-SSH (REKOMMENDERAT)

**Bäst för:** Alla typer av utveckling, snabbast feedback

**Setup:**
1. Öppna VS Code
2. Tryck F1 → "Remote-SSH: Connect to Host"
3. Välj "Mittemellan" (eller ange `REDACTED_USERNAME@REDACTED_SERVER_IP`)
4. Öppna mapp: `/var/services/homes/REDACTED_USERNAME/projects/fullstack-demo`
5. Installera Git-extension (om inte redan installerat)

**Dagligt arbete:**
```bash
# Allt sker direkt i VS Code Remote-SSH:

# 1. Öppna Source Control (Ctrl+Shift+G)
# 2. Se ändringar
# 3. Stage filer (+)
# 4. Skriv commit message
# 5. Commit (✓)
# 6. Push till remote (om konfigurerad)

# Eller via integrated terminal:
git status
git add src/server.js
git commit -m "Add new endpoint"
git push
```

**Fördelar:**
- ✅ Hot reload fungerar perfekt (nodemon startar om vid save)
- ✅ Direkt feedback
- ✅ Grafiskt Git-gränssnitt
- ✅ Ingen synk-fördröjning
- ✅ Debugging fungerar

---

### Workflow 2: GitHub/GitLab Remote (Backup & Collaboration)

**Bäst för:** Backup, dela kod, CI/CD

#### Steg 1: Skapa GitHub Repository

1. Gå till https://github.com/new
2. Repository name: `fullstack-demo`
3. Beskrivning: "Node.js + PostgreSQL fullstack with Docker"
4. Private/Public: Välj själv
5. **VIKTIGT:** Bocka INTE i "Initialize with README" (vi har redan kod)
6. Klicka "Create repository"

#### Steg 2: Koppla till GitHub

```bash
# SSH till servern
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
cd ~/projects/fullstack-demo

# Lägg till remote
git remote add origin https://github.com/DITT-USERNAME/fullstack-demo.git

# Push första commit
git branch -M main
git push -u origin main
```

**Om du får lösenordsprompt:**
GitHub kräver Personal Access Token (inte lösenord):
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Scope: `repo` (full control)
4. Kopiera token (visas bara en gång!)
5. Använd token som lösenord

**Spara credentials:**
```bash
git config --global credential.helper store
git push  # Ange token, sparas för framtida pushes
```

#### Steg 3: Daglig Git-workflow med remote

```bash
# På servern via SSH eller VS Code Remote-SSH:

# 1. Gör ändringar i kod
vim src/server.js

# 2. Testa lokalt
docker-compose restart app
curl http://localhost:4000/users

# 3. Stage och commit
git add src/server.js
git commit -m "Add PUT endpoint for users"

# 4. Push till GitHub
git push

# 5. (Om du jobbar i team) Pull senaste ändringar
git pull
```

---

### Workflow 3: Lokal Utveckling → Push till Server

**Bäst för:** Om du vill utveckla på Windows lokalt

#### Steg 1: Klona till din dator

```bash
# På din Windows-dator (Git Bash eller PowerShell):
cd C:\Users\marcu\projects
git clone https://github.com/DITT-USERNAME/fullstack-demo.git
cd fullstack-demo
```

#### Steg 2: Utveckla lokalt (valfritt)

**Option A: Med Docker Desktop**
```bash
# Installera Docker Desktop på Windows
docker-compose up --build
# Utveckla, testa lokalt
```

**Option B: Utan Docker**
```bash
# Bara redigera filer utan att köra
# Testa sen på servern
```

#### Steg 3: Push ändringar

```bash
# På din lokala dator:
git add .
git commit -m "Add feature X"
git push origin main
```

#### Steg 4: Pull på servern

```bash
# SSH till servern
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
cd ~/projects/fullstack-demo

# Pull senaste ändringar
git pull

# Restart containers med nya ändringar
docker-compose restart app

# Eller rebuild om Dockerfile ändrats
docker-compose up -d --build
```

---

## Git Best Practices för detta projekt

### Branch-strategi

**För solo-utveckling:**
```bash
main            # Stable, working code
feature/xyz     # New features
fix/bug-name    # Bug fixes
```

**Exempel:**
```bash
# Skapa feature branch
git checkout -b feature/add-authentication

# Gör ändringar...
git add .
git commit -m "Add JWT authentication"

# Merge till main
git checkout main
git merge feature/add-authentication
git push

# Ta bort feature branch
git branch -d feature/add-authentication
```

### Commit Messages

**Bra commits:**
```bash
git commit -m "Add user authentication with JWT"
git commit -m "Fix database connection timeout"
git commit -m "Update API documentation"
git commit -m "Add Docker healthchecks"
```

**Dåliga commits:**
```bash
git commit -m "update"
git commit -m "fix"
git commit -m "stuff"
```

### Vad ska INTE commitas

**.gitignore säkerställer:**
```gitignore
node_modules/     # NPM dependencies (återskapa med npm install)
*.log            # Log-filer
.env             # Secrets och lösenord
.DS_Store        # macOS-filer
```

**Manuellt undvik:**
- ❌ Databas-backuper (stora .sql-filer)
- ❌ Lösenord i kod
- ❌ API-nycklar
- ✅ Använd environment variables istället

---

## Samarbeta med andra (Team workflow)

### Setup för flera utvecklare

**Steg 1:** Ge andra tillgång till GitHub-repo

**Steg 2:** Varje utvecklare klonar:
```bash
git clone https://github.com/DITT-USERNAME/fullstack-demo.git
cd fullstack-demo
```

**Steg 3:** Använd pull requests
```bash
# Utvecklare skapar branch
git checkout -b feature/new-endpoint

# Gör ändringar och push
git push -u origin feature/new-endpoint

# På GitHub: Skapa Pull Request
# Team granskar → Merge till main
```

---

## Användbara Git-kommandon

### Status och historik
```bash
# Se ändringar
git status
git diff
git diff src/server.js

# Se historik
git log
git log --oneline
git log --oneline --graph --all

# Se ändringar i specifik commit
git show 71c1f75
```

### Ångra ändringar
```bash
# Ångra ändringar i fil (ej staged)
git checkout -- src/server.js

# Unstage fil
git reset HEAD src/server.js

# Ångra senaste commit (behåll ändringar)
git reset --soft HEAD~1

# Ångra senaste commit (ta bort ändringar - FARLIGT!)
git reset --hard HEAD~1
```

### Branches
```bash
# Lista branches
git branch
git branch -a  # Inkl. remote branches

# Skapa och byta
git checkout -b feature/new-api

# Byt branch
git checkout main

# Merge branch
git merge feature/new-api

# Ta bort branch
git branch -d feature/new-api
```

### Remote
```bash
# Lista remotes
git remote -v

# Lägg till remote
git remote add origin https://github.com/user/repo.git

# Ändra remote URL
git remote set-url origin https://github.com/user/new-repo.git

# Pull från remote
git pull origin main

# Push till remote
git push origin main
```

---

## Exempel: Komplett feature-utveckling

### Scenario: Lägg till DELETE-endpoint för users

```bash
# 1. Skapa feature branch
git checkout -b feature/delete-user-endpoint

# 2. Redigera kod (i VS Code Remote-SSH)
# Lägg till DELETE /users/:id i src/server.js

# 3. Testa lokalt
docker-compose restart app
curl -X DELETE http://localhost:4000/users/1

# 4. Stage och commit
git add src/server.js
git commit -m "Add DELETE endpoint for users"

# 5. Push till GitHub
git push -u origin feature/delete-user-endpoint

# 6. På GitHub: Skapa Pull Request

# 7. Efter godkännande, merge till main:
git checkout main
git pull  # Hämta merged changes
docker-compose restart app

# 8. Ta bort feature branch
git branch -d feature/delete-user-endpoint
git push origin --delete feature/delete-user-endpoint
```

---

## Docker + Git Tips

### Vad händer vid git pull?

```bash
# Efter git pull av nya ändringar:

# Om bara kod ändrats (src/):
docker-compose restart app  # Snabbt, nodemon laddar om

# Om package.json ändrats:
docker-compose up -d --build  # Bygger om, installerar nya NPM-paket

# Om docker-compose.yml eller Dockerfile ändrats:
docker-compose down
docker-compose up -d --build  # Full rebuild
```

### .dockerignore

Lägg till för snabbare builds:
```dockerignore
node_modules
.git
.gitignore
README.md
.env
*.log
```

---

## CI/CD (Avancerat)

### GitHub Actions exempel

Skapa `.github/workflows/test.yml`:
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          docker-compose up -d
          sleep 10
          curl -f http://localhost:4000/health
          docker-compose down
```

---

## Felsökning

### "Permission denied (publickey)"
**Lösning:** Använd HTTPS istället för SSH:
```bash
git remote set-url origin https://github.com/user/repo.git
```

### "Nothing to commit"
**Orsak:** Inga ändringar eller allt är i .gitignore
```bash
git status  # Visa vad som ignoreras
git add -f filename  # Force-add ignorerad fil
```

### Merge conflicts
```bash
# Vid konflikt:
git status  # Se vilka filer har konflikt
vim conflicted-file.js  # Redigera och fixa konflikt
git add conflicted-file.js
git commit -m "Resolve merge conflict"
```

---

## Sammanfattning

**Bästa workflow för dig:**
1. ✅ Använd VS Code Remote-SSH för daglig utveckling
2. ✅ Push till GitHub för backup och delning
3. ✅ Commit ofta med tydliga meddelanden
4. ✅ Använd branches för nya features
5. ✅ Test lokalt innan push

**Git-status just nu:**
- ✅ Repository initierat
- ✅ Första commit klar (71c1f75)
- ✅ 7 filer versionshanterade
- ⏳ Remote (GitHub) ej konfigurerad än (gör när du är redo)

---

**Nästa steg:** Testa projektet med `docker-compose up --build`!
