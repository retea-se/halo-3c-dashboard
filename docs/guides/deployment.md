# Deployment Guide - Halo 3C Dashboard

## Översikt

Denna guide beskriver hur man deployar Halo 3C Dashboard på Synology NAS med Docker.

---

## Förutsättningar

- Synology NAS med Docker installerat
- Halo 3C sensor på samma nätverk
- Git (för att klona projektet)
- SSH-åtkomst till Synology NAS

---

## Steg 1: Förbered Miljövariabler

Skapa en `.env` fil i projektroten:

```bash
# InfluxDB Configuration
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_TOKEN=<your-influxdb-token>
INFLUXDB_ORG=halo-org
INFLUXDB_BUCKET=halo-sensors
INFLUXDB_USERNAME=admin
INFLUXDB_PASSWORD=<your-influxdb-password>

# Halo Sensor Configuration
HALO_IP=REDACTED_HALO_IP
HALO_USER=admin
HALO_PASS=<your-halo-password>

# Device Configuration
DEVICE_ID=halo-device-1

# Collector Configuration
COLLECTION_INTERVAL=10

# Frontend Configuration
FRONTEND_PORT=3000
```

**Viktigt:** Se till att INFLUXDB_TOKEN är korrekt - detta krävs för att skriva data.

---

## Steg 2: Bygg Docker Images

```bash
# Bygg backend (API + Collector)
docker-compose build backend collector

# Bygg frontend
docker-compose build frontend
```

---

## Steg 3: Starta Services

```bash
# Starta alla services
docker-compose up -d

# Kontrollera status
docker-compose ps

# Se loggar
docker-compose logs -f
```

### Verifiera att Services Kör

```bash
# Backend health check
curl http://localhost:8000/health

# Frontend (om port exponeras)
curl http://localhost:3000
```

---

## Steg 4: Konfigurera Tailscale Funnel (Frontend)

För att exponera frontend via Tailscale Funnel:

1. **Installera Tailscale på Synology NAS**
2. **Aktivera Funnel:**
   ```bash
   tailscale funnel 3000
   ```
3. **Få Funnel-URL:**
   - Kontrollera Tailscale admin console
   - Notera Funnel-URL (t.ex. `https://your-nas.tailscale-name.ts.net`)

---

## Steg 5: Verifiera Deployment

### Test Collector

```bash
# Kör test-script
python test_collector_docker.py

# Eller kontrollera loggar
docker-compose logs collector --tail 50
```

### Test API

```bash
# Health check
curl http://localhost:8000/health

# System status
curl http://localhost:8000/api/system/status

# Latest sensors
curl http://localhost:8000/api/sensors/latest

# Latest events
curl http://localhost:8000/api/events/latest
```

### Test Frontend

Öppna webbläsare och gå till:
- Lokalt: `http://localhost:3000`
- Externt: Funnel-URL från Tailscale

---

## Troubleshooting

### Collector Startar Inte

**Problem:** Collector container kraschar vid start

**Lösning:**
1. Kontrollera loggar: `docker-compose logs collector`
2. Verifiera HALO_PASS är korrekt i `.env`
3. Verifiera INFLUXDB_TOKEN är korrekt
4. Kontrollera att Halo sensor är tillgänglig: `ping REDACTED_HALO_IP`

### InfluxDB Connection Failed

**Problem:** Backend kan inte ansluta till InfluxDB

**Lösning:**
1. Kontrollera att InfluxDB container kör: `docker-compose ps influxdb`
2. Verifiera INFLUXDB_URL i `.env` (ska vara `http://influxdb:8086`)
3. Kontrollera InfluxDB logs: `docker-compose logs influxdb`

### Inga Sensor Data

**Problem:** Inga sensor data visas i dashboard

**Lösning:**
1. Kontrollera collector loggar: `docker-compose logs collector`
2. Verifiera att collector kan nå Halo sensor
3. Kontrollera InfluxDB data: `docker-compose exec influxdb influx query "from(bucket: \"halo-sensors\") |> range(start: -1h) |> limit(n: 10)"`

### Frontend Kan Inte Nå Backend

**Problem:** Frontend får CORS errors eller kan inte nå API

**Lösning:**
1. Verifiera REACT_APP_API_URL i frontend container
2. Kontrollera CORS settings i `src/backend/api/main.py`
3. Kontrollera nätverkskonfiguration i `docker-compose.yml`

---

## Backup och Restore

### Backup InfluxDB Data

```bash
# Backup InfluxDB volume
docker run --rm \
  -v halo-dashboard_influxdb-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/influxdb-backup.tar.gz /data
```

### Restore InfluxDB Data

