# Port-översikt - Mittemellan

## System-portar (Upptagna)

| Port | Tjänst | URL | Användning |
|------|--------|-----|------------|
| 22 | SSH | - | SSH-åtkomst till servern |
| 5000 | DSM | http://REDACTED_SERVER_IP:5000 | Synology web-gränssnitt |

## Utvecklingsportar (Templates)

| Port | Template | URL | Status |
|------|----------|-----|--------|
| 3000 | nodejs-react | http://REDACTED_SERVER_IP:3000 | Tillgänglig |
| 3001 | nodejs-express | http://REDACTED_SERVER_IP:3001 | Tillgänglig |
| 5001 | python-flask | http://REDACTED_SERVER_IP:5001 | Tillgänglig |
| 8080 | static-nginx | http://REDACTED_SERVER_IP:8080 | Tillgänglig |

## Port-konflikter lösta

### Flask: 5000 → 5001
**Problem:** DSM använder port 5000 för web-gränssnitt
**Lösning:** Flask template ändrad till port 5001
**Datum:** 2025-11-09
**Git commit:** 00513d2

## Rekommenderade portar för nya projekt

För att undvika konflikter, använd dessa portar för nya projekt:

| Port-område | Användning | Exempel |
|-------------|------------|---------|
| 3000-3099 | Node.js/React/Vue | 3000, 3001, 3002... |
| 5001-5099 | Python (Flask/Django) | 5001, 5002, 5003... |
| 8080-8099 | Webservrar (nginx/Apache) | 8080, 8081, 8082... |
| 9000-9099 | Databaser/Utilities | 9000, 9001... |

## Undvik dessa portar

| Port | Varför |
|------|--------|
| 22 | SSH |
| 80 | HTTP (ofta reserverad) |
| 443 | HTTPS (ofta reserverad) |
| 5000 | DSM web-gränssnitt |
| 5432 | PostgreSQL (om installerad) |
| 3306 | MySQL/MariaDB (om installerad) |
| 6379 | Redis (om installerad) |

## Kolla om port är upptagen

```bash
# Via SSH
ssh REDACTED_USERNAME@REDACTED_SERVER_IP

# Kolla specifik port
netstat -tuln | grep :5000

# Lista alla lyssnande portar
netstat -tuln | grep LISTEN

# Eller med ss
ss -tuln | grep LISTEN
```

## Ändra port i ditt projekt

### docker-compose.yml
```yaml
services:
  web:
    ports:
      - "5001:5000"  # host_port:container_port
```

**Förklaring:**
- `5001` = Port på servern (vad du öppnar i webbläsare)
- `5000` = Port i containern (behöver oftast inte ändras)

### Exempel: Byt Flask från 5001 till 5002
```yaml
services:
  web:
    ports:
      - "5002:5000"  # Ändra bara första siffran
```

URL blir då: http://REDACTED_SERVER_IP:5002

## Port-forwarding för flera projekt

Om du kör flera projekt samtidigt:

```bash
# Projekt 1: Flask API på 5001
cd ~/projects/api-backend
docker-compose up -d  # Använder 5001

# Projekt 2: Flask Admin på 5002
cd ~/projects/admin-panel
# Ändra docker-compose.yml till 5002:5000
docker-compose up -d

# Projekt 3: React frontend på 3000
cd ~/projects/react-frontend
docker-compose up -d  # Använder 3000
```

## Felsökning

### "Port already in use"
**Symptom:**
```
Error: bind: address already in use
```

**Lösning 1:** Hitta vad som använder porten
```bash
netstat -tuln | grep :5000
```

**Lösning 2:** Stoppa befintlig container
```bash
docker ps
docker stop <container_id>
```

**Lösning 3:** Ändra port i docker-compose.yml

### Lista alla körande containers med portar
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```

## Uppdaterad port-tabell (2025-11-09)

| Service | Port | URL | Hot Reload |
|---------|------|-----|------------|
| **System** |
| DSM | 5000 | http://REDACTED_SERVER_IP:5000 | - |
| SSH | 22 | - | - |
| **Templates** |
| Static nginx | 8080 | http://REDACTED_SERVER_IP:8080 | ⚡ Instant |
| React dev | 3000 | http://REDACTED_SERVER_IP:3000 | ✅ Yes |
| Express API | 3001 | http://REDACTED_SERVER_IP:3001 | ✅ Yes (nodemon) |
| Flask app | 5001 | http://REDACTED_SERVER_IP:5001 | ✅ Yes |
| **Projekt** |
| Homey API | 4002 | http://REDACTED_SERVER_IP:4002 | ✅ Yes |
| Matsedel API | 4003 | http://REDACTED_SERVER_IP:4003 | ✅ Yes |
| Matsedel Frontend | 4004 | http://REDACTED_SERVER_IP:4004 | - |

---

**Senast uppdaterad:** 2025-11-09
**Flask port ändrad:** 5000 → 5001 (DSM-konflikt löst)
