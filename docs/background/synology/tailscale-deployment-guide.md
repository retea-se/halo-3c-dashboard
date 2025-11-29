# Tailscale Funnel - Deployment Guide
**Version:** 1.0
**Senast uppdaterad:** 2025-11-10
**Författare:** Marcus / Claude Code

## Översikt

Detta dokument beskriver hur du snabbt exponerar applikationer från Synology NAS publikt på internet via Tailscale Funnel. Perfekt för att göra prototyper, demos och interna verktyg tillgängliga utan att öppna portar i brandväggen.

---

## 🎯 Snabbstart - 5 Minuter till Produktion

### Förutsättningar
- ✅ Applikation körs lokalt på Synology
- ✅ SSH-åtkomst till Synology
- ✅ Tailscale installerat på Synology
- ✅ Passwordless sudo konfigurerat (se nedan)

### Steg 1: Identifiera port
```bash
# SSH in på Synology
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22

# Hitta vilken port din app körs på
netstat -tlnp | grep LISTEN

# Testa lokal åtkomst
curl http://localhost:PORT
```

### Steg 2: Aktivera Funnel (en gång per tailnet)
1. Besök: https://login.tailscale.com/admin/machines
2. Välj din enhet: `mittemellan`
3. Klicka på de tre prickarna → "Edit route settings"
4. Aktivera **"Funnel"**

**OBS:** Detta behöver bara göras EN gång för hela tailnet.

### Steg 3: Konfigurera och starta Funnel
```bash
# Exponera din app på HTTPS port 443
sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT

# Exempel: Exponera app på port 4001
sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 4001
```

### Steg 4: Hämta publik URL
```bash
/volume1/@appstore/Tailscale/bin/tailscale funnel status

# Output visar din publika URL:
# https://mittemellan.tail00c71f.ts.net
```

**Klart!** Din app är nu live på internet 🎉

---

## 📋 Detaljerad Setup-Guide

### A. Första gången: Konfigurera Synology

#### 1. Verifiera Tailscale-installation
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22

# Kontrollera version
/volume1/@appstore/Tailscale/bin/tailscale version

# Kontrollera status
/volume1/@appstore/Tailscale/bin/tailscale status
```

**Förväntat resultat:**
```
100.94.213.121  mittemellan          retea-se@    linux   -
100.125.146.86  mackanspc            retea-se@    windows idle
```

#### 2. Konfigurera passwordless sudo
Detta krävs för att kunna köra Tailscale-kommandon utan att ange lösenord varje gång.

```bash
# Skapa sudoers-fil för Tailscale
sudo bash -c 'echo "REDACTED_USERNAME ALL=(ALL) NOPASSWD: /volume1/@appstore/Tailscale/bin/tailscale" > /etc/sudoers.d/tailscale-nopasswd'

# Sätt korrekta rättigheter
sudo chmod 440 /etc/sudoers.d/tailscale-nopasswd

# Verifiera (ska INTE fråga om lösenord)
sudo /volume1/@appstore/Tailscale/bin/tailscale status
```

**Alternativ: Passwordless för alla kommandon**
```bash
sudo bash -c 'echo "REDACTED_USERNAME ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/REDACTED_USERNAME-nopasswd'
sudo chmod 440 /etc/sudoers.d/REDACTED_USERNAME-nopasswd
```

**⚠️ Säkerhet:** Passwordless sudo är säkert i denna miljö eftersom:
- SSH-åtkomst kräver SSH-nyckel (ingen lösenordsinloggning)
- Endast tillgängligt från internt nätverk
- Tailscale tillhandahåller ytterligare säkerhetslager

---

### B. För varje nytt projekt

#### 1. Förbered applikationen

**Docker Compose:**
```yaml
services:
  app:
    ports:
      - "PORT:PORT"  # Välj en unik port (t.ex. 4001, 4002, etc.)
    environment:
      NODE_ENV: production
      PORT: PORT
```

**Starta applikationen:**
```bash
cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN
docker-compose up -d

# Verifiera att den körs
docker-compose ps
docker-compose logs
```

**Testa lokal åtkomst:**
```bash
curl http://localhost:PORT
# Eller från Windows:
curl http://REDACTED_SERVER_IP:PORT
```

#### 2. Exponera via Funnel

**Metod 1: Från Synology (SSH)**
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22

# Exponera på HTTPS
sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT

# Hämta URL
/volume1/@appstore/Tailscale/bin/tailscale funnel status
```

**Metod 2: Från Windows (Remote)**
```bash
# Enkelt one-liner
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT && /volume1/@appstore/Tailscale/bin/tailscale funnel status"
```