```bash
# Restore InfluxDB volume
docker run --rm \
  -v halo-dashboard_influxdb-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/influxdb-backup.tar.gz -C /
```

---

## Uppdateringar

### Uppdatera Kod

```bash
# Pull latest changes
git pull

# Rebuild containers
docker-compose build

# Restart services
docker-compose up -d
```

### Uppdatera En Specifik Service

```bash
# T.ex. uppdatera backend
docker-compose build backend
docker-compose up -d backend
```

---

## Monitoring

### Loggar

```bash
# Alla loggar
docker-compose logs -f

# Specifik service
docker-compose logs -f collector
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Resource Usage

```bash
# Container resource usage
docker stats

# Disk usage
docker system df
```

---

## Stoppa Services

```bash
# Stoppa alla services
docker-compose down

# Stoppa och ta bort volumes (VARNING: Tar bort data!)
docker-compose down -v
```

---

## Produktion Checklista

- [ ] `.env` fil är korrekt konfigurerad
- [ ] INFLUXDB_TOKEN är säker och unik
- [ ] HALO_PASS är säker
- [ ] Alla services startar korrekt
- [ ] Collector samlar data från Halo sensor
- [ ] Data skrivs till InfluxDB
- [ ] Frontend kan nå backend API
- [ ] Tailscale Funnel är konfigurerad (om externt access behövs)
- [ ] Backup-strategi är implementerad
- [ ] Monitoring är på plats

---

**Senast uppdaterad:** 2025-11-30

---

## Produktionsmiljö - Snabbreferens

### Infrastruktur

| Komponent | Plats | Beskrivning |
|-----------|-------|-------------|
| **Produktionsserver** | Synology NAS "mittemellan" | Docker host för alla containers |
| **Tailscale IP** | `100.94.213.121` | Intern Tailscale-adress |
| **Publik URL** | `https://mittemellan.tail00c71f.ts.net/` | Tailscale Funnel-exponerad URL |
| **Utvecklingsmaskin** | Windows PC "mackanspc" | Lokal utveckling och build |

### Portar (Produktion)

| Service | Intern Port | Extern Port | Beskrivning |
|---------|-------------|-------------|-------------|
| Frontend | 80 (nginx) | 3001 | React SPA via Tailscale Funnel |
| Backend API | 8000 | - | FastAPI, endast internt |
| InfluxDB | 8086 | - | Tidsserie-databas, endast internt |

### Deploy till Produktion

**Från utvecklingsmaskinen (Windows):**

```bash
# 1. Bygg Docker images lokalt
cd C:\Users\marcu\OneDrive\Dokument\AQI
docker-compose build --no-cache

# 2. Exportera images till tar-filer
docker save aqi-frontend:latest -o frontend.tar
docker save aqi-backend:latest -o backend.tar
docker save aqi-collector:latest -o collector.tar

# 3. Kopiera till Synology via Tailscale
scp *.tar admin@100.94.213.121:/volume1/docker/aqi/

# 4. SSH till Synology och ladda images
ssh admin@100.94.213.121
cd /volume1/docker/aqi
docker load -i frontend.tar
docker load -i backend.tar
docker load -i collector.tar

# 5. Starta om containers
docker-compose down
docker-compose up -d
```

**Alternativ: Git pull på Synology (om git finns installerat):**

```bash
ssh admin@100.94.213.121
cd /volume1/docker/aqi
git pull origin main
docker-compose build --no-cache
docker-compose down && docker-compose up -d
```

### Tailscale Funnel Setup

Tailscale Funnel exponerar frontend på port 3001 till den publika URL:en.

```bash
# På Synology NAS
tailscale funnel --bg 3001

# Verifiera status
tailscale funnel status
```

### Verifiering efter Deploy

```bash
# 1. Kontrollera att alla containers körs
docker ps --filter "name=halo"

# 2. Testa backend health
curl http://localhost:8000/health

# 3. Testa frontend via publik URL
curl -I https://mittemellan.tail00c71f.ts.net/

# 4. Kontrollera loggar
docker-compose logs --tail 50
```

### Rollback

Vid problem, rulla tillbaka till föregående version:

```bash
# På Synology
cd /volume1/docker/aqi
git checkout <previous-commit-hash>
docker-compose build --no-cache
docker-compose down && docker-compose up -d
```

---

## Viktiga Sökvägar

| Beskrivning | Sökväg |
|-------------|--------|
| Projekt (Windows) | `C:\Users\marcu\OneDrive\Dokument\AQI` |
| Projekt (Synology) | `/volume1/docker/aqi` |
| Docker volumes | `/volume1/docker/aqi/volumes/` |
| InfluxDB data | `influxdb-data` Docker volume |
| Loggar | `docker-compose logs <service>` |


