# Halo 3C Dashboard - Arkitektur

## Översikt

Halo 3C Dashboard är en fullstack-applikation för att visualisera och övervaka data från Halo 3C smart sensor. Systemet består av:

- **Backend:** Python + FastAPI
- **Frontend:** React (SPA) med nordisk minimalistisk design
- **Databas:** InfluxDB (time-series)
- **Deployment:** Docker på Synology NAS

## Dataflöde (End-to-End)

```
Halo 3C Sensor (REDACTED_HALO_IP)
  ↓
  HTTP GET /api/config/gstate/latest (var 5-10 sek)
  ↓
  Event triggers (NOISE, KNOCK, CO2cal, etc.)

Collector Service (FastAPI backend)
  ↓
  Skriv sensorvärden + timestamp → InfluxDB (sensor_data measurement)
  ↓
  Extrahera BLE Beacon-data → Beacon Handler
  ↓
  Analysera värden → Generera events/alarms → InfluxDB (events measurement)
  ↓
  Logga beacon presence/alerts → InfluxDB (beacon_presence, beacon_alerts measurements)

InfluxDB (Time-series database)
  ↓
  Sensorhistorik + Eventhistorik + Beacon-historik

Dashboard Backend API (FastAPI)
  ↓
  REST/WebSocket (endast internt nätverk)
  ↓
  Event stream → Frontend via WebSocket/SSE

React Frontend (Dashboard UI)
  ↓
  HTTPS via Tailscale Funnel (ENDRAST frontend exponeras)

Användare (Webbläsare)
  ↓
  Toast-notifieringar vid nya larm (inkl. beacon panikknapp)
  ↓
  Light/Dark mode toggle
  ↓
  Sensorinfo med pedagogiska förklaringar
  ↓
  Beacon-visualisering med närvaro-status
```

## Event-/Alarmmodell

### Datastruktur

```json
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "type": "NOISE|KNOCK|SENSOR_THRESHOLD|SYSTEM|BEACON_PANIC_BUTTON|BEACON_ARRIVED|BEACON_DEPARTED|BEACON_LOW_BATTERY",
  "severity": "INFO|WARNING|CRITICAL",
  "source": "sensor-id / subsystem / beacon-id",
  "summary": "kort text",
  "details": {},
  "status": "ACTIVE|ACKNOWLEDGED|RESOLVED",
  "device_id": "halo-device-1",
  "location": "optional",
  "sensor_metadata_id": "co2sensor_co2",
  "threshold_value": 1000,
  "current_value": 1200
}
```

### Lagringsval

**InfluxDB som separat measurement `events`** (rekommenderat)

**Fördelar:**

- Samma stack som sensordata
- Time-series optimerat
- Enkel querying med Flux/InfluxQL
- Automatisk timestamp-hantering

**Struktur:**

- **Measurement:** `events`
- **Tags:**
  - `type` (NOISE, KNOCK, SENSOR_THRESHOLD, SYSTEM, BEACON_PANIC_BUTTON, BEACON_ARRIVED, BEACON_DEPARTED, BEACON_LOW_BATTERY)
  - `severity` (INFO, WARNING, CRITICAL)
  - `status` (ACTIVE, ACKNOWLEDGED, RESOLVED)
  - `device_id` (för multi-device)
  - `location` (för multi-device)
  - `sensor_metadata_id` (koppling till sensor-metadata)
  - `beacon_id` (för beacon-events)
- **Fields:**
  - `summary` (string)
  - `details` (JSON)
  - `threshold_value` (number, optional)
  - `current_value` (number, optional)
- **Timestamp:** Automatisk

**Alternativ (om komplex status-hantering krävs):**

- SQLite för events: Enklare queries, bättre ACK-status-hantering
- PostgreSQL: Om redan finns för framtida funktioner

**Motivering för InfluxDB:**
Time-series data är InfluxDBs styrka. Events är tidsbaserade händelser som perfekt passar time-series-modellen. Status-hantering kan hanteras via tags och uppdateringar. Om komplex status-hantering blir ett problem kan vi migrera events till SQLite/PostgreSQL senare.

## Sensor Metadata System

### Syfte

Pedagogiska förklaringar för alla sensorer integrerade i UI för att användaren ska förstå vad varje sensor gör, vad värdena betyder, vad som är normalt och avvikande - utan att behöva läsa dokumentation.

### Metadata-struktur

