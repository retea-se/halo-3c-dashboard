# Synology NAS-miljö - Nyckelfakta

## Översikt

Synology NAS (Mittemellan) används som utvecklings- och deployment-miljö för Halo 3C Dashboard.

## Serverinformation

- **Namn:** Mittemellan
- **IP-adress:** REDACTED_SERVER_IP
- **SSH:** `ssh REDACTED_USERNAME@REDACTED_SERVER_IP`
- **DSM:** http://REDACTED_SERVER_IP:5000
- **Model:** DS218+ / DS2188

## Projektstruktur

**Bas-katalog:**

```
/var/services/homes/REDACTED_USERNAME/projects/
```

**Projektmapp:** `~/projects/halo-dashboard/`

## Docker

- **Docker-socket:** `/var/run/docker.sock` (chmod 666)
- **Docker Compose:** Stöds för multi-container setup
- **Nätverk:** Custom Docker networks för isolering

### Docker-konfiguration för Halo Dashboard

**Services:**

- Frontend (React): Port 3000 (exponeras via Tailscale Funnel)
- Backend (FastAPI): Internt nätverk (inga publika portar)
- InfluxDB: Internt nätverk (inga publika portar)
- Collector: Ingen exponering

**Nätverksisolering:**

- Frontend: Endast denna exponeras externt
- Backend API: Endast tillgänglig via Docker network
- InfluxDB: Endast tillgänglig via Docker network

## Tailscale Integration

### Funnel (Publik åtkomst)

Frontend exponeras publikt via Tailscale Funnel:

- **Internt:** http://REDACTED_SERVER_IP:3000
- **Via Tailscale:** http://mittemellan:3000
- **Publik URL:** `https://mittemellan.retea-se-github.ts.net` (när Funnel är aktivt)

### Konfiguration

**Aktivera Funnel:**

```bash
sudo tailscale funnel 3000
```

**Kontrollera status:**

```bash
sudo tailscale funnel status
```

**Stoppa Funnel:**

```bash
sudo tailscale funnel --bg=false 3000
```

## Deployment

### Automatiseringsscripts

**PowerShell (Windows):**

```powershell
cd scripts
.\setup-wishlist-funnel.ps1        # Aktivera Funnel
.\setup-wishlist-funnel.ps1 -Status  # Visa status
.\setup-wishlist-funnel.ps1 -Stop    # Stoppa Funnel
```

**Bash (Linux/Synology):**

```bash
sudo bash scripts/setup-wishlist-funnel.sh
sudo bash scripts/setup-wishlist-funnel.sh stop
```

### Docker Compose Workflow

```bash
# Starta services
docker-compose up -d

# Visa loggar
docker-compose logs -f

# Stoppa services
docker-compose down

# Rebuild och starta
docker-compose up --build -d
```

## Git Workflow

**Repository-lokalisering:**

- Server: `~/projects/halo-dashboard/.git/`
- Remote: GitHub/GitLab (konfigureras separat)

**VS Code Remote-SSH:**

- Anslut till Mittemellan via Remote-SSH
- Öppna mapp: `/var/services/homes/REDACTED_USERNAME/projects/halo-dashboard`
- Utveckla direkt på servern med hot reload

## Port-registry

| Service     | Port      | Exponering       | Användning         |
| ----------- | --------- | ---------------- | ------------------ |
| Frontend    | 3000      | Tailscale Funnel | React SPA          |
| Backend API | (internt) | Docker network   | FastAPI            |
| InfluxDB    | (internt) | Docker network   | Time-series DB     |
| Collector   | (ingen)   | -                | Background service |

## Säkerhet

### Autentisering

- Demo-konto: username/password via env vars
- JWT tokens: Session management
- Ingen magic link: Pga inget SMTP-stöd

### Nätverk

- Frontend: Endast via Tailscale Funnel (HTTPS)
- Backend: Endast internt Docker network
- InfluxDB: Endast internt Docker network

## Data Storage

**InfluxDB:**

- Volym: `/data/influxdb/` (Docker volume)
- Persistering: Automatisk via Docker volumes

**Loggar:**

- Backend logs: `/data/logs/`
- Docker logs: `docker-compose logs`

## Best Practices

1. **Använd Docker Compose** för alla services
2. **Exponera endast frontend** via Tailscale Funnel
3. **Använd Docker networks** för service-isolering
4. **Backup InfluxDB data** regelbundet
5. **Monitor Docker resources** (disk, minne)

## Dokumentation

- **00-QUICK-START.md:** Snabbstart-guide
- **02-DOCKER-SETUP.md:** Docker-konfiguration
- **tailscale-funnel-poc.md:** Funnel-setup
- **PORT-ÖVERSIKT.md:** Port-hantering

---

**Dokumentation skapad:** 2025-01-27

