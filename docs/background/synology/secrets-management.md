# Secrets & Credentials Management Guide

**Version:** 1.0
**Senast uppdaterad:** 2025-11-10
**Författare:** Marcus / Claude Code

## 🔐 Översikt

Detta dokument beskriver hur vi hanterar känslig information (secrets, API-nycklar, lösenord, tokens) på ett säkert sätt i våra projekt.

---

## ⚠️ Grundläggande Principer

### ALDRIG committa secrets till Git

**Dåliga exempel (committa ALDRIG):**
```javascript
// ❌ FARLIGT - Hårdkodade credentials
const API_KEY = "sk_live_abc123xyz789";
const DB_PASSWORD = "mypassword123";
const JWT_SECRET = "supersecret";
```

**Bra exempel:**
```javascript
// ✅ SÄKERT - Läs från environment variables
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
```

### Tre nivåer av hemlighetshållning

1. **Public** - Kan dela öppet (API-URL:er, portnummer, etc.)
2. **Internal** - Internt i organisationen (interna IP:er, interna användare)
3. **Secret** - MÅSTE hållas hemliga (lösenord, API-nycklar, tokens)

---

## 📁 Filstruktur för Secrets

### Setup för varje projekt

```bash
# I projektroten
projektet/
├── .env                 # Lokala secrets (ALDRIG committa)
├── .env.example         # Mall utan riktiga värden (committa)
├── .env.production      # Production secrets (ALDRIG committa)
├── .gitignore          # Måste inkludera .env*
└── docker-compose.yml  # Refererar till .env
```

### 1. Skapa .gitignore

```bash
# I projektroten
cat > .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.development
.env.production
.env.*.local

# Secrets
secrets/
*.key
*.pem
*.p12
*.pfx
credentials.json

# Backup files that might contain data
*.sql
*.dump
backup/
EOF

git add .gitignore
git commit -m "Add .gitignore to protect secrets"
```

### 2. Skapa .env.example (mall)

```bash
# .env.example - Denna FÅR committas
cat > .env.example << 'EOF'
# === DATABASE ===
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_USER=dbuser
DB_PASSWORD=change_me_in_production
DB_NAME=appdb

# === APPLICATION ===
NODE_ENV=development
PORT=4001
APP_SECRET=generate_random_secret_here

# === AUTHENTICATION ===
JWT_SECRET=change_me_in_production
SESSION_SECRET=change_me_in_production

# === THIRD-PARTY APIs ===
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_change_me
SENDGRID_API_KEY=SG.change_me

# === OAUTH ===
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=change_me

# === FEATURE FLAGS ===
ENABLE_DEBUG=false
ENABLE_LOGGING=true
EOF

git add .env.example
git commit -m "Add .env.example template"
```

### 3. Skapa riktig .env (COMMITTA EJ)

```bash
# Kopiera mallen
cp .env.example .env

# Redigera med riktiga värden
nano .env  # eller: code .env

# Sätt restriktiva rättigheter
chmod 600 .env
```

**Exempel på ifylld .env:**
```bash
# .env - COMMITTA ALDRIG DENNA FIL
DATABASE_URL=postgresql://appuser:REDACTED_PASSWORD@db:5432/wishlist_db
DB_HOST=db
DB_PORT=5432
DB_USER=appuser
DB_PASSWORD=REDACTED_PASSWORD
DB_NAME=wishlist_db

NODE_ENV=production
PORT=4001
APP_SECRET=a3f8d92b4e7c1f6a9d2e5b8c4a7f1d3e

JWT_SECRET=9f2d8a5c3e7b1f4d6a9c2e5b8d4f7a1c3e6b9d2f5a8c1e4b7d0a3f6c9e2b5d8a
SESSION_SECRET=c5b8d1a4e7f0c3b6d9a2e5f8c1b4d7a0e3f6c9b2d5a8e1f4c7b0d3a6e9f2c5b8

STRIPE_PUBLIC_KEY=pk_test_51H...
STRIPE_SECRET_KEY=sk_test_51H...
```

---

## 🐳 Docker & Docker Compose Integration

### Ladda .env automatiskt

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    env_file:
      - .env
    environment:
      # Kan också override specifika värden här
      NODE_ENV: ${NODE_ENV:-production}
    ports:
      - "${PORT}:${PORT}"
```

### Alternativ: Explicit environment mapping

```yaml
services:
  app:
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      PORT: ${PORT}
```

---

## 🔑 Nuvarande Credentials Inventory

### Synology NAS

**Plats:** `docs/synology.txt`

```
Användarnamn: REDACTED_USERNAME
Lösenord: REDACTED_PASSWORD
SSH Port: 22
IP: REDACTED_SERVER_IP
```

**⚠️ Säkerhet:**
- Använd SSH-nyckel istället för lösenord (rekommenderat)
- Rotera lösenord var 90:e dag
- Aktivera 2FA i DSM om möjligt

### Tailscale

**Plats:** `docs/synology.txt`

```
Tailnet ID: REDACTED_TAILNET_ID
Client ID: REDACTED_CLIENT_ID
Client secret: REDACTED_TAILSCALE_CLIENT_SECRET
Auth key: REDACTED_TAILSCALE_AUTH_KEY
API Access token: REDACTED_TAILSCALE_API_TOKEN
```

**Användning:**
- **Client ID/Secret:** OAuth-autentisering
- **Auth key:** Automatisk onboarding av nya enheter
- **API Access token:** Programmisk åtkomst till Tailscale API

**Rotation Schedule:**
- [ ] Rotera var 90:e dag
- [ ] Nästa rotation: 2025-02-08

**Hur man roterar Tailscale-nycklar:**
```bash
# 1. Besök Admin Console
open https://login.tailscale.com/admin/settings/keys