**Metod 3: Automation-script**
```bash
# Skapa ett deploy-script för projektet
cat > deploy.sh << 'EOF'
#!/bin/bash
PORT=4001  # Ändra till din port
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "
  cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN &&
  docker-compose up -d &&
  sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 $PORT &&
  /volume1/@appstore/Tailscale/bin/tailscale funnel status
"
EOF

chmod +x deploy.sh
./deploy.sh
```

#### 3. Verifiera deployment

```bash
# Kontrollera Funnel-status
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "/volume1/@appstore/Tailscale/bin/tailscale funnel status"

# Testa från internet (från Windows eller valfri enhet)
curl https://mittemellan.tail00c71f.ts.net

# Eller öppna i webbläsare
start https://mittemellan.tail00c71f.ts.net
```

---

## 🔄 Hantera flera projekt samtidigt

### Problem: Endast EN port kan exponeras via Funnel åt gången

Tailscale Funnel kan bara exponera EN port (443) samtidigt. För att hantera flera projekt finns det två strategier:

### Lösning 1: Använd path-baserad routing med reverse proxy

**Sätt upp Nginx som reverse proxy:**
```nginx
# /etc/nginx/sites-available/projects
server {
    listen 8080;

    location /projekt1/ {
        proxy_pass http://localhost:4001/;
    }

    location /projekt2/ {
        proxy_pass http://localhost:4002/;
    }

    location /projekt3/ {
        proxy_pass http://localhost:4003/;
    }
}
```

**Exponera Nginx via Funnel:**
```bash
sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 8080
```

**Resultat:**
- https://mittemellan.tail00c71f.ts.net/projekt1/
- https://mittemellan.tail00c71f.ts.net/projekt2/
- https://mittemellan.tail00c71f.ts.net/projekt3/

### Lösning 2: Byt projekt dynamiskt

**Script för att byta aktivt projekt:**
```bash
#!/bin/bash
# switch-project.sh

PROJECT_NAME=$1
PROJECT_PORT=$2

if [ -z "$PROJECT_NAME" ] || [ -z "$PROJECT_PORT" ]; then
    echo "Usage: ./switch-project.sh PROJECT_NAME PORT"
    exit 1
fi

ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "
    echo 'Stopping current Funnel...'
    sudo /volume1/@appstore/Tailscale/bin/tailscale funnel reset

    echo 'Starting Funnel for $PROJECT_NAME on port $PROJECT_PORT...'
    sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 $PROJECT_PORT

    echo 'Status:'
    /volume1/@appstore/Tailscale/bin/tailscale funnel status
"
```

**Användning:**
```bash
chmod +x switch-project.sh

# Aktivera önskelistan
./switch-project.sh christmas-wishlist 4001

# Byt till ett annat projekt
./switch-project.sh todo-app 4002
```

---

## 🔐 Säkerhet & Best Practices

### 1. Secrets & Environment Variables

**PROBLEM:** Känslig data i kod/config

**LÖSNING:** Använd `.env`-filer som ALDRIG committas till Git

**Setup för varje projekt:**

```bash
# I projektroten
touch .env

# Lägg till i .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Lägg till secrets i .env
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:password@db:5432/dbname
JWT_SECRET=din_hemliga_nyckel_här
API_KEY=din_api_nyckel
STRIPE_SECRET_KEY=sk_test_...
EOF

# Sätt korrekta rättigheter
chmod 600 .env
```

**Skapa en mall (`.env.example`):**
```bash
# .env.example - Committa denna till Git
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=change_me_in_production
API_KEY=your_api_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_key
```

**Docker Compose integration:**
```yaml
services:
  app:
    env_file:
      - .env
    environment:
      NODE_ENV: production
```

### 2. Tailscale Credentials Management

**Nuvarande credentials (dokumenterade i `docs/synology.txt`):**
```
Tailnet ID: REDACTED_TAILNET_ID
Client ID: REDACTED_CLIENT_ID
Client secret: REDACTED_TAILSCALE_CLIENT_SECRET
Auth key: REDACTED_TAILSCALE_AUTH_KEY
API Access token: REDACTED_TAILSCALE_API_TOKEN
```

**⚠️ VIKTIGT:**
- Dessa nycklar ger åtkomst till ditt Tailscale-nätverk
- Committa ALDRIG dessa till Git
- Rotera nycklar regelbundet (var 90:e dag)
- Använd separata nycklar för dev/staging/production

