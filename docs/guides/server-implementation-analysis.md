# Serverimplementeringsanalys - Halo 3C Dashboard (AQI-projekt)

## Sammanfattning

Denna rapport identifierar potentiella problem med att driftsätta Halo 3C Dashboard-projektet på en server och föreslår två lösningar för varje identifierat problem.

---

## Problem 1: CORS-konfiguration hårdkodad för localhost

### Beskrivning

I `src/backend/api/main.py` är CORS-middleware konfigurerad med endast `http://localhost:3000` som tillåten origin:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Detta innebär att frontend på en produktionsserver (t.ex. `https://dashboard.example.com`) kommer att blockeras av webbläsarens CORS-policy och inte kunna kommunicera med backend-API:et.

### Lösning A: Miljövariabelbaserad CORS-konfiguration

Lägg till en miljövariabel `CORS_ORIGINS` i `.env` och läs in den dynamiskt:

```python
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, ...)
```

### Lösning B: Reverse proxy med samma origin

Konfigurera Nginx som reverse proxy så att både frontend och API serveras från samma domän/port. API:et kan då nås via `/api/` prefix utan cross-origin-problem.

---

## Problem 2: Hårdkodad WebSocket-URL i frontend

### Beskrivning

I `src/frontend/src/pages/Dashboard.tsx` är WebSocket-URL:en hårdkodad:

```typescript
ws://localhost:8000/api/events/stream
```

På en produktionsserver kommer detta att misslyckas eftersom klienten försöker ansluta till localhost istället för den faktiska servern.

### Lösning A: Dynamisk URL-konstruktion

Bygg WebSocket-URL:en dynamiskt baserat på `window.location`:

```typescript
const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${wsProtocol}//${window.location.host}/api/events/stream`;
```

### Lösning B: Miljövariabel via Vite

Använd `VITE_WS_URL` miljövariabel som sätts vid byggtid:

```typescript
const wsUrl =
  import.meta.env.VITE_WS_URL || "ws://localhost:8000/api/events/stream";
```

---

## Problem 3: Osäker JWT-nyckel med standardvärde

### Beskrivning

I `src/backend/api/middleware/auth.py` används en osäker standardnyckel:

```python
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
```

Om `JWT_SECRET_KEY` inte sätts i produktionsmiljön blir autentiseringen extremt sårbar för attacker.

### Lösning A: Kräv miljövariabel vid uppstart

Lägg till validering i applikationsstarten som kraschar om nyckeln saknas:

```python
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY must be set in production")
```

### Lösning B: Generera unik nyckel vid första körning

Skapa en startskript som genererar och sparar en säker nyckel om den inte finns:

```python
import secrets
SECRET_KEY = os.getenv("JWT_SECRET_KEY") or secrets.token_urlsafe(32)
```

(Med loggvarning om standardnyckel används)

---

## Problem 4: Halo-sensorns IP-adress är nätverksberoende

### Beskrivning

Halo-sensorn refereras via IP-adress `192.168.0.73` som är specifik för det lokala nätverket. På en extern server kommer denna IP-adress inte vara nåbar om inte servern är på samma nätverk.

### Lösning A: VPN-tunnel till lokalt nätverk

Konfigurera en VPN-anslutning (t.ex. WireGuard eller Tailscale) mellan servern och det lokala nätverket där sensorn finns, så att servern kan nå den interna IP-adressen.

### Lösning B: Lokal collector med remote API

Kör collector-tjänsten lokalt (nära sensorn) och låt den skicka data till en extern InfluxDB/backend via säker anslutning. Detta separerar datainsamling från presentation.

---

## Problem 5: InfluxDB exponerar inte port externt

### Beskrivning

I `docker-compose.yml` är InfluxDB endast tillgänglig internt på Docker-nätverket (`halo-network`) utan extern portmappning. Om collector körs utanför Docker-miljön kan den inte nå databasen.

### Lösning A: Exponera InfluxDB-port med säkerhet

Lägg till portmappning i docker-compose.yml:

```yaml
influxdb:
  ports:
    - "127.0.0.1:8086:8086" # Endast localhost