```json
{
  "id": "co2sensor_co2",
  "technical_name": "co2sensor/co2",
  "display_name": "Koldioxid (CO₂)",
  "short_description": "Mäter koldioxidhalten i luften.",
  "long_description": "Koldioxidnivåer indikerar ventilationskvalitet. Höga värden (>1000 ppm) kan orsaka trötthet och nedsatt koncentrationsförmåga.",
  "category": "Luftkvalitet",
  "unit": "ppm",
  "data_type": "number",
  "icon": "co2-icon.svg",
  "normal_range": {
    "min": 400,
    "max": 1000,
    "description": "Utomhusnivåer är cirka 400 ppm. Inomhus bör nivåer hållas under 1000 ppm för optimal komfort."
  },
  "warning_thresholds": [
    {
      "level": "WARNING",
      "min": 1000,
      "max": 2000,
      "message": "Över 1000 ppm: Sämre luftkvalitet. Överväg ventilation."
    },
    {
      "level": "CRITICAL",
      "min": 2000,
      "message": "Över 2000 ppm: Mycket hög nivå. Ventilera omedelbart."
    }
  ],
  "graph_levels": [
    { "min": 0, "max": 800, "label": "God luft", "color": "green" },
    {
      "min": 800,
      "max": 1500,
      "label": "Måttlig luftkvalitet",
      "color": "yellow"
    },
    {
      "min": 1500,
      "max": 2000,
      "label": "Behöver ventileras",
      "color": "orange"
    },
    { "min": 2000, "label": "Kritisk nivå", "color": "red" }
  ],
  "related_events": ["CO2cal"],
  "faq": [
    {
      "question": "Vad betyder CO₂-värdena?",
      "answer": "CO₂-nivåer mäter andelen koldioxid i luften. Höga nivåer indikerar otillräcklig ventilation och kan påverka hälsa och koncentration."
    },
    {
      "question": "Vad är normalt?",
      "answer": "Utomhus är CO₂-nivåer cirka 400 ppm. Inomhus rekommenderas värden under 1000 ppm för bra luftkvalitet. Över 2000 ppm anses som dåligt."
    }
  ]
}
```

### Lagringsval

**Val: JSON-fil i projektet (`src/backend/data/sensor_metadata.json`)**

**Fördelar:**

- Enkelt att underhålla och uppdatera
- Portabelt - fungerar överallt
- Version-kontrollerat i Git
- Enkel att läsa från både backend och frontend
- AI kan generera innehåll direkt till filen

**Alternativ: Python-kod som statisk datakälla**

- Fördel: Type-safety, validering
- Nackdel: Mer rigid vid uppdateringar, svårare för AI att generera

**Motivering:**
JSON-fil är enklast att underhålla och uppdatera. Metadata behöver uppdateras relativt sällan, och när den gör det är det enkelt att redigera JSON. För frontend kan JSON laddas direkt eller konverteras till TypeScript interfaces. Python-kod skulle ge type-safety men gör uppdateringar mer komplexa.

### Backend API Endpoints

- `GET /api/sensors/meta` - Lista all sensor-metadata
- `GET /api/sensors/meta/{sensor_id}` - Specifik sensor-metadata

### AI-generering

Metadata ska härledas från dokumentationen i `docs/background/halo 3c/SENSORS.md` för alla 43 sensorer. AI genererar:

- Display-namn baserat på tekniskt namn
- Kort och lång beskrivning baserat på dokumentation
- Normalintervall baserat på typiska värden
- Tröskelvärden baserat på dokumentation och best practices
- Graph-levels för visuell representation
- FAQ baserat på vanliga frågor

## BLE Beacon Integration

### Översikt

Fullständigt stöd för BLE Beacon med närhetsdetektering, panikknapp-funktionalitet, närvarohistorik och visuell visualisering.

### Data-struktur från Halo

BLE Beacon-data från `blebcn/alert/` innehåller:

- `status` (0/1) - Panikknapp-status
- `name` - Beacon-namn
- `id` - Unikt beacon-ID
- `battery` - Batterinivå (0-100)
- `rssi` - Signalstyrka (dBm, negativt värde)
- `filter_rssi` - Filtrerad RSSI
- `sig_str` - Signalstyrka
- `time` - Timestamp för senaste alert

### InfluxDB-struktur

**Measurement: `beacon_presence`**

- Tags: `beacon_id`, `beacon_name`, `device_id`
- Fields: `rssi` (float), `filter_rssi` (float), `battery` (int), `signal_strength` (int), `is_present` (bool)
- Timestamp: Automatisk

**Measurement: `beacon_alerts`**

- Tags: `beacon_id`, `beacon_name`, `alert_type` (panic_button), `device_id`
- Fields: `status` (int), `battery` (int), `rssi` (float)
- Timestamp: Automatisk

### Event-typer

- `BEACON_PANIC_BUTTON` - När alert.status går från 0 → 1 (CRITICAL severity)
- `BEACON_ARRIVED` - När beacon först detekteras (RSSI går från 0 → >threshold) (INFO)
- `BEACON_DEPARTED` - När beacon försvinner (RSSI går under threshold) (INFO)
- `BEACON_LOW_BATTERY` - När batteri < 20% (WARNING)

### Tröskelvärden

- RSSI threshold för närhet: -80 dBm (justerbart)
- Batteri-varning: < 20%
- Batteri-kritisk: < 10%

### Backend API Endpoints