**Hur man roterar nycklar:**
1. Besök: https://login.tailscale.com/admin/settings/keys
2. Generera nya nycklar
3. Uppdatera `docs/synology.txt`
4. Revoke gamla nycklar efter att alla system uppdaterats

### 3. Autentisering för publika applikationer

**När du exponerar via Funnel är appen tillgänglig för ALLA med URL:en!**

**Rekommenderad lösning: Basic Auth**

**För Node.js/Express:**
```javascript
// middleware/auth.js
const basicAuth = require('express-basic-auth');

const authMiddleware = basicAuth({
    users: {
        'admin': process.env.ADMIN_PASSWORD || 'changeme'
    },
    challenge: true,
    realm: 'Protected Area'
});

module.exports = authMiddleware;

// I din app.js
const authMiddleware = require('./middleware/auth');
app.use(authMiddleware);  // Skydda hela appen
```

**Lägg till i .env:**
```bash
ADMIN_PASSWORD=ditt_starka_lösenord_här
```

**För Nginx (om du använder reverse proxy):**
```nginx
server {
    listen 8080;

    location / {
        auth_basic "Protected Area";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:4001;
    }
}
```

**Generera .htpasswd:**
```bash
# SSH in på Synology
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22

# Installera htpasswd (om inte tillgängligt)
sudo apt-get update && sudo apt-get install apache2-utils

# Skapa lösenordsfil
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

### 4. Rate Limiting

**Förhindra missbruk och DDoS:**

**I Node.js/Express:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuter
    max: 100, // Max 100 requests per IP
    message: 'För många requests från denna IP, försök igen senare.'
});

app.use(limiter);
```

**I Nginx:**
```nginx
# /etc/nginx/nginx.conf
http {
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

    server {
        location / {
            limit_req zone=mylimit burst=20;
            proxy_pass http://localhost:4001;
        }
    }
}
```

### 5. HTTPS & SSL

**Tailscale Funnel hanterar SSL automatiskt!**

✅ Automatiska Let's Encrypt-certifikat
✅ Automatisk förnyelse
✅ A+-grade SSL-konfiguration
✅ HTTP/2 support

**Du behöver INTE:**
- Köpa SSL-certifikat
- Konfigurera certbot
- Hantera cert-förnyelse
- Öppna port 80/443 i brandväggen

---

## 📊 Monitoring & Logging

### Kontrollera Funnel-status
```bash
# Status
/volume1/@appstore/Tailscale/bin/tailscale funnel status

# Detaljerad info
/volume1/@appstore/Tailscale/bin/tailscale status --json

# Logs
/volume1/@appstore/Tailscale/bin/tailscale debug daemon-logs | tail -50
```

### Övervaka applikation
```bash
# Docker logs
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "
    cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN
    docker-compose logs --tail=100 -f
"

# System resources
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "
    docker stats
"
```

### Setup för logging (rekommenderat)

**Lägg till i docker-compose.yml:**
```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🛠️ Troubleshooting

### Problem: Funnel startar inte

**Symptom:** `Serve is not enabled on your tailnet`

**Lösning:**
1. Besök: https://login.tailscale.com/admin/machines
2. Aktivera Funnel för din enhet

---

### Problem: 404 Not Found vid åtkomst

**Möjliga orsaker:**
1. Applikationen körs inte
2. Fel port konfigurerad
3. Applikationen lyssnar på 127.0.0.1 istället för 0.0.0.0

**Lösning:**
```bash
# Kontrollera att appen körs
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "docker-compose ps"

# Testa lokal åtkomst
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "curl http://localhost:PORT"

# Kontrollera att appen lyssnar på rätt interface
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "netstat -tlnp | grep PORT"
```

**Fixa om den lyssnar på 127.0.0.1:**
```javascript
// I din app (Node.js exempel)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on 0.0.0.0:${PORT}`);
});
```

---

### Problem: Connection timeout

**Symptom:** Sidan laddar inte, timeout efter 30 sekunder

**Möjliga orsaker:**
1. Tailscale är inte uppkopplat
2. Firewall blockerar
3. Applikationen är ner

**Lösning:**
```bash
# Kontrollera Tailscale-anslutning
/volume1/@appstore/Tailscale/bin/tailscale status

# Om disconnected, koppla upp igen
sudo /volume1/@appstore/Tailscale/bin/tailscale up

# Kontrollera firewall (om tillämpligt)
sudo iptables -L -n
```

---

### Problem: 502 Bad Gateway

**Symptom:** Nginx-fel "502 Bad Gateway"

**Orsak:** Applikationen är nere eller svarar inte

**Lösning:**
```bash
# Starta om applikationen
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "
    cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN
    docker-compose restart