```

Kombinera med brandväggsregler för att begränsa åtkomst.

### Lösning B: SSH-tunnel för extern åtkomst

Använd SSH port forwarding för att skapa en säker tunnel till InfluxDB:

```bash
ssh -L 8086:localhost:8086 user@server
```

Collector kan då ansluta via `localhost:8086`.

---

## Problem 6: SSL/TLS-certifikat saknas

### Beskrivning

Projektet har ingen SSL/TLS-konfiguration. Alla tjänster kommunicerar över HTTP, vilket är osäkert för produktionsmiljö. WebSocket-anslutningar kräver WSS (WebSocket Secure) om frontend serveras över HTTPS.

### Lösning A: Let's Encrypt med Nginx reverse proxy

Lägg till en Nginx-container som hanterar SSL-terminering:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "443:443"
  volumes:
    - ./certs:/etc/letsencrypt
```

Använd Certbot för automatisk certifikatförnyelse.

### Lösning B: Cloudflare eller Tailscale Funnel

Använd en extern tjänst för SSL-hantering:

- Cloudflare: Proxy som ger HTTPS automatiskt
- Tailscale Funnel: Redan nämnt i projektet, ger HTTPS-åtkomst via Tailscale-nätverket

---

## Problem 7: Känslig information i .env-fil

### Beskrivning

`.env`-filen innehåller känsliga uppgifter i klartext:

- InfluxDB-token: `hSJGr64DgMb0fKq9uHTnWLyjwAecxRZQ`
- Halo-lösenord: `REDACTED_HALO_PASSWORD`

Om denna fil av misstag commitas till Git eller exponeras blir systemet komprometterat.

### Lösning A: Docker secrets eller extern secrets manager

Använd Docker secrets för känsliga värden:

```yaml
secrets:
  influxdb_token:
    file: ./secrets/influxdb_token.txt
services:
  backend:
    secrets:
      - influxdb_token
```

### Lösning B: Miljövariabler via deployment-plattform

Använd plattformens inbyggda secrets-hantering (t.ex. Synology Docker GUI, Portainer, eller CI/CD-verktyg) istället för .env-fil. Ta bort .env från produktion helt.

---

## Problem 8: Frontend API-URL sätts vid byggtid

### Beskrivning

`REACT_APP_API_URL` kompileras in i frontend-bunten vid byggtid. Detta innebär att samma Docker-image inte kan användas i olika miljöer (dev, staging, prod) utan ombyggnad.

### Lösning A: Runtime-konfiguration via window-objekt

Skapa en `config.js` som laddas dynamiskt:

```html
<script src="/config.js"></script>
```

```javascript
window.APP_CONFIG = { apiUrl: "https://api.example.com" };
```

Nginx kan servera olika config.js baserat på miljö.

### Lösning B: Relativa API-anrop med proxy

Använd relativa URL:er (`/api/...`) och låt Nginx proxa till backend. Frontend behöver då ingen hårdkodad URL alls.

---

## Problem 9: Ingen hälsokontroll för beroenden vid uppstart

### Beskrivning

Backend och collector startar utan att verifiera att InfluxDB är redo. `depends_on` i Docker Compose garanterar bara att containern startar, inte att tjänsten är tillgänglig.

### Lösning A: Healthcheck med depends_on condition

```yaml
influxdb:
  healthcheck:
    test: ["CMD", "influx", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5

backend:
  depends_on:
    influxdb:
      condition: service_healthy
```

### Lösning B: Retry-logik i applikationen

Implementera exponentiell backoff i InfluxDB-klientkoden:

```python
@retry(stop=stop_after_attempt(10), wait=wait_exponential(multiplier=1, max=60))
def connect_to_influxdb():
    # anslutningslogik
```

---

## Problem 10: Nginx-konfiguration saknas för SPA-routing

### Beskrivning

