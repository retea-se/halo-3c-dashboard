# Halo 3C - Komplett API-referens

## Översikt

Halo 3C erbjuder ett omfattande REST API med **450+ dokumenterade endpoints**. Denna referens dokumenterar alla viktiga endpoints organiserade per kategori.

**Anslutning:**

- IP: REDACTED_HALO_IP
- Autentisering: HTTP Basic Auth (admin / REDACTED_HALO_PASSWORD)
- Portar: HTTP (80), HTTPS (443)

---

## Innehållsförteckning

1. [Sensordata](#sensordata)
2. [Händelser](#händelser)
3. [Konfiguration](#konfiguration)
4. [Kontroll & I/O](#kontroll--io)
5. [Enhetsinformation](#enhetsinformation)
6. [Loggar & Data](#loggar--data)
7. [Avancerade Endpoints](#avancerade-endpoints)
8. [Komplett Endpoint-lista](#komplett-endpoint-lista)

---

## Sensordata

### GET /api/config/gstate/latest

**Alla senaste sensorvärden** - Detta är den viktigaste endpointen för sensordata.

**Response:** JSON med alla 43 sensorer

**Exempel:**

```bash
curl -u admin:REDACTED_HALO_PASSWORD http://REDACTED_HALO_IP/api/config/gstate/latest
```

**Viktiga sensorvägar:**

- `htsensor/ctemp` - Temperatur (°C)
- `htsensor/humidity` - Luftfuktighet (%)
- `co2sensor/co2` - CO2 (ppm)
- `co2sensor/tvoc` - TVOC (ppb)
- `pmsensor/raw/1` - PM2.5 (µg/m³)
- `pmsensor/raw/2` - PM10 (µg/m³)
- `AQI/value` - Air Quality Index
- `audsensor/sum` - Ljudnivå (dB)
- `pir/max` - Rörelse
- `HealthIndex/val` - Hälsoindex (0-5)

**Se [SENSORS.md](SENSORS.md) för komplett lista över alla 43 sensorer.**

### GET /api/sensors/list

Listar alla sensorer med beskrivningar.

**Response:** Array av sensor-objekt med path, description, short name

### GET /api/config/gstate/AQI

Detaljerad AQI-data inklusive timvärden och beräkningar.

**Sub-endpoints:**

- `/api/config/gstate/AQI/onehour` - En-timme period
- `/api/config/gstate/AQI/pm2p5` - PM2.5 AQI-data
- `/api/config/gstate/AQI/pm10` - PM10 AQI-data
- `/api/config/gstate/AQI/co` - CO AQI-data
- `/api/config/gstate/AQI/no2` - NO2 AQI-data

---

## Händelser

### GET /api/config/gstate/event_state

**Aktiva händelser och deras status** - Detta är den viktigaste endpointen för händelser.

**Response:** JSON med alla händelser och deras status

**Exempel:**

```python
r = requests.get("http://REDACTED_HALO_IP/api/config/gstate/event_state", auth=auth)
events = r.json()

for event_id, data in events.items():
    if isinstance(data, dict) and data.get('state') == 1:
        print(f"AKTIV: {event_id}")
```

### GET /api/config/gstate/config/eventgen/events

Händelseregler och konfiguration.

**Response:** Array med 26 händelseregler

**Händelsetyper:**

- **Grupp 1:** Vape, THC, Masking, Smoking
- **Grupp 4:** Gunshot, Aggression, Tamper, Help, Motion
- **Grupp 8:** Health_Index, AQI, TVOC, CO2cal, PM2.5
- **Grupp 16:** PM1, PM10, Humidity, Temp_C, NO2, CO, NH3, Light, Sound

**Händelsekonfiguration:**

```json
{
  "id": "Vape",
  "enabled": true,
  "source": "pmsensor/raw/2",
  "threshold": 35,
  "operator": "gte",
  "hyst": 0,
  "pausem": 0,
  "relay1": 0,
  "relay2": 0,
  "ledclr": 65280,
  "ledpat": 0,
  "ledpri": 1,
  "sound": "",
  "emailset": true,
  "vmsset": true,
  "cloud": true
}
```

---

## Konfiguration

### GET /api/config

**Komplett enhetskonfiguration** - Alla inställningar.

**Response:** JSON-objekt med alla konfigurationskategorier

**Huvudkategorier:**

- `drivers` - Driver-konfiguration
- `rtsp` - RTSP streaming
- `algo` - Detektionsalgoritmer
- `revproxy` - Molnintegration
- `volume` - Högtalarvolym
- `devicename` - Enhetsnamn
- `ident` - Platsinformation
- `vms` - VMS-integration
- `email` - E-postinställningar
- `datalog` - Dataloggningsinställningar
- `snmp` - SNMP-konfiguration
- `bacnet` - BACnet-konfiguration
- `sensor_config` - Sensorkalibrering
- `smtp` - SMTP-serverinställningar
- `api` - API-serverinställningar
- `eventgen` - Händelsegenerering

### POST /api/config

Uppdatera konfiguration (partiell uppdatering stöds).

**Exempel:**

```python
config = requests.get("http://REDACTED_HALO_IP/api/config", auth=auth).json()
config['devicename'] = 'New_Name'
requests.post("http://REDACTED_HALO_IP/api/config", auth=auth, json=config)
```

### GET /api/config/gstate

Global systemstatus med real-time data.

**Response:** JSON med:

- `cloud` - Molnanslutningsstatus
- `config` - Aktuell konfiguration
- `email` - E-poststatus
- `event_state` - Aktiva händelser
- `latest` - Senaste sensoravläsningar
- `relay` - Relay-status
- `tls1` - TLS-konfiguration

### REST Action Endpoints

Alternativa sätt att hantera konfiguration:

```
GET  /api/config/get      - Hämta konfiguration
POST /api/config/set      - Sätt konfiguration
POST /api/config/update   - Uppdatera konfiguration
POST /api/config/save     - Spara konfiguration
POST /api/config/create   - Skapa ny konfiguration
POST /api/config/delete   - Ta bort konfiguration
```

### State Aliases

```
GET /api/config/state    - Alias för /api/config/gstate
GET /api/config/global   - Alias för /api/config/gstate
```

---

## Kontroll & I/O

### Relay-kontroll

#### GET /api/config/gstate/relay

Hämtar relay-status.

**Response:**

```json
{
  "k1": 0, // Relay 1 (0=off, 1=on)
  "k2": 0, // Relay 2 (0=off, 1=on)
  "wd": 1, // Watchdog
  "but": 1, // Button
  "test": 0, // Test mode
  "wdrdy": 0, // Watchdog ready
  "pse": 1 // PoE status
}
```

#### POST /api/config/gstate/relay/k1

Sätt relay 1 (experimentellt - direkt effekt oklart).

**OBS:** Relay-kontroll görs normalt via händelsesystemet:

```python
event['relay1'] = 1  # Aktivera relay 1 vid trigger
```

### LED-kontroll

#### GET /api/config/gstate/LED

LED-status och kontroll.

**Response:**

```json
{
  "color": 0, // LED-färg (RGB integer)
  "pattern": 0, // LED-mönster-ID
  "volpower": 3060, // Volym/power-nivå
  "volumelim": 115, // Volymgräns
  "testreq": 0, // Test-förfrågan
  "testthr": 0 // Test-tröskel
}
```

#### POST /api/config/gstate/LED/color

Sätt LED-färg (RGB integer, t.ex. 0xFF0000 för röd).

**Exempel:**

```python
# Röd LED
red_color = 16711680  # 0xFF0000
requests.post(
    "http://REDACTED_HALO_IP/api/config/gstate/LED/color",
    auth=auth,
    json=red_color
)
```

### Force System

Tvinga ljud och LED-outputs oberoende av händelser.

#### POST /api/config/gstate/force/sound

Tvinga ljudfil att spela.

**Exempel:**

```python
requests.post(
    "http://REDACTED_HALO_IP/api/config/gstate/force/sound",
    auth=auth,
    json="Emergency2C2N.wav"
)
```

#### POST /api/config/gstate/force/ledclr

Tvinga LED-färg.

#### POST /api/config/gstate/force/ledpat

Tvinga LED-mönster.

**Sub-endpoints:**

- `/api/config/gstate/force/sndsecs` - Ljudlängd (sekunder)
- `/api/config/gstate/force/ledsecs` - LED-längd (sekunder)
- `/api/config/gstate/force/secs` - Total längd

---

## Enhetsinformation

### GET /api/device/netinfo

Nätverksinformation.

### GET /api/device/gettimeinfo

Tidsinställningar.

### GET /api/device/users

Listar användare.

### GET /api/device/ssids

Listar tillgängliga WiFi-nätverk.

### GET /api/device/wifistat

WiFi-status.

### GET /api/device/countries

Listar tillgängliga länder.

### GET /api/device/uilangs

Listar tillgängliga UI-språk.

### GET /api/device/kwdfiles

Listar nyckelordsfiler för ljuddetektion.

### Administrativa kommandon

#### GET /api/device/exec?command=get-key

Hämta verifieringsnyckel (krävs för reboot).

#### GET /api/device/exec?command=reboot&verify=KEY

Reboot enheten (kräver verifieringsnyckel).

**Exempel:**

```bash
KEY=$(curl -s -u admin:REDACTED_HALO_PASSWORD \
  "http://REDACTED_HALO_IP/api/device/exec?command=get-key")
curl -u admin:REDACTED_HALO_PASSWORD \
  "http://REDACTED_HALO_IP/api/device/exec?command=reboot&verify=$KEY"
```

---

## Loggar & Data

### GET /api/logs

Listar tillgängliga loggfiler.

**Response:** Array med filnamn, t.ex. `["20251123.log", "drv20251123.log"]`

### GET /api/datalogs

Sensorloggar över tid (CSV-format).

**Format:** `YYYYMMDD,HHMMSS,SENSOR_TYPE,{JSON_DATA}`

### GET /api/config/gstate/workers/lifetimehrs

Drifttimmar för enheten.

---

## Ljudfiler

### GET /api/wavefiles/list

Listar tillgängliga ljudfiler.

### GET /api/wavefiles/list?user=1

Listar användaruppladdade ljudfiler.

### POST /api/wavefiles/add/

Ladda upp ny ljudfil (multipart/form-data).

### POST /api/wavefiles/rem/

Ta bort ljudfil.

---

## Grafik & Visualisering

### GET /api/gfx/dashboardframe.jpg

Dashboard-bild (JPG, ~87 KB).

### GET /api/gfx/dashboardframe.jpeg

Dashboard-bild (JPEG).

### GET /api/gfx/dashboard.svg

Dashboard som SVG.

### GET /api/gfx/stream.jpg

Videoström JPG (MJPEG, Partial Content).

### GET /api/gfx/liveresz.svg

Live status-grafik (SVG).

### GET /api/gfx/thermal.svg?mac={MAC}

Termisk grafik för specifik enhet (SVG).

---

## Avancerade Endpoints

### Hidden & Kalibrering

#### GET /api/config/gstate/hidden

**Dold endpoint** med hårdvarukalibrering, temperaturkompensering och serienummer.

**Innehåll:**

- `H3Vtempcomp` - Temperaturkompensering (version?)
- `H3tempcomp` - Temperaturkompensering (Halo 3)
- `about` - Serienummer för sensorer

**Användning:** Kalibrering för olika monteringspositioner (ceil, wall, desk).

#### GET /api/config/gstate/sensorcal

Sensorkalibrering för gassensorer (CO, NO2, NH3).

**Sub-endpoints:**

- `/api/config/gstate/sensorcal/co` - CO-kalibrering
- `/api/config/gstate/sensorcal/nh3` - NH3-kalibrering
- `/api/config/gstate/sensorcal/no2` - NO2-kalibrering
- `/api/config/gstate/sensorcal/Zco` - Z-värde CO
- `/api/config/gstate/sensorcal/Fco` - F-faktor CO

### CO2-kontroll

#### GET /api/config/gstate/co2ctl

CO2-kontroll och kalibrering.

**Sub-endpoints:**

- `/api/config/gstate/co2ctl/reqid` - Request ID för kalibrering
- `/api/config/gstate/co2ctl/co2offset` - CO2 offset-justering
- `/api/config/gstate/co2ctl/tvocoffset` - TVOC offset-justering

**Användning:** POST för att kalibrera CO2/TVOC-sensorn.

### Baseline-kontroll

#### GET /api/config/gstate/Baselinectl

Baseline-kontroll för sensorer.

**Sub-endpoints:**

- `/api/config/gstate/Baselinectl/devisense` - Avvikelsekänslighet
- `/api/config/gstate/Baselinectl/saverate` - Sparfrekvens (sekunder)

**Användning:** Sensorer använder baseline för att normalisera värden över tid.

### Molnintegration

#### GET /api/config/gstate/cloud

Molnanslutningsstatus.

**Sub-endpoints:**

- `/api/config/gstate/cloud/state` - Anslutningsstatus (Connected/Disconnected)
- `/api/config/gstate/cloud/domain` - Molndomän
- `/api/config/gstate/cloud/alertsOn` - Aviseringar aktiverade

### Workers (Systemprocesser)

#### GET /api/config/gstate/workers

Worker-processer som hanterar sensorer, händelser, networking etc.

**Sub-endpoints:**

- `/api/config/gstate/workers/0-4` - Worker 0-4 status
- `/api/config/gstate/workers/lifetimehrs` - Drifttimmar
- `/api/config/gstate/workers/starttime` - Starttid (timestamp)

### AMPX System

```
GET /api/config/ampx                            - AMPX-konfiguration
GET /api/config/gstate/config/___ampx          - AMPX global state
GET /api/config/gstate/config/___ampx/devices   - AMPX-enheter
GET /api/config/gstate/config/___ampx/enabled   - AMPX aktiverad
```

**Vad är AMPX?** Oklart, men verkar vara ett internt system.

---

## Komplett Endpoint-lista

### Sammanfattning per Kategori

| Kategori                      | Antal Endpoints | Beskrivning                         |
| ----------------------------- | --------------- | ----------------------------------- |
| `/api/config/gstate/*`        | 336             | Global state, sensorer, kalibrering |
| `/api/config/*`               | 75              | Konfiguration och actions           |
| `/api/device/*`               | 30              | Enhetsinformation                   |
| `/api/sensors/*`              | 3               | Sensordata                          |
| `/api/logs` + `/api/datalogs` | 2               | Loggar                              |
| `/api/wavefiles/*`            | 3               | Ljudfiler                           |
| `/api/gfx/*`                  | 3               | Grafik/visualisering                |
| **TOTAL**                     | **450+**        | Alla endpoints                      |

### Mest Användbara Endpoints

**För sensordata:**

1. `/api/config/gstate/latest` - Alla sensorer
2. `/api/sensors/list` - Sensorbeskrivningar

**För händelser:**

1. `/api/config/gstate/event_state` - Aktiva händelser
2. `/api/config/gstate/config/eventgen/events` - Händelseregler

**För kontroll:**

1. `/api/config/gstate/force/*` - Tvinga outputs
2. `/api/config/gstate/LED/*` - LED-kontroll
3. `/api/config/gstate/relay` - Relay-status

**För system:**

1. `/api/config` - Hela konfigurationen
2. `/api/device/exec?command=get-key` - Verifieringsnyckel
3. `/api/config/gstate/workers/lifetimehrs` - Drifttid

**För avancerade användare:**

1. `/api/config/gstate/hidden` - Hårdvarukalibrering
2. `/api/config/gstate/sensorcal` - Sensorkalibrering
3. `/api/config/gstate/cloud` - Molnstatus

---

## HTTP-metoder

### OPTIONS Support

Följande endpoints stöder OPTIONS-metoden för CORS:

- `/api/config` (OPTIONS)
- `/api/sensors/list` (OPTIONS)
- `/api/device/netinfo` (OPTIONS)

**Användning:** Användbart för webapps att kontrollera tillåtna metoder.

### POST/PUT Support

Följande endpoints accepterar POST/PUT för kontroll:

- `/api/config/gstate/LED/color` (POST/PUT)
- `/api/config/gstate/LED/pattern` (POST/PUT)
- `/api/config/gstate/force/sound` (POST/PUT)
- `/api/config/gstate/force/ledclr` (POST/PUT)
- `/api/config/gstate/relay/k1` (POST/PUT)
- `/api/config/relay/k2` (POST/PUT)

**OBS:** POST/PUT accepteras (200 OK) men direkt effekt oklart. Kan kräva specifikt format eller aktivering via annat endpoint.

---

## Begränsningar & Observationer

1. **Relay-kontroll:** Direkt relay-kontroll via API verkar inte vara fullt implementerad. Relays styrs normalt av händelsesystemet.

2. **LED-kontroll:** LED-färg och mönster styrs primärt av händelser, men POST/PUT till force-endpoints kan fungera.

3. **Reboot:** Kräver verifieringsnyckel från `/api/device/exec?command=get-key`

4. **HTTPS:** Enheten använder self-signed certifikat. Inaktivera SSL-verifiering i kod eller lägg till certifikatet i trust store.

5. **Rate Limiting:** Ingen synlig rate limiting, men undvik att överbelasta enheten.

---

## Best Practices

1. Använd händelsesystemet för automation
2. Konfigurera tröskelvärden med hysteres
3. Använd `pausem` för att undvika spam
4. Kombinera flera sensorer med `conditions`
5. Testa ljudfiler innan deployment
6. Använd `/api/config/gstate/latest` för att få alla sensorer på en gång
7. Polla med 5-10 sekunders intervall

---

**Se även:**

- [QUICK_START.md](QUICK_START.md) - Snabbstart och exempel
- [SENSORS.md](SENSORS.md) - Detaljerad sensor-dokumentation
- [EXAMPLES.md](EXAMPLES.md) - Praktiska kodexempel
- [INTEGRATIONS.md](INTEGRATIONS.md) - Integrationsmöjligheter

**Dokumentation skapad:** 2025-11-24
**Total endpoints dokumenterade:** 450+
