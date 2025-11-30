# Halo 3C Dashboard

[English](#english) | [Svenska](#svenska)

---

<a name="english"></a>
# Halo 3C Dashboard (English)

A comprehensive, real-time dashboard application for monitoring and visualizing data from the Halo 3C smart sensor. This full-stack solution provides intuitive visualization, event management, and educational sensor explanations with a modern, minimalist Nordic design.

## Overview

The Halo 3C Dashboard is a production-ready monitoring system that collects, stores, and visualizes data from Halo 3C smart sensors. It supports 43 different sensor types, real-time event detection, BLE beacon management, and provides an educational interface to help users understand sensor data and environmental conditions.

### Key Highlights

- **Real-time Monitoring**: Live sensor data updates every 5-10 seconds
- **Event Management**: Intelligent alarm system with threshold-based triggers
- **BLE Beacon Support**: Presence detection, panic button functionality, and battery monitoring
- **Educational Interface**: Built-in sensor explanations, FAQs, and visual guides
- **Modern UI**: Nordic minimalist design with light/dark mode support
- **Production Ready**: Deployed via Docker on Synology NAS with Tailscale Funnel

## Features

### Core Functionality

- **Real-time Sensor Visualization**
  - Live dashboard with current sensor values
  - Trend indicators (↑/↓/→) showing value changes
  - Sensor cards with metadata and tooltips
  - Filtered sensor whitelist (10 selected sensors)

- **Event & Alarm Management**
  - Automatic event generation based on threshold values
  - Real-time toast notifications for new events
  - Event acknowledgment and status tracking
  - Comprehensive event log with filtering and sorting
  - Event types: SENSOR_THRESHOLD, NOISE, KNOCK, BEACON_PANIC_BUTTON, and more

- **BLE Beacon Integration**
  - Presence detection using RSSI-based proximity
  - Panic button event detection
  - Battery level monitoring with low-battery alerts
  - Arrival/departure tracking
  - Visual beacon status cards

- **Educational Sensor Information**
  - Detailed sensor metadata with descriptions
  - Category-based filtering (Environment, Air Quality, Sound, Motion, Health Index)
  - Normal range indicators and threshold explanations
  - FAQ sections for each sensor
  - Historical graphs with educational level markers

- **Comparative Analysis**
  - Multi-sensor comparison graphs (`/sensors/compare`)
  - Trend alerts for value deviations
  - Historical data visualization

- **User Interface**
  - Light/Dark mode toggle
  - Responsive design for all screen sizes
  - WCAG AA accessibility compliance
  - Nordic minimalist design philosophy

## Architecture

### Technology Stack

- **Backend**: Python 3.11+ with FastAPI
- **Frontend**: React 18 with TypeScript, Vite
- **Database**: InfluxDB 2.7 (time-series optimized)
- **Authentication**: JWT tokens with demo account support
- **Real-time**: WebSocket for event streaming
- **Deployment**: Docker Compose on Synology NAS
- **Networking**: Tailscale Funnel for secure external access

### System Components

```
Halo 3C Sensor (192.168.0.35)
  ↓ HTTP GET /api/config/gstate/latest (every 5-10s)
  ↓
Collector Service (FastAPI)
  ↓ Writes sensor data → InfluxDB (sensor_data)
  ↓ Extracts BLE beacon data → Beacon Handler
  ↓ Analyzes values → Generates events → InfluxDB (events)
  ↓
InfluxDB (Time-series Database)
  ↓ Stores: sensor_data, events, beacon_presence, beacon_alerts
  ↓
Backend API (FastAPI)
  ↓ REST endpoints + WebSocket
  ↓
React Frontend (SPA)
  ↓ HTTPS via Tailscale Funnel
  ↓
User (Web Browser)
```

### Data Flow

1. **Collection**: Collector service polls Halo 3C sensor every 5-10 seconds
2. **Storage**: Sensor values, events, and beacon data stored in InfluxDB
3. **Processing**: Event generator analyzes data and creates alerts based on thresholds
4. **Delivery**: Backend API serves data via REST and WebSocket
5. **Visualization**: React frontend displays real-time data with interactive UI

## Installation

### Prerequisites

- Docker and Docker Compose
- Access to Halo 3C sensor on local network
- InfluxDB admin token
- (Optional) Tailscale account for external access

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/retea-se/halo-3c-dashboard.git
   cd halo-3c-dashboard
   ```

2. **Configure environment variables**
   ```bash
   cp docs/env.example .env
   # Edit .env with your configuration
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Access the dashboard**
   - Frontend: `http://localhost:3000` (or configured port)
   - Backend API: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`

### Environment Variables

Key configuration options (see `docs/env.example` for complete list):

```env
# InfluxDB
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_TOKEN=your-admin-token
INFLUXDB_ORG=halo-org
INFLUXDB_BUCKET=halo-sensors

# Halo 3C Sensor
HALO_IP=192.168.0.35
HALO_USER=admin
HALO_PASS=your-password

# Device
DEVICE_ID=halo-device-1
COLLECTION_INTERVAL=10

# Frontend
FRONTEND_PORT=3000

# Authentication
JWT_SECRET_KEY=your-secret-key
DEMO_USERNAME=demo
DEMO_PASSWORD=your-password
```

## Deployment

### Docker Compose Deployment

The application is designed for deployment on Synology NAS using Docker Compose.

**Services:**
- `influxdb`: Time-series database (internal network only)
- `backend`: FastAPI backend API (port 8000)
- `collector`: Background data collection service
- `frontend`: React SPA served via Nginx (port 3000)

**Network Security:**
- Only frontend is exposed externally (via Tailscale Funnel)
- Backend, InfluxDB, and collector are internal-only
- All services communicate via Docker bridge network

### Tailscale Funnel Setup

For secure external access without port forwarding:

1. Install Tailscale on Synology NAS
2. Enable Funnel for the frontend service
3. Access dashboard via Tailscale Funnel URL

Example production URL: `https://mittemellan.tail00c71f.ts.net`

## API Documentation

### Authentication

- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/me` - Get current user info

### Sensors

- `GET /api/sensors/meta` - Get all sensor metadata
- `GET /api/sensors/meta/{sensor_id}` - Get specific sensor metadata
- `GET /api/sensors/latest` - Get latest sensor values
- `GET /api/sensors/{sensor_id}/history` - Get sensor history

### Events

- `GET /api/events` - Get filtered events
- `GET /api/events/latest` - Get latest events
- `POST /api/events/ack/{event_id}` - Acknowledge event
- `WebSocket /api/events/stream` - Real-time event stream

### Beacons

- `GET /api/beacons` - List all beacons
- `GET /api/beacons/{beacon_id}` - Get beacon details
- `GET /api/beacons/{beacon_id}/history` - Get beacon presence history
- `GET /api/beacons/{beacon_id}/alerts` - Get beacon panic button alerts
- `GET /api/beacons/presence/current` - Get currently present beacons

### System

- `GET /api/system/status` - Get system health status

**Full API documentation**: Available at `/docs` (Swagger UI) and `/redoc` (ReDoc)

## Testing

### Backend Tests

```bash
cd src/backend
pytest tests/backend/
```

### Frontend Tests

```bash
cd src/frontend
npm test
```

### End-to-End Tests

```bash
cd tests/frontend/e2e
npm install
npx playwright test
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **Architecture**: `docs/architecture.md` - System architecture and design decisions
- **API Reference**: `docs/api-documentation.md` - Complete API documentation
- **UI Guidelines**: `docs/ui-guidelines.md` - Design system and UI rules
- **Knowledge Base**: `docs/knowledge_base.md` - Data flow and limitations
- **Sensor Overview**: `docs/summary_sensor.md` - Sensor categories and types
- **Deployment**: `docs/deployment.md` - Deployment guides

## Navigation

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview with sensor values, trends, and observations |
| Compare Sensors | `/sensors/compare` | Compare multiple sensors in the same graph |
| Beacons | `/beacons` | Manage and monitor BLE beacons |
| Events | `/events` | Event log with filtering and acknowledgment |
| Sensor Info | `/sensors/info` | Detailed sensor information and FAQs |

## Security

- **Network Isolation**: Only frontend exposed externally
- **Authentication**: JWT-based authentication with demo account
- **CORS**: Configured for specific origins
- **No Secrets in Code**: All sensitive data via environment variables
- **Internal Services**: Backend, InfluxDB, and collector are internal-only

## Development

### Local Development Setup

**Backend:**
```bash
cd src/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

**Frontend:**
```bash
cd src/frontend
npm install
npm run dev
```

### Project Structure

```
halo-3c-dashboard/
├── src/
│   ├── backend/
│   │   ├── api/           # FastAPI application
│   │   ├── collector/     # Data collection service
│   │   ├── services/      # Business logic
│   │   ├── models/        # Pydantic models
│   │   └── data/          # Sensor metadata JSON
│   └── frontend/
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── services/    # API clients
│       │   └── hooks/       # Custom React hooks
│       └── public/          # Static assets
├── tests/
│   ├── backend/          # Backend unit/integration tests
│   └── frontend/         # Frontend E2E tests
├── docs/                 # Documentation
└── docker-compose.yml    # Docker orchestration
```

## Sensor Categories

The Halo 3C sensor provides 43 different sensor types across 5 categories:

- **Environment** (5 sensors): Temperature, Humidity, Pressure, Light
- **Air Quality** (13 sensors): AQI, CO2, TVOC, PM1/2.5/10, NO2, CO, NH3
- **Sound** (11 sensors): Sound level, Aggression detection, Gunshot detection, Keyword detection
- **Motion** (4 sensors): PIR, Accelerometer, External input, BLE Beacon
- **Health Index** (8 sensors): Overall and per-sensor health indices

## Design Philosophy

The dashboard follows a **Nordic Minimalist** design approach:

- **Clean and Airy**: Generous whitespace, minimal visual noise
- **Limited Color Palette**: Neutral tones with purposeful color usage
- **Clear Visual Hierarchy**: Distinct levels of information
- **Accessibility First**: WCAG AA compliance, keyboard navigation
- **No Emojis**: Only discrete SVG icons

## License

[Specify your license here]

## Contributing

[Contributing guidelines - to be added]

## Support

[Support information - to be added]

---

<a name="svenska"></a>
# Halo 3C Dashboard (Svenska)

En omfattande dashboard-applikation för realtidsövervakning och visualisering av data från Halo 3C smart sensor. Denna fullstack-lösning erbjuder intuitiv visualisering, event-hantering och pedagogiska sensorförklaringar med ett modernt, minimalistiskt nordiskt design.

## Översikt

Halo 3C Dashboard är ett produktionsklart övervakningssystem som samlar in, lagrar och visualiserar data från Halo 3C smart sensorer. Systemet stödjer 43 olika sensortyper, realtids event-detektering, BLE beacon-hantering och erbjuder ett pedagogiskt gränssnitt för att hjälpa användare förstå sensordata och miljöförhållanden.

### Huvudfunktioner

- **Realtidsövervakning**: Live sensordata uppdateras var 5-10:e sekund
- **Event-hantering**: Intelligent alarmsystem med tröskelvärdesbaserade triggers
- **BLE Beacon-stöd**: Närhetsdetektering, panikknapp-funktionalitet och batteriövervakning
- **Pedagogiskt gränssnitt**: Inbyggda sensorförklaringar, FAQ och visuella guider
- **Modernt UI**: Nordisk minimalistisk design med light/dark mode-stöd
- **Produktionsklart**: Deployat via Docker på Synology NAS med Tailscale Funnel

## Funktioner

### Kärnfunktionalitet

- **Realtids sensorvisualisering**
  - Live dashboard med aktuella sensorvärden
  - Trendindikatorer (↑/↓/→) som visar värdeförändringar
  - Sensor-kort med metadata och tooltips
  - Filtrerad sensor whitelist (10 utvalda sensorer)

- **Event- och alarmhantering**
  - Automatisk event-generering baserat på tröskelvärden
  - Realtids toast-notifieringar för nya events
  - Event-kvittering och statushantering
  - Omfattande eventlogg med filtrering och sortering
  - Event-typer: SENSOR_THRESHOLD, NOISE, KNOCK, BEACON_PANIC_BUTTON med flera

- **BLE Beacon-integration**
  - Närhetsdetektering med RSSI-baserad närhet
  - Panikknapp event-detektering
  - Batterinivåövervakning med lågt batteri-varningar
  - Ankomst/avgångsspårning
  - Visuella beacon status-kort

- **Pedagogisk sensorinformation**
  - Detaljerad sensor-metadata med beskrivningar
  - Kategori-baserad filtrering (Miljö, Luftkvalitet, Ljud, Rörelse, Hälsoindex)
  - Normalintervall-indikatorer och tröskelvärdesförklaringar
  - FAQ-sektioner för varje sensor
  - Historiska grafer med pedagogiska nivåmarkörer

- **Jämförande analys**
  - Multi-sensor jämförelsegrafer (`/sensors/compare`)
  - Trendvarningar vid värdeavvikelser
  - Historisk datavisualisering

- **Användargränssnitt**
  - Light/Dark mode-växling
  - Responsiv design för alla skärmstorlekar
  - WCAG AA tillgänglighetskompatibilitet
  - Nordisk minimalistisk designfilosofi

## Arkitektur

### Teknisk stack

- **Backend**: Python 3.11+ med FastAPI
- **Frontend**: React 18 med TypeScript, Vite
- **Databas**: InfluxDB 2.7 (time-series optimerad)
- **Autentisering**: JWT tokens med demo-kontostöd
- **Realtid**: WebSocket för event-streaming
- **Deployment**: Docker Compose på Synology NAS
- **Nätverk**: Tailscale Funnel för säker extern åtkomst

### Systemkomponenter

```
Halo 3C Sensor (192.168.0.35)
  ↓ HTTP GET /api/config/gstate/latest (var 5-10s)
  ↓
Collector Service (FastAPI)
  ↓ Skriver sensordata → InfluxDB (sensor_data)
  ↓ Extraherar BLE beacon-data → Beacon Handler
  ↓ Analyserar värden → Genererar events → InfluxDB (events)
  ↓
InfluxDB (Time-series Database)
  ↓ Lagrar: sensor_data, events, beacon_presence, beacon_alerts
  ↓
Backend API (FastAPI)
  ↓ REST endpoints + WebSocket
  ↓
React Frontend (SPA)
  ↓ HTTPS via Tailscale Funnel
  ↓
Användare (Webbläsare)
```

### Dataflöde

1. **Insamling**: Collector-service pollar Halo 3C sensor var 5-10:e sekund
2. **Lagring**: Sensorvärden, events och beacon-data lagras i InfluxDB
3. **Bearbetning**: Event-generator analyserar data och skapar larm baserat på tröskelvärden
4. **Leverans**: Backend API serverar data via REST och WebSocket
5. **Visualisering**: React frontend visar realtidsdata med interaktivt UI

## Installation

### Förutsättningar

- Docker och Docker Compose
- Åtkomst till Halo 3C sensor på lokalt nätverk
- InfluxDB admin token
- (Valfritt) Tailscale-konto för extern åtkomst

### Snabbstart

1. **Klona repository**
   ```bash
   git clone https://github.com/retea-se/halo-3c-dashboard.git
   cd halo-3c-dashboard
   ```

2. **Konfigurera miljövariabler**
   ```bash
   cp docs/env.example .env
   # Redigera .env med din konfiguration
   ```

3. **Starta services**
   ```bash
   docker-compose up -d
   ```

4. **Öppna dashboard**
   - Frontend: `http://localhost:3000` (eller konfigurerad port)
   - Backend API: `http://localhost:8000`
   - API-dokumentation: `http://localhost:8000/docs`

### Miljövariabler

Viktiga konfigurationsalternativ (se `docs/env.example` för komplett lista):

```env
# InfluxDB
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_TOKEN=ditt-admin-token
INFLUXDB_ORG=halo-org
INFLUXDB_BUCKET=halo-sensors

# Halo 3C Sensor
HALO_IP=192.168.0.35
HALO_USER=admin
HALO_PASS=ditt-lösenord

# Enhet
DEVICE_ID=halo-device-1
COLLECTION_INTERVAL=10

# Frontend
FRONTEND_PORT=3000

# Autentisering
JWT_SECRET_KEY=ditt-hemliga-nyckel
DEMO_USERNAME=demo
DEMO_PASSWORD=ditt-lösenord
```

## Deployment

### Docker Compose-deployment

Applikationen är designad för deployment på Synology NAS med Docker Compose.

**Services:**
- `influxdb`: Time-series databas (endast internt nätverk)
- `backend`: FastAPI backend API (port 8000)
- `collector`: Bakgrundsdata-insamlingsservice
- `frontend`: React SPA serverad via Nginx (port 3000)

**Nätverkssäkerhet:**
- Endast frontend exponeras externt (via Tailscale Funnel)
- Backend, InfluxDB och collector är endast interna
- Alla services kommunicerar via Docker bridge-nätverk

### Tailscale Funnel-setup

För säker extern åtkomst utan port forwarding:

1. Installera Tailscale på Synology NAS
2. Aktivera Funnel för frontend-service
3. Öppna dashboard via Tailscale Funnel URL

Exempel produktions-URL: `https://mittemellan.tail00c71f.ts.net`

## API-dokumentation

### Autentisering

- `POST /api/auth/login` - Logga in med användarnamn/lösenord
- `GET /api/auth/me` - Hämta aktuell användarinformation

### Sensorer

- `GET /api/sensors/meta` - Hämta all sensor-metadata
- `GET /api/sensors/meta/{sensor_id}` - Hämta specifik sensor-metadata
- `GET /api/sensors/latest` - Hämta senaste sensorvärden
- `GET /api/sensors/{sensor_id}/history` - Hämta sensorhistorik

### Events

- `GET /api/events` - Hämta filtrerade events
- `GET /api/events/latest` - Hämta senaste events
- `POST /api/events/ack/{event_id}` - Kvittera event
- `WebSocket /api/events/stream` - Realtids event-stream

### Beacons

- `GET /api/beacons` - Lista alla beacons
- `GET /api/beacons/{beacon_id}` - Hämta beacon-detaljer
- `GET /api/beacons/{beacon_id}/history` - Hämta beacon närvarohistorik
- `GET /api/beacons/{beacon_id}/alerts` - Hämta beacon panikknapp-larm
- `GET /api/beacons/presence/current` - Hämta närvarande beacons just nu

### System

- `GET /api/system/status` - Hämta systemhälsostatus

**Fullständig API-dokumentation**: Tillgänglig på `/docs` (Swagger UI) och `/redoc` (ReDoc)

## Testning

### Backend-tester

```bash
cd src/backend
pytest tests/backend/
```

### Frontend-tester

```bash
cd src/frontend
npm test
```

### End-to-end-tester

```bash
cd tests/frontend/e2e
npm install
npx playwright test
```

## Dokumentation

Omfattande dokumentation finns i `docs/`-katalogen:

- **Arkitektur**: `docs/architecture.md` - Systemarkitektur och designbeslut
- **API-referens**: `docs/api-documentation.md` - Komplett API-dokumentation
- **UI-riktlinjer**: `docs/ui-guidelines.md` - Designsystem och UI-regler
- **Kunskapsbas**: `docs/knowledge_base.md` - Dataflöde och begränsningar
- **Sensoröversikt**: `docs/summary_sensor.md` - Sensorkategorier och typer
- **Deployment**: `docs/deployment.md` - Deployment-guider

## Navigation

| Sida | Route | Beskrivning |
|------|-------|-------------|
| Dashboard | `/` | Översikt med sensorvärden, trender och observationer |
| Jämför sensorer | `/sensors/compare` | Jämför flera sensorer i samma graf |
| Beacons | `/beacons` | Hantera och övervaka BLE beacons |
| Events | `/events` | Eventlogg med filtrering och kvittering |
| Sensor Info | `/sensors/info` | Detaljerad sensorinformation och FAQ |

## Säkerhet

- **Nätverksisolering**: Endast frontend exponeras externt
- **Autentisering**: JWT-baserad autentisering med demo-konto
- **CORS**: Konfigurerad för specifika origins
- **Inga secrets i kod**: All känslig data via miljövariabler
- **Interna services**: Backend, InfluxDB och collector är endast interna

## Utveckling

### Lokal utvecklingsmiljö

**Backend:**
```bash
cd src/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

**Frontend:**
```bash
cd src/frontend
npm install
npm run dev
```

### Projektstruktur

```
halo-3c-dashboard/
├── src/
│   ├── backend/
│   │   ├── api/           # FastAPI-applikation
│   │   ├── collector/     # Data-insamlingsservice
│   │   ├── services/      # Affärslogik
│   │   ├── models/        # Pydantic-modeller
│   │   └── data/          # Sensor-metadata JSON
│   └── frontend/
│       ├── src/
│       │   ├── components/  # React-komponenter
│       │   ├── pages/       # Sidkomponenter
│       │   ├── services/    # API-klienter
│       │   └── hooks/       # Anpassade React hooks
│       └── public/          # Statiska resurser
├── tests/
│   ├── backend/          # Backend unit/integrationstester
│   └── frontend/         # Frontend E2E-tester
├── docs/                 # Dokumentation
└── docker-compose.yml    # Docker-orkestrering
```

## Sensorkategorier

Halo 3C sensor tillhandahåller 43 olika sensortyper över 5 kategorier:

- **Miljö** (5 sensorer): Temperatur, Luftfuktighet, Tryck, Ljus
- **Luftkvalitet** (13 sensorer): AQI, CO2, TVOC, PM1/2.5/10, NO2, CO, NH3
- **Ljud** (11 sensorer): Ljudnivå, Aggressionsdetektering, Skottlossningsdetektering, Nyckelordsdetektering
- **Rörelse** (4 sensorer): PIR, Accelerometer, Extern ingång, BLE Beacon
- **Hälsoindex** (8 sensorer): Totalt och per-sensor hälsoindex

## Designfilosofi

Dashboarden följer en **Nordisk Minimalistisk** designfilosofi:

- **Rent och luftigt**: Generös whitespace, minimal visuell brus
- **Begränsad färgpalett**: Neutrala toner med syftesfull färganvändning
- **Tydlig visuell hierarki**: Tydliga nivåer av information
- **Tillgänglighet först**: WCAG AA-kompatibilitet, tangentbordsnavigation
- **Inga emojis**: Endast diskreta SVG-ikoner

## Licens

[Ange din licens här]

## Bidrag

[Bidragsriktlinjer - att läggas till]

## Support

[Supportinformation - att läggas till]

---

## Status

**MÅL UPPNÅTT: 2025-11-29**

Projektet är nu i produktion och fullt funktionellt via Tailscale Funnel.

### Implementerade funktioner (2025-11-29):
- [x] Filtrering av sensorvärden - strikt whitelist med 10 utvalda sensorer
- [x] Trendindikatorer (↑/↓/→) på Dashboard
- [x] Jämförande grafer - ny sida `/sensors/compare`
- [x] Mjuka larm vid avvikelser - TrendAlerts-komponent
- [x] BLE Beacon-hantering - ny sida `/beacons`
- [x] Tailscale Funnel - tillgänglig på `https://mittemellan.tail00c71f.ts.net`

**Skapad:** 2025-01-27
**Mål uppnått:** 2025-11-29
