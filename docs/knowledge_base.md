# Knowledge Base - Halo 3C Dashboard

## Dataflöde (End-to-End)

### Halo 3C Sensor → Collector → InfluxDB → Dashboard

```
1. Halo 3C Sensor (REDACTED_HALO_IP)
   ├─ HTTP GET /api/config/gstate/latest (varje 5-10 sekunder)
   ├─ Returnerar JSON med alla 43 sensorer
   └─ Event triggers: NOISE, KNOCK, CO2cal, etc.

2. Collector Service (FastAPI backend)
   ├─ Pollar sensor varje 5-10 sekunder
   ├─ Skriver sensorvärden + timestamp → InfluxDB (sensor_data measurement)
   └─ Analyserar värden → Genererar events/alarms → InfluxDB (events measurement)

3. InfluxDB (Time-series database)
   ├─ Sensorhistorik: sensor_data measurement
   │  ├─ Tags: sensor_id, device_id, location
   │  ├─ Fields: value, unit
   │  └─ Timestamp: Automatisk
   └─ Eventhistorik: events measurement
      ├─ Tags: type, severity, status, device_id, location
      ├─ Fields: summary, details (JSON)
      └─ Timestamp: Automatisk

4. Dashboard Backend API (FastAPI)
   ├─ REST endpoints: GET /api/sensors, GET /api/events
   ├─ WebSocket/SSE: WS /api/events/stream (real-time)
   └─ Metadata API: GET /api/sensors/meta, GET /api/sensors/meta/{id}

5. React Frontend (Dashboard UI)
   ├─ HTTPS via Tailscale Funnel (endast frontend exponeras)
   ├─ Konsumerar REST API + WebSocket
   ├─ Visar sensorvärden med tooltips och metadata
   └─ Toast-notifieringar vid nya larm

6. Användare (Webbläsare)
   ├─ Ser sensorvärden i realtid
   ├─ Får toast-notifieringar vid larm
   └─ Kan utforska sensorinfo och FAQ
```

## Begränsningar & Krav

### Nätverk & Säkerhet

- **Frontend:** Endast denna exponeras via Tailscale Funnel (port 3000)
- **Backend API:** Ingen extern exponering - endast Docker network
- **InfluxDB:** Ingen extern exponering - endast Docker network
- **Collector:** Ingen exponering alls

### Autentisering

- **Demo-konto:** Username/password via env vars
- **JWT tokens:** Session management
- **Magic link:** Stöds INTE (pga inget SMTP-stöd på Synology)
- **TOTP:** Struktur för framtida implementering

### Sensor-poling

- **Intervall:** 5-10 sekunder (rekommenderat)
- **Endpoint:** `GET /api/config/gstate/latest` (alla 43 sensorer på en gång)
- **Timeout:** Hantera timeout vid sensorfel
- **Retry-logik:** Implementera exponential backoff

### Databas

- **InfluxDB:** Time-series optimerad för sensordata
- **Events:** Lagras som separat measurement i InfluxDB
- **Retention:** Konfigurerbar (standard: 90 dagar)
- **Backup:** Regelbundna backups av InfluxDB-volymen

### Event-system

- **Event-generering:** Baserat på tröskelvärden och Halo-event-detection
- **Status-hantering:** ACTIVE → ACKNOWLEDGED → RESOLVED
- **Severity:** INFO, WARNING, CRITICAL
- **Real-time:** WebSocket pushar nya events till frontend

### Metadata-system

- **Lagring:** JSON-fil (`src/backend/data/sensor_metadata.json`)
- **AI-generering:** Baserad på dokumentation i `docs/background/halo 3c/SENSORS.md`
- **Uppdateringar:** Version-kontrollerat, enkelt att uppdatera
- **API:** GET /api/sensors/meta (alla), GET /api/sensors/meta/{id} (specifik)

## Sensor-kategorier

### Miljö (5 sensorer)

- Temperatur (°C, °F)
- Luftfuktighet (%)
- Lufttryck (hPa, inHg)
- Ljusnivå (Lux)

### Luftkvalitet (13 sensorer)

- AQI (0-500)
- CO2 (ppm) - kalibrerat och ekvivalent
- TVOC (ppb)
- PM1, PM2.5, PM10 (µg/m³)
- NO2, CO, NH3
- AQI-värden för PM och gaser

### Ljud (11 sensorer)

- Ljudnivå (dB) - sum, l (hög förstärkning), r (låg förstärkning)
- Aggression-detektor
- Skottlossning-detektor
- Nyckelordsdetektion (8 kanaler)

### Rörelse (4 sensorer)