# 2. Generera nya nycklar
# Klicka "Generate auth key" eller "Generate API access token"

# 3. Uppdatera docs/synology.txt
code docs/synology.txt

# 4. Uppdatera .env-filer i projekt som använder dem
# (Om några projekt använder Tailscale API)

# 5. Revoke gamla nycklar i Admin Console
# (Efter att ha verifierat att allt fungerar)
```

### Databas Credentials

**Per projekt - Exempel för christmas-wishlist:**

```bash
# I projects/christmas-wishlist/.env
POSTGRES_USER=appuser
POSTGRES_PASSWORD=apppass123
POSTGRES_DB=appdb
```

**Rekommendation för produktion:**
```bash
# Generera starka lösenord
openssl rand -base64 32

# Exempel resultat
POSTGRES_PASSWORD=7f3d8a2c9e1b4f6a0d3e5b8c2a7f1d9e4c6b0d2f5a8e1c4b7d0a3f6c9e2b5d8
```

---

## 🛡️ Secrets Generation Best Practices

### 1. Generera starka secrets

**För JWT/Session secrets (32+ tecken):**
```bash
# Metod 1: OpenSSL
openssl rand -hex 32

# Metod 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Metod 3: Online (använd med försiktighet)
# https://www.random.org/strings/
```

**För API-nycklar med prefix:**
```bash
# Generera base64
openssl rand -base64 24

# Manuellt lägg till prefix
# Resultat: sk_live_abc123XYZ789...
```

### 2. Lösenordspolicy

**Minimikrav:**
- Minst 12 tecken
- Innehåller stora + små bokstäver
- Innehåller siffror
- Innehåller specialtecken

**Bra exempel:**
```
REDACTED_PASSWORD
Tr9$mK!pL2@nQ5wE
```

**Dåliga exempel:**
```
password123
synology2024
admin1234
```

---

## 🔄 Rotation Schedule

### Vad ska roteras och hur ofta?

| Credential Type | Rotation Frequency | Criticality |
|----------------|-------------------|-------------|
| SSH Passwords | 90 dagar | Hög |
| Database Passwords | 90 dagar | Hög |
| JWT Secrets | 180 dagar | Medel |
| API Keys (third-party) | 90 dagar | Hög |
| Tailscale Auth Keys | 90 dagar | Hög |
| OAuth Client Secrets | 180 dagar | Medel |

### Rotation Checklist

```bash
# === VID ROTATION ===

# 1. Generera nytt secret
NEW_SECRET=$(openssl rand -hex 32)

# 2. Uppdatera .env
nano .env  # Byt till NEW_SECRET

# 3. Restart applikation
docker-compose restart

# 4. Testa att allt fungerar
curl http://localhost:PORT/health

# 5. Dokumentera rotation
echo "Rotated JWT_SECRET on $(date)" >> rotation-log.txt

# 6. Revoke gammalt secret (om tillämpligt)
# T.ex. i Tailscale Admin Console
```

---

## 📋 Security Checklist för nya projekt

### Innan första commit:

- [ ] `.gitignore` skapad med alla secret-filer
- [ ] `.env.example` skapad med mallar
- [ ] Riktig `.env` skapad lokalt (ej committad)
- [ ] Kontrollera att `.env` finns i `.gitignore`
- [ ] Kör `git status` - `.env` ska INTE synas

### Test att secrets inte läcker:

```bash
# Kontrollera om secrets finns i Git history
git log --all --full-history --source -- '*/.env'

# Ska returnera tomt! Om inte:
# Secrets har committats - måste tas bort från history

# För att ta bort från history (FARLIGT - gör backup först):
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch **/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

### Deploy till produktion:

- [ ] Production `.env` skapad på Synology
- [ ] Alla secrets genererade med stark entropi
- [ ] Secrets dokumenterade i säker plats (t.ex. `docs/synology.txt`)
- [ ] SSH-nycklar används istället för lösenord
- [ ] Tailscale Funnel aktiverat för publik åtkomst
- [ ] Autentisering implementerad på applikationsnivå
- [ ] Rate limiting konfigurerat

---

## 🚨 Incident Response - Om secrets läcker

### Om du upptäcker att secrets kommittats till Git:

**STEG 1: Omedelbar rotation**
```bash
# 1. Generera nya secrets OMEDELBART
openssl rand -hex 32 > new-secrets.txt

# 2. Uppdatera .env med nya secrets
code .env

# 3. Restart alla tjänster
docker-compose restart

# 4. Revoke läckta credentials (om tredje part, t.ex. Stripe)
```

**STEG 2: Ta bort från Git history**
```bash
# BFG Repo-Cleaner (enklare än filter-branch)
# Download: https://rtyley.github.io/bfg-repo-cleaner/

# Ta bort specifik fil från all history
bfg --delete-files .env

# Ta bort specifika secrets (regex)
bfg --replace-text secrets.txt  # Fil med patterns

# Cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (koordinera med team)
git push --force
```

**STEG 3: Notifiera**
- Informera teamet om rotation
- Dokumentera incidenten
- Uppdatera rotation schedule

### Om secrets läckts till publik repo:

1. **Anta worst case:** Credentials är komprometterade
2. **Rotera ALLT omedelbart** - inte bara det som läckt
3. **Kontrollera åtkomstloggar** för misstänkt aktivitet
4. **Överväg att göra repo private** temporärt
5. **Genomför säkerhetsaudit** av alla projekt

---

## 🔐 Backup & Recovery

### Backup av secrets

**Skapa säker backup:**
```bash
# På Synology
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22

# Samla alla .env-filer
cd /var/services/homes/REDACTED_USERNAME
find projects/ -name ".env" -exec cp {} backups/ \;

# Kryptera backup
tar czf secrets-backup.tar.gz backups/
openssl enc -aes-256-cbc -salt -in secrets-backup.tar.gz -out secrets-backup.tar.gz.enc -k "STARKT_LÖSENORD"

# Ta bort okrypterad version
rm secrets-backup.tar.gz
rm -rf backups/

# Backup är nu: secrets-backup.tar.gz.enc
```

**Återställa från backup:**
```bash
# Dekryptera
openssl enc -aes-256-cbc -d -in secrets-backup.tar.gz.enc -out secrets-backup.tar.gz -k "STARKT_LÖSENORD"

# Extrahera
tar xzf secrets-backup.tar.gz

# Flytta tillbaka .env-filer
# ... (manuellt)
```

### Secrets i `docs/synology.txt`

**Detta dokument innehåller:**
- ✅ Synology admin-lösenord
- ✅ SSH-credentials
- ✅ Tailscale credentials (alla nycklar)

**Säkerhet:**
- Filen är lokal på din dator (inte committad till Git)
- `.gitignore` skyddar `docs/synology.txt` (verifiera!)
- Överväg att kryptera filen om den delas

**Kryptera synology.txt:**
```bash
# Kryptera
openssl enc -aes-256-cbc -salt -in docs/synology.txt -out docs/synology.txt.enc -k "DITT_LÖSENORD"

# Dekryptera när du behöver den
openssl enc -aes-256-cbc -d -in docs/synology.txt.enc -out docs/synology.txt -k "DITT_LÖSENORD"
```

---

## 📚 Best Practices Sammanfattning

### ✅ GÖR:
- Använd environment variables för alla secrets
- Skapa `.env.example` som mall
- Lägg `.env` i `.gitignore`
- Generera starka, slumpmässiga secrets
- Rotera credentials regelbundet
- Använd SSH-nycklar istället för lösenord
- Kryptera backups av secrets
- Dokumentera rotation-datum

### ❌ GÖR INTE:
- Committa secrets till Git
- Hårdkoda API-nycklar i kod
- Dela secrets via email eller Slack
- Använd svaga lösenord (password123)
- Återanvänd samma secret för flera tjänster
- Lämna secrets i logs
- Exponera secrets i felmeddelanden

---

## 🛠️ Tools & Resources

### Secrets Generation
```bash
# OpenSSL (finns på de flesta system)
openssl rand -hex 32
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```

### Secrets Scanning Tools

**1. git-secrets (AWS)**
```bash
# Installera
brew install git-secrets  # macOS
# eller: https://github.com/awslabs/git-secrets

# Setup
git secrets --install
git secrets --register-aws  # För AWS keys

# Scan
git secrets --scan
```

**2. truffleHog**
```bash
# Installera
pip install truffleHog

# Scan repository
trufflehog --regex --entropy=True .
```

**3. GitGuardian (Online)**
- https://www.gitguardian.com/
- Automatisk scanning av public repos

### Password Managers (för personliga credentials)

- **1Password** - Team-delning
- **Bitwarden** - Open source
- **KeePassXC** - Offline, gratis

---

## 📞 Support

### Frågor om denna guide?
1. Läs igenom guiden noggrant
2. Kolla `docs/tailscale-deployment-guide.md` för deployment
3. Se `docs/tailscale-funnel-poc.md` för POC-detaljer

### Upptäckte läcka secrets?
1. Följ "Incident Response" ovan
2. Dokumentera incidenten
3. Uppdatera rutiner för att förhindra upprepning

---

**Skapad:** 2025-11-10
**Senast uppdaterad:** 2025-11-10
**Version:** 1.0
**Författare:** Marcus / Claude Code