"

# Kontrollera logs
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "
    cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN
    docker-compose logs --tail=50
"
```

---

### Problem: Passwordless sudo fungerar inte

**Symptom:** Får fortfarande lösenordsprompt vid `sudo tailscale`

**Lösning:**
```bash
# Verifiera att filen finns
ls -la /etc/sudoers.d/tailscale-nopasswd

# Kontrollera innehåll
sudo cat /etc/sudoers.d/tailscale-nopasswd

# Kontrollera rättigheter (ska vara 440)
ls -l /etc/sudoers.d/tailscale-nopasswd

# Skapa på nytt om nödvändigt
sudo bash -c 'echo "REDACTED_USERNAME ALL=(ALL) NOPASSWD: /volume1/@appstore/Tailscale/bin/tailscale" > /etc/sudoers.d/tailscale-nopasswd'
sudo chmod 440 /etc/sudoers.d/tailscale-nopasswd
```

---

## 📝 Checklista för nytt projekt

### Innan deployment:

- [ ] Applikationen fungerar lokalt
- [ ] `.env`-fil skapad med secrets
- [ ] `.env` tillagd i `.gitignore`
- [ ] `.env.example` skapad som mall
- [ ] Docker Compose konfigurerad med unik port
- [ ] Autentisering implementerad (om publik)
- [ ] Rate limiting konfigurerat
- [ ] Logging konfigurerat

### Under deployment:

- [ ] SSH in på Synology
- [ ] Starta applikation med `docker-compose up -d`
- [ ] Testa lokal åtkomst med `curl`
- [ ] Konfigurera Funnel med `tailscale funnel`
- [ ] Hämta publik URL med `tailscale funnel status`
- [ ] Testa publik åtkomst från extern enhet
- [ ] Verifiera autentisering fungerar
- [ ] Kontrollera logs för fel

### Efter deployment:

- [ ] Dokumentera URL i projektet
- [ ] Dela URL med relevanta personer
- [ ] Sätt upp monitoring/alerts (om kritiskt)
- [ ] Schemalägg backup av databas (om tillämpligt)
- [ ] Rotera secrets regelbundet

---

## 🚀 Quick Reference Commands

```bash
# === BASIC OPERATIONS ===

# Starta Funnel
sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT

# Stoppa Funnel
sudo /volume1/@appstore/Tailscale/bin/tailscale funnel reset

# Status
/volume1/@appstore/Tailscale/bin/tailscale funnel status


# === DOCKER OPERATIONS ===

# Starta app
docker-compose up -d

# Stoppa app
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Status
docker-compose ps


# === DEBUGGING ===

# Kontrollera portar
netstat -tlnp | grep LISTEN

# Testa lokal app
curl http://localhost:PORT

# Testa publik app
curl https://mittemellan.tail00c71f.ts.net

# Tailscale debug logs
/volume1/@appstore/Tailscale/bin/tailscale debug daemon-logs


# === ONE-LINERS ===

# Deploy nytt projekt (från Windows)
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT && docker-compose up -d && sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT && /volume1/@appstore/Tailscale/bin/tailscale funnel status"

# Restart app + funnel
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT && docker-compose restart && sleep 5 && sudo /volume1/@appstore/Tailscale/bin/tailscale funnel reset && sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT"
```

---

## 📚 Resurser

### Tailscale
- [Funnel Documentation](https://tailscale.com/kb/1223/funnel)
- [Serve Documentation](https://tailscale.com/kb/1312/serve)
- [API Documentation](https://tailscale.com/api)
- [Admin Console](https://login.tailscale.com/admin/machines)

### Synology
- [DSM Web Interface](http://REDACTED_DS218_IP:5000)
- [SSH Access Guide](docs/synology.txt)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 📞 Support

### Problem med denna guide?
1. Kontrollera `docs/tailscale-funnel-poc.md` för felsökning
2. Se `scripts/README.md` för automation-scripts
3. Konsultera Tailscale-dokumentationen

### Uppdatera denna guide
När du hittar bättre metoder eller lösningar på problem, uppdatera denna guide!

```bash
# Edit guide
code docs/tailscale-deployment-guide.md

# Commit changes
git add docs/tailscale-deployment-guide.md
git commit -m "Update deployment guide with new findings"
```

---

**Skapad:** 2025-11-10
**Senast uppdaterad:** 2025-11-10
**Version:** 1.0
**Författare:** Marcus / Claude Code