Frontend är en Single Page Application (SPA) med client-side routing. Standard Nginx-konfiguration returnerar 404 för direktlänkar som `/events` eller `/sensors/temperature`. I `src/frontend/Dockerfile` är custom nginx.conf utkommenterad.

### Lösning A: Aktivera och konfigurera nginx.conf

Skapa `nginx.conf` med SPA-routing:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Avkommentera COPY-raden i Dockerfile.

### Lösning B: Hash-baserad routing

Ändra React Router till HashRouter istället för BrowserRouter:

```typescript
import { HashRouter } from "react-router-dom";
```

URL:er blir då `/#/events` vilket fungerar utan serverkonfiguration.

---

## Problem 11: Demo-autentisering med osäkra standardvärden

### Beskrivning

I `src/backend/api/routes/auth.py` finns demo-inloggning med standardvärden:

- Användarnamn: `admin` (från `DEMO_USERNAME` eller default)
- Lösenord: `admin` (från `DEMO_PASSWORD` eller default)

Detta är en allvarlig säkerhetsrisk om det inte inaktiveras i produktion.

### Lösning A: Inaktivera demo-läge via miljövariabel

```python
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
if not DEMO_MODE:
    raise HTTPException(403, "Demo login disabled")
```

### Lösning B: Tvinga starka credentials

Lägg till validering som kräver att demo-lösenordet är minst 16 tecken och inte är "admin":

```python
if DEMO_PASSWORD == "admin" or len(DEMO_PASSWORD) < 16:
    raise RuntimeError("Secure DEMO_PASSWORD required in production")
```

---

## Problem 12: Loggning och felhantering för produktion

### Beskrivning

Nuvarande loggning är utformad för utveckling. I produktion behövs strukturerad loggning, felspårning och eventuellt integration med övervakningsverktyg.

### Lösning A: Strukturerad JSON-loggning

Konfigurera Python-loggning för JSON-output:

```python
import logging
import json_log_formatter

handler = logging.StreamHandler()
handler.setFormatter(json_log_formatter.JSONFormatter())
```

Detta möjliggör integration med loggaggregeringsverktyg.

### Lösning B: Extern övervakningsintegration

Lägg till Sentry eller liknande för felspårning:

```python
import sentry_sdk
sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"))
```

---

## Sammanfattande prioriteringslista

| Prioritet   | Problem                      | Risk  | Komplexitet |
| ----------- | ---------------------------- | ----- | ----------- |
| **Kritisk** | SSL/TLS saknas               | Hög   | Medel       |
| **Kritisk** | Osäker JWT-nyckel            | Hög   | Låg         |
| **Kritisk** | Känslig info i .env          | Hög   | Medel       |
| **Hög**     | CORS hårdkodad               | Medel | Låg         |
| **Hög**     | WebSocket-URL hårdkodad      | Medel | Låg         |
| **Hög**     | Demo-autentisering osäker    | Medel | Låg         |
| **Medel**   | Halo-sensor nätverksberoende | Medel | Hög         |
| **Medel**   | Frontend API-URL vid byggtid | Låg   | Medel       |
| **Medel**   | Nginx SPA-routing saknas     | Låg   | Låg         |
| **Låg**     | InfluxDB healthcheck         | Låg   | Låg         |
| **Låg**     | Loggning för produktion      | Låg   | Medel       |
| **Låg**     | InfluxDB extern åtkomst      | Låg   | Låg         |

---

## Kritiska filer att granska

- `src/backend/api/main.py` - CORS-konfiguration
- `src/backend/api/middleware/auth.py` - JWT-säkerhet
- `src/backend/api/routes/auth.py` - Demo-autentisering
- `src/frontend/src/pages/Dashboard.tsx` - WebSocket-URL
- `src/frontend/src/services/api.ts` - API-konfiguration
- `docker-compose.yml` - Tjänstekonfiguration
- `.env` - Känsliga uppgifter
- `src/frontend/Dockerfile` - Nginx-konfiguration