- PIR (passiv infraröd)
- Accelerometer (x, y, z, move)
- Extern ingång
- BLE Beacon

### Hälsoindex (8 sensorer)

- Totalt hälsoindex (0-5)
- Per-sensor hälsoindex (7 st: CO2, Humidity, PM1, PM2.5, PM10, TVOC, NO2)

## Händelsetyper (26 st)

### Grupp 1: Vaping/Smoking

- Vape, THC, Masking, Smoking

### Grupp 4: Säkerhet

- Gunshot, Aggression, Tamper, Help, Motion

### Grupp 8: Luftkvalitet

- Health_Index, AQI, TVOC, CO2cal, PM2.5

### Grupp 16: Miljövarningar

- PM1, PM10, Humidity, Humidity_Low, Temp_C, Temp_C_Low, NO2, CO, NH3, Light, Sound

## Viktiga tröskelvärden

### CO2

- **Optimalt:** <1000 ppm
- **Måttlig:** 1000-1500 ppm
- **Varning:** 1500-2000 ppm
- **Kritiskt:** >2000 ppm

### AQI

- **0-50:** Bra
- **51-100:** Måttlig
- **101-150:** Ohälsosamt för känsliga
- **151-200:** Ohälsosamt
- **201-300:** Mycket ohälsosamt
- **301-500:** Farligt

### Hälsoindex

- **0:** Utmärkt
- **1:** Mycket bra
- **2:** Bra
- **3:** Måttlig
- **4:** Dålig
- **5:** Mycket dålig

## Deployment

### Docker Setup

**Services:**

- Frontend (React): Port 3000
- Backend (FastAPI): Internt nätverk
- InfluxDB: Internt nätverk
- Collector: Bakgrundsservice

**Nätverksisolering:**

- Frontend: Exponeras via Tailscale Funnel
- Övriga: Endast Docker network

### Miljövariabler

**Backend:**

- `HALO_IP`: REDACTED_HALO_IP
- `HALO_USERNAME`: admin
- `HALO_PASSWORD`: (från env)
- `INFLUXDB_URL`: http://influxdb:8086
- `INFLUXDB_TOKEN`: (från env)
- `INFLUXDB_ORG`: halo
- `INFLUXDB_BUCKET`: sensors

**Frontend:**

- `REACT_APP_API_URL`: http://backend:8000 (internt) eller via reverse proxy

## Utvecklingsmiljö

### Lokal utveckling

- Backend: `uvicorn main:app --reload`
- Frontend: `npm start` (hot reload)
- InfluxDB: Docker container

### Docker Compose

- `docker-compose up -d`: Starta alla services
- `docker-compose logs -f`: Följ loggar
- `docker-compose down`: Stoppa services

## Testning

### Backend

- `pytest tests/backend/`: Unit och integrationstester
- Mock Halo client för tester

### Frontend

- `npm test`: Unit-tester
- `npm run test:e2e`: Playwright E2E-tester
- Visuella regressionstester: Light/Dark mode

## BLE Beacon

### Data-struktur

BLE Beacon-data från Halo (`blebcn/alert/`):

- `status` (0/1) - Panikknapp-status
- `name` - Beacon-namn
- `id` - Unikt beacon-ID
- `battery` - Batterinivå (0-100)
- `rssi` - Signalstyrka (dBm, negativt värde)
- `filter_rssi` - Filtrerad RSSI
- `sig_str` - Signalstyrka
- `time` - Timestamp för senaste alert

### InfluxDB Measurements

**beacon_presence:**

- Närvarohistorik över tid
- Tags: beacon_id, beacon_name, device_id
- Fields: rssi, filter_rssi, battery, signal_strength, is_present

**beacon_alerts:**

- Panikknapp-events
- Tags: beacon_id, beacon_name, alert_type, device_id
- Fields: status, battery, rssi

### Event-typer

- `BEACON_PANIC_BUTTON` - Panikknapp aktiverad (CRITICAL)
- `BEACON_ARRIVED` - Beacon anslöt (INFO)
- `BEACON_DEPARTED` - Beacon försvann (INFO)
- `BEACON_LOW_BATTERY` - Lågt batteri (WARNING)

### Tröskelvärden

- RSSI threshold: -80 dBm (för närhetsdetektering)
- Batteri-varning: < 20%
- Batteri-kritisk: < 10%

## Framtida funktioner

- **Multi-device support:** device_id och location tags
- **Simuleringsläge:** Mock data för utveckling
- **Export:** CSV/JSON export av sensor- och event-data
- **Observability:** Health checks, system status
- **Rollhantering:** Admin vs vanlig användare
- **TOTP:** Authenticator-stöd

---

**Uppdaterad:** 2025-01-27