- `GET /api/beacons` - Lista alla kända beacons med senaste status
- `GET /api/beacons/{beacon_id}` - Detaljerad info om specifik beacon
- `GET /api/beacons/{beacon_id}/history` - Närvarohistorik för beacon
- `GET /api/beacons/{beacon_id}/alerts` - Panikknapp-events för beacon
- `GET /api/beacons/presence/current` - Alla närvarande beacons just nu

### Frontend-komponenter

- `BeaconCard` - Visar enskild beacon med närvaro-status, signalstyrka, batteri
- `BeaconList` - Lista över alla beacons med filter/sortering
- `BeaconHistoryChart` - Graf över närvarohistorik (RSSI över tid)

### Signalstyrka-visualisering

- Grön: > -60 dBm (mycket nära)
- Gul: -60 till -80 dBm (nära)
- Orange: -80 till -90 dBm (långt bort)
- Röd: < -90 dBm (mycket långt bort/ej närvarande)

### Exempel: Beacon Event-generering

```python
# Beacon Handler processar beacon-data
beacons = beacon_handler.extract_beacon_data(halo_data)
presence_data, events = beacon_handler.process_beacons(beacons, device_id)

# Events genereras automatiskt vid:
# - Panikknapp aktiverad (status 0 → 1)
# - Beacon anslöt (RSSI över -80 dBm för första gången)
# - Beacon försvann (RSSI under -80 dBm)
# - Lågt batteri (< 20% eller < 10%)

# Presence-data loggas till InfluxDB
# Events loggas till events measurement
```

## Säkerhet & Åtkomst

### Nätverksisolering

- **Frontend:** Endast denna exponeras via Tailscale Funnel (port 3000)
- **Backend API:** Endast expose, INGA ports - tillgänglig endast via Docker network
- **InfluxDB:** Endast expose, INGA ports - tillgänglig endast via Docker network
- **Collector:** Ingen exponering alls

### Autentisering

- Demo-konto (username/password via env vars)
- JWT tokens för session management
- Struktur för TOTP/authenticator-stöd (framtida)
- Rollhantering (admin vs vanlig användare) - framtida utökning
- Ingen magic link (pga inget SMTP-stöd på Synology)

## Framtida Funktioner (Arkitektur)

### Multi-device support

- `device_id` tag i InfluxDB sensor-data
- `location` tag för geografisk/rum-baserad gruppering
- Device-registry (env vars eller framtida databas)

### Simuleringsläge

- `SIMULATION_MODE=true` env var
- Mock Halo client som genererar realistisk test-data
- Mock event-generator för tester/demo

### Export

- `GET /api/export/sensors?format=csv|json&from=&to=`
- `GET /api/export/events?format=csv|json&from=&to=`
- UI-knapp för export (framtida)

### Observability

- Health checks för alla services
- `GET /api/system/status` - Systemkomponenter status
- Statusvy i dashboard (framtida)

## Komponentbeskrivningar

### Backend Components

**Collector Service:**

- Pollar Halo 3C sensor varje 5-10 sekunder
- Skriver sensorvärden till InfluxDB
- Genererar events baserat på tröskelvärden
- Hanterar sensorfel och retry-logik

**Beacon Handler:**

- Extraherar BLE Beacon-data från Halo sensor response
- Identifierar när beacons kommer/går (RSSI-baserad närhetsdetektering)
- Loggar beacon-data till InfluxDB (beacon_presence, beacon_alerts)
- Detekterar panikknapp-events, närvaro-förändringar, och lågt batteri

**Event Generator:**

- Analyserar sensor-data
- Använder sensor-metadata för tröskelvärden
- Genererar events med korrekt severity
- Kopplar events till sensor-metadata
- Processar beacon-data och genererar beacon-relaterade events

**API Service:**

- REST endpoints för sensorer, events, metadata, beacons
- WebSocket/SSE för real-time event stream
- Autentisering och auktorisering
- Health checks

### Frontend Components

**Dashboard:**

- Översikt av alla sensorer
- Sensor cards med tooltips
- Beacon-visualisering med närvaro-status
- Real-time uppdateringar
- Toast-notifieringar

**SensorInfo:**

- Lista alla sensorer med kategori-filtrering
- Detaljsidor per sensor
- FAQ-sektion
- Grafer med pedagogiska nivåmarkörer

**Beacon Components:**

- BeaconCard: Visar enskild beacon med närvaro, signalstyrka, batteri
- BeaconList: Lista över alla beacons med filter/sortering
- BeaconHistoryChart: Graf över närvarohistorik (RSSI över tid)

**Events View:**

- Tabell med full sortering och filtrering
- Acknowledge-funktionalitet
- Länk till sensorinfo vid event
- Beacon-events (panikknapp, närvaro) integrerade

## Deployment

### Docker Setup

**docker-compose.yml:**

- Frontend service (port 3000)
- Backend service (internt)
- InfluxDB service (internt)
- Collector service (bakgrund)

**Nätverksisolering:**

- Frontend: Exponeras via Tailscale Funnel
- Övriga: Endast Docker network

### Miljövariabler

Se `.env.example` för fullständig lista.

---

**Uppdaterad:** 2025-01-27
