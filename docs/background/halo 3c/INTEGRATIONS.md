# Halo 3C - Integrationsmöjligheter

## Översikt

Halo 3C erbjuder omfattande integrationsmöjligheter för att koppla samman sensorer med olika system och plattformar. Denna dokumentation sammanfattar alla tillgängliga integrationsmetoder.

**Enhetsinformation:**
- IP-adress: REDACTED_HALO_IP
- Enhetsnamn: Halo_Device
- Användarnamn: admin
- Lösenord: REDACTED_HALO_PASSWORD

---

## Innehållsförteckning

1. [Primary & Secondary Integration](#primary--secondary-integration)
2. [Heartbeat](#heartbeat)
3. [RTSP Streaming](#rtsp-streaming)
4. [BACnet](#bacnet)
5. [SNMP](#snmp)
6. [Email Integration](#email-integration)
7. [VMS Integration](#vms-integration)
8. [WebSocket & Cloud](#websocket--cloud)
9. [Docker Integration](#docker-integration)
10. [InfluxDB Integration](#influxdb-integration)
11. [Variabler & Placeholders](#variabler--placeholders)

---

## Primary & Secondary Integration

### Protokoll

- **TCP** - Direkt TCP-anslutning
- **HTTP/HTTPS** - REST API-baserad integration

### Funktioner

#### Set String (Sättningssträng)

Skickas vid event-detektion.

**Tillgängliga variabler:**
- `%NAME%` - enhetsnamn
- `%IP%` - IP-adress
- `%MAC%` - MAC-adress
- `%EID%` - event ID
- `%SOURCE%` - datakälla
- `%THR%` - event-tröskelvärde
- `%VAL%` - sensorvärde
- `%DATE%` - lokal datum för event
- `%TIME%` - lokal tid för event
- `%PSWD%` - lösenord
- `%USER%` - användarnamn
- `%FWVER%` - firmware-version

**Exempel:**
```
https://server.com/path/info?location=%NAME%,event=%EID%,detected=true
```

#### Reset String (Återställningssträng)

Skickas när event återställs. Stöder PUT-requests med JSON body.

**Exempel:**
```
PUT:https://server.com/path/info[JSONBODY]{"location":"%NAME%","event":"%EID%","detected":false}
```

### Autentisering

- **Basic/Digest** - Standard HTTP-autentisering
- **Bearer Token** - Token-baserad autentisering
- **OAuth2** - OAuth2-protokoll

### Konfigurationsalternativ

- **Integration Partner** - Fördefinierade inställningar för specifika system
- **Repeat Holdoff** - Fördröjning mellan upprepade meddelanden (sekunder)

### Secondary Integration

Samma funktionalitet som Primary Integration men kan konfigureras separat. Möjliggör:
- Dubbla integrationsflöden
- Backup-integration
- Olika destinationssystem
- Parallella integrationspumpar

---

## Heartbeat

### Funktion

Periodiska livstecken-meddelanden för att verifiera enhetens status och aktivitet.

### Konfiguration

- **Protokoll:** TCP eller HTTP
- **Meddelande:** Anpassningsbar URL med sensor-data
- **Intervall:** Inställbart i sekunder (exempel: 60 sekunder)
- **Aktivering:** On/Off-toggle

### Tillgängliga variabler för Heartbeat

Alla variabler från Primary Integration PLUS:
- `%EVENTS%` - lista över event-tillstånd
- `%EVENTVALS%` - lista över event-värden
- `%ACTIVE%` - lista över aktiva events
- `%SENSOR:id%` - värde från specifik sensor

**Exempel:**
```
https://server.com/heartbeat?location=%NAME%,Temp=%SENSOR:F%,RH=%SENSOR:RH%,Lux=%SENSOR:Lux%,TVOC=%SENSOR:TVOC%,CO2eq=%SENSOR:CO2eq%,PM2.5=%SENSOR:PM2.5%,PM10=%SENSOR:PM10%,NH3=%SENSOR:NH3%,NO2=%SENSOR:NO2%,CO=%SENSOR:CO%,Noise=%SENSOR:Noise%,Move=%SENSOR:Move%,AQI=%SENSOR:AQI%,Triggered=%ACTIVE%
```

### Heartbeat Email

Separat toggle för e-postbaserade heartbeats, konfigureras via e-postinställningar.

---

## RTSP Streaming

### Funktion

Video- och bildströmmar för realtidsövervakning.

### Konfiguration

- **RTSP Stream Enabled** - On/Off-toggle
- **Port:** 8554 (standard)
- **Autentisering:** Basic/Digest
- **Scroll Time:** 5 sekunder
- **Bildformat:** stream.jpg

### Bildströms-sökvägar

Tillgängliga endpoints:
- Dashboard MJPEG Stream
- Dashboard Stand-Alone SVG Stream
- Dashboard Frame (.jpg)
- Dashboard Frame (.svg)
- `https://REDACTED_HALO_IP/api/gfx/dashboard.jpeg`
- `https://REDACTED_HALO_IP/api/gfx/dashboardframe.jpg`
- `https://REDACTED_HALO_IP/api/gfx/dashboardframe.svg`
- `https://REDACTED_HALO_IP/dashboard.html`

### Bild-autentisering

- **HTTP Response Code:** 206 (Partial Content)
- **Image Authentication:** "Both" (Basic och Digest)

---

## BACnet

### Funktion

Industristandardprotokoll för byggautomatisering.

### Konfiguration

- **BACnet Enabled** - On/Off-toggle
- **Device Name** - Identifiering i BACnet-nätverket
- **Instance Number** - Unikt instansnummer
- **Port:** 47808 (standard BACnet-port)
- **Location** - Fysisk platsinformation

### Funktioner

- Stöd för Change of Value (COV)
- COV Increment: 5%
- Foreign Device support
- BBMD (BACnet/IP Broadcast Management Device) support
- TTL: 30 sekunder

---

## SNMP

### Funktion

Standardprotokoll för nätverkshantering och övervakning.

### Konfiguration

- **Enabled:** On/Off
- **Read-Only Community:** "public" (standard)
- **Read-Only Username:** Konfigurerbar
- **Authentication Key:** Konfigurerbar
- **Privacy Key:** Konfigurerbar
- **Read-Write Community:** "private" (standard)
- **Read-Write Username:** "admin" (standard)
- **Location Field:** Konfigurerbar
- **Contact Field:** Konfigurerbar

### Användningsfall

- Nätverksövervakning
- Systemstatus-övervakning
- Integration med NMS (Network Management Systems)
- Enhetshantering via SNMP-kompatibla verktyg

---

## Email Integration

### Funktion

E-postbaserade aviseringar vid events och händelser.

### Konfiguration

- **SMTP Host** - SMTP-serveradress
- **Port:** 25 (standard)
- **TLS:** On/Off
- **Authentication:** Användarnamn och lösenord
- **From Email** - Avsändaradress
- **Recipient Emails** - Lista över mottagare
- **Retries:** 4 försök
- **Retry Delay:** 15 sekunder

### Event Templates

Två fördefinierade e-postmallar:

1. **Event Detected** - Skickas när event upptäcks
   - Röd bakgrund
   - Innehåller event-ID, plats, datum och tid
2. **Event Cleared** - Skickas när event återställs
   - Grön bakgrund
   - Innehåller event-ID, plats, datum och tid

### Anpassningsbara fält

- Subject (ämne)
- Body (innehåll)
- Delay (fördröjning i sekunder)

---

## VMS Integration

Halo 3C stöder integration med specifika VMS-system via fördefinierade mallar.

### Avigilon Control Center (ACC)

- Integration Guide tillgänglig: `avigilon-acc-integration-guide-halo-iot-smart-sensor.pdf`
- Automatisk enhetsregistrering
- Event-baserad avisering
- Sensor-data integration

### Genetec

- Integration Guide tillgänglig: `halosmartsensor-integrationguide-genetec.pdf`
- Omnicast-kompatibel
- Security Center integration
- Realtidsdataöverföring

### Allmän VMS-integration

- HTTP/HTTPS-baserad
- Event-driven architecture
- JSON-format för dataöverföring
- Webhook-support

### Konfiguration

**VMS 1 (Primary):**
```json
{
  "vms_type": "vms",
  "address": "0.0.0.0",
  "port": 1234,
  "tcp": "HTTP",
  "basic_digest": "BASICDIGEST",
  "delay": 5,
  "timeout": 5000,
  "set": {
    "string": "https://server.com/path/info?location=%NAME%,event=%EID%,detected=true",
    "send": false
  },
  "reset": {
    "string": "PUT:https://server.com/path/info[JSONBODY]{\"location\":\"%NAME%\",\"event\":\"%EID%\",\"detected\":false}",
    "send": false
  }
}
```

**VMS 2 (Secondary):**
Samma struktur som VMS 1, möjliggör dual VMS-integration.

---

## WebSocket & Cloud

### Funktion

WebSocket-baserad molnintegration för centraliserad hantering.

### Konfiguration

- **Host:** wss://register.iotmanager.com
- **Rate Seconds:** 15
- **Alert Delay:** 5 sekunder
- **Ping Timeout:** 120 sekunder
- **Connect Timeout:** 300 sekunder
- **Reconnect Dwell:** 0 sekunder
- **Ping Seconds:** 5 sekunder
- **Delay Limit:** 86400 sekunder (24 timmar)
- **Revert URL Time:** 300 sekunder

### Funktioner

- Automatisk registrering i molnplattform
- Heartbeat-funktionalitet
- Alert-fördröjning
- Request headers support

---

## Docker Integration

### WebSocket Server

Lokal WebSocket-server för real-time sensordata.

**Implementation:** `python/halo_websocket_server.py`

**Funktioner:**
- Real-time WebSocket-server på port 8765
- Uppdateringar varje sekund
- Stödjer flera samtidiga klienter
- Automatisk återanslutning vid avbrott
- Mock-data fallback om Halo-klient inte är tillgänglig

**Konfiguration:**
```python
HALO_IP = "REDACTED_HALO_IP"
HALO_USER = "admin"
HALO_PASS = "REDACTED_HALO_PASSWORD"
UPDATE_INTERVAL = 1.0  # Sekunder
WS_PORT = 8765
```

**Dataformat:**
```json
{
  "type": "sensor_data",
  "data": {
    "timestamp": "2025-11-24T12:00:00",
    "sensors": {
      "temperature": { "value": 22.5, "unit": "°C" },
      "humidity": { "value": 45.0, "unit": "%" },
      "co2": { "value": 450, "unit": "ppm" }
    },
    "events": {
      "active": [],
      "count": 0
    },
    "status": "connected"
  }
}
```

**Docker Compose:**
```yaml
halo-websocket:
  build: .
  ports:
    - "8765:8765"
  environment:
    - HALO_IP=REDACTED_HALO_IP
    - HALO_USER=admin
    - HALO_PASS=REDACTED_HALO_PASSWORD
  restart: unless-stopped
```

**Användning:**
```javascript
const ws = new WebSocket('ws://localhost:8765');
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'sensor_data') {
        console.log('Temperature:', message.data.sensors.temperature.value);
    }
};
```

---

## InfluxDB Integration

Automatisk skrivning av Halo 3C sensordata till InfluxDB time-series database.

**Implementation:** `python/halo_influxdb_writer.py`

**Funktioner:**
- Automatisk datalogging var 15:e sekund (samma som datalog-systemet)
- Skriver till InfluxDB time-series database
- Alla sensorer loggas automatiskt
- Error handling och retry-logik

**Konfiguration:**
```python
HALO_IP = "REDACTED_HALO_IP"
HALO_USER = "admin"
HALO_PASS = "REDACTED_HALO_PASSWORD"

INFLUXDB_URL = "http://influxdb:8086"
INFLUXDB_TOKEN = "halo-token"
INFLUXDB_ORG = "halo-org"
INFLUXDB_BUCKET = "halo-sensors"
INTERVAL = 15  # Sekunder
```

**Data-struktur:**
- **Measurement:** `halo_sensors`
- **Tags:** `device`, `location`
- **Fields:** `temperature`, `humidity`, `co2`, `tvoc`, `pm25`, `pm10`, `aqi`, `noise`, `lux`, `motion`

**Docker Compose:**
```yaml
influxdb:
  image: influxdb:2.7
  ports:
    - "8086:8086"
  environment:
    - DOCKER_INFLUXDB_INIT_MODE=setup
    - DOCKER_INFLUXDB_INIT_USERNAME=admin
    - DOCKER_INFLUXDB_INIT_PASSWORD=adminpassword
    - DOCKER_INFLUXDB_INIT_ORG=halo-org
    - DOCKER_INFLUXDB_INIT_BUCKET=halo-sensors
  volumes:
    - influxdb-data:/var/lib/influxdb2

halo-influxdb:
  build: .
  environment:
    - HALO_IP=REDACTED_HALO_IP
    - HALO_USER=admin
    - HALO_PASS=REDACTED_HALO_PASSWORD
    - INFLUXDB_URL=http://influxdb:8086
    - INFLUXDB_TOKEN=halo-token
    - INFLUXDB_ORG=halo-org
    - INFLUXDB_BUCKET=halo-sensors
  depends_on:
    - influxdb
  restart: unless-stopped
```

---

## Variabler & Placeholders

### Enhetsvariabler

- `%NAME%` - Enhetsnamn
- `%IP%` - IP-adress
- `%MAC%` - MAC-adress
- `%FWVER%` - Firmware-version

### Event-variabler

- `%EID%` - Event ID
- `%SOURCE%` - Datakälla
- `%THR%` - Event-tröskelvärde
- `%VAL%` - Sensorvärde
- `%EVENTS%` - Lista över event-tillstånd
- `%EVENTVALS%` - Lista över event-värden
- `%ACTIVE%` - Lista över aktiva events

### Tidsvariabler

- `%DATE%` - Lokalt datum
- `%TIME%` - Lokal tid

### Sensorvariabler

- `%SENSOR:id%` - Värde från specifik sensor

**Exempel på sensor-ID:n:**
- `F` - Temperatur
- `RH` - Relativ luftfuktighet
- `Lux` - Belysning
- `TVOC` - Total Volatile Organic Compounds
- `CO2eq` - CO2-ekvivalent
- `PM2.5` - Partiklar 2.5µm
- `PM10` - Partiklar 10µm
- `NH3` - Ammoniak
- `NO2` - Kvävedioxid
- `CO` - Kolmonoxid
- `Noise` - Ljud
- `Move` - Rörelse
- `AQI` - Air Quality Index

### Special Characters

- `\\` - En backslash
- `\n` - Ny rad
- `\r` - Vagnretur
- `\u####` - Hex-kodad karaktär

### Autentiseringsvariabler

- `%USER%` - Användarnamn
- `%PSWD%` - Lösenord

---

## Praktiska Exempel

### Exempel 1: HTTP Integration med Custom Server

```
Set String: https://api.example.com/events?device=%NAME%&event=%EID%&value=%VAL%&time=%DATE% %TIME%
Reset String: PUT:https://api.example.com/events/%EID%[JSONBODY]{"status":"cleared","timestamp":"%DATE% %TIME%"}
Protocol: HTTP
Authentication: Bearer Token
User: (token)
```

### Exempel 2: Heartbeat med Sensor Data

```
Message: https://monitoring.example.com/heartbeat?device=%NAME%&temp=%SENSOR:F%&humidity=%SENSOR:RH%&co2=%SENSOR:CO2eq%&status=%ACTIVE%
Interval: 60 seconds
Protocol: HTTP
Authentication: Basic/Digest
```

### Exempel 3: Email Alert Configuration

```
SMTP Host: smtp.example.com
Port: 587
TLS: Enabled
From: alerts@example.com
To: admin@example.com, operator@example.com
```

---

## Rekommendationer

### För Säkerhetsövervakning

1. Använd Primary Integration för kritiska events
2. Aktivera Email alerts för omedelbar notifikation
3. Konfigurera Heartbeat för statusövervakning
4. Integrera med VMS för visuell verifiering

### För Byggautomatisering

1. Aktivera BACnet för HVAC-integration
2. Använd SNMP för centraliserad övervakning
3. Konfigurera Secondary Integration som backup
4. Aktivera Data Logging för historisk analys

### För Molnintegration

1. Aktivera Reverse Proxy/Cloud integration
2. Använd HTTPS för säkra connections
3. Konfigurera Bearer Token authentication
4. Implementera retry-logik i klienten

---

## Tekniska Specifikationer

### Nätverksprotokoll

- HTTP/HTTPS
- TCP/IP
- RTSP
- SNMP v1/v2c/v3
- BACnet/IP
- WebSocket (WSS)
- SMTP

### Dataformat

- JSON
- XML
- CSV
- URL-encoded queries
- HTTP Headers

### Autentisering

- HTTP Basic Authentication
- HTTP Digest Authentication
- Bearer Token
- OAuth2
- SNMP Community Strings
- SNMPv3 (USM)

### Portar

- HTTP: 80
- HTTPS: 443
- RTSP: 8554
- SNMP: 161
- BACnet: 47808
- SMTP: 25/587/465

---

## Säkerhetsöverväganden

1. **Alltid använd HTTPS** för produktionsmiljöer
2. **Rotera lösenord** regelbundet
3. **Begränsa nätverksåtkomst** via firewall-regler
4. **Använd stark autentisering** (OAuth2 eller Bearer Tokens)
5. **Aktivera HSTS** för säkra connections
6. **Logga all aktivitet** för säkerhetsgranskning
7. **Uppdatera firmware** regelbundet

---

**Se även:**
- [API_REFERENCE.md](API_REFERENCE.md) - API-referens för integration
- [EXAMPLES.md](EXAMPLES.md) - Praktiska integrationsexempel
- [QUICK_START.md](QUICK_START.md) - Snabbstart för integration

**Dokumentation skapad:** 2025-11-24

