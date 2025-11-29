# Quick Reference - Deployment Commands

**⚡ Snabbkommandon för att deploya projekt till produktion via Tailscale Funnel**

---

## 🚀 Deploy Nytt Projekt (One-Liner)

```bash
# Från Windows - Deploy + Aktivera Funnel
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN && docker-compose up -d && sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT && /volume1/@appstore/Tailscale/bin/tailscale funnel status"

# Exempel: Deploy christmas-wishlist på port 4001
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "cd /var/services/homes/REDACTED_USERNAME/projects/christmas-wishlist && docker-compose up -d && sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 4001 && /volume1/@appstore/Tailscale/bin/tailscale funnel status"
```

**Resultat:** Din app är live på `https://mittemellan.tail00c71f.ts.net`

---

## 📋 Common Commands

### Tailscale Funnel

```bash
# Starta Funnel
sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT

# Status
/volume1/@appstore/Tailscale/bin/tailscale funnel status

# Stoppa
sudo /volume1/@appstore/Tailscale/bin/tailscale funnel reset

# Tailscale network status
/volume1/@appstore/Tailscale/bin/tailscale status
```

### Docker Commands

```bash
# Starta
cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN
docker-compose up -d

# Stoppa
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Status
docker-compose ps

# Rebuild
docker-compose up -d --build
```

### Debugging

```bash
# Test lokal app
curl http://localhost:PORT

# Test publik app
curl https://mittemellan.tail00c71f.ts.net

# Check listening ports
netstat -tlnp | grep LISTEN

# Container stats
docker stats

# Tailscale debug logs
/volume1/@appstore/Tailscale/bin/tailscale debug daemon-logs | tail -50
```

---

## 🔄 Deployment Workflow

### 1️⃣ Första gången (Setup)

```bash
# SSH in
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22

# Navigera till projekt
cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN

# Skapa .env
cp .env.example .env
nano .env  # Fyll i riktiga secrets

# Starta
docker-compose up -d

# Verifiera
curl http://localhost:PORT

# Exponera publikt
sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT

# Få URL
/volume1/@appstore/Tailscale/bin/tailscale funnel status
```

### 2️⃣ Uppdatera befintligt projekt

```bash
# SSH in
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22

# Pull senaste koden (om Git)
cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN
git pull

# Rebuild och restart
docker-compose up -d --build

# Funnel körs redan - ingen action behövs
```

### 3️⃣ Byta aktivt projekt (om flera projekt)

```bash
# Stoppa nuvarande Funnel
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "sudo /volume1/@appstore/Tailscale/bin/tailscale funnel reset"

# Starta nytt projekt
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 NEW_PORT && /volume1/@appstore/Tailscale/bin/tailscale funnel status"
```

---

## 🎯 Port Registry

**Använd unika portar för varje projekt:**

| Projekt | Port | Status | URL |
|---------|------|--------|-----|
| christmas-wishlist | 4001 | ✅ Active | https://mittemellan.tail00c71f.ts.net |
| todo-app | 4002 | ⏸️ Standby | - |
| _ditt-projekt_ | 4003 | 📝 Planerat | - |

**Lägg till nya projekt här när de skapas**

---

## 🔐 Secrets Quick Reference

### Generera nya secrets

```bash
# JWT/Session secret (64 hex chars)
openssl rand -hex 32

# API key (base64)
openssl rand -base64 32

# Lösenord (använd password manager eller)
openssl rand -base64 16
```

### Secrets locations

- **Synology credentials:** `docs/synology.txt`
- **Tailscale credentials:** `docs/synology.txt`
- **Project secrets:** `projects/PROJEKT_NAMN/.env`

### Rotation schedule

```bash
# Nästa rotation: 2025-02-08
# - Synology password
# - Tailscale keys
# - Database passwords
```

---

## 🛠️ Troubleshooting One-Liners

```bash
# App startar inte - Check logs
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN && docker-compose logs --tail=50"

# Port occupied - Find what's using it
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "netstat -tlnp | grep :PORT"

# Restart everything
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN && docker-compose restart && sleep 5 && sudo /volume1/@appstore/Tailscale/bin/tailscale funnel reset && sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT"

# Nuclear option - Full rebuild
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22 "cd /var/services/homes/REDACTED_USERNAME/projects/PROJEKT_NAMN && docker-compose down && docker-compose up -d --build && sudo /volume1/@appstore/Tailscale/bin/tailscale funnel --bg --https 443 PORT"
```

---

## 📚 Full Documentation

- **Deployment Guide:** `docs/tailscale-deployment-guide.md`
- **Secrets Management:** `docs/secrets-management.md`
- **POC Report:** `docs/tailscale-funnel-poc.md`
- **SSH Setup:** `docs/synology.txt`

---

**Pro tip:** Spara denna fil som bokmärke. Du kommer använda den ofta! 🚀
