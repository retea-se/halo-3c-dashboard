# Halo 3C Smart Sensor - Dokumentation

## Översikt

Halo 3C är en avancerad IoT-smart sensor med omfattande capabilities för luftkvalitet, ljud, rörelse och säkerhetsövervakning. Denna dokumentation innehåller allt som behövs för att bygga innovativa lösningar med Halo 3C.

**Enhetsinformation:**
- IP: REDACTED_HALO_IP
- Namn: Halo_Device
- Autentisering: HTTP Basic Auth
- Portar: HTTP (80), HTTPS (443)

---

## Snabbstart

### Python

```python
from halo_client import HaloClient

# Anslut
client = HaloClient("REDACTED_HALO_IP", "admin", "REDACTED_HALO_PASSWORD")

# Hämta sensordata
temp = client.get_temperature()
co2 = client.get_co2()
aqi = client.get_aqi()

# Kontrollera händelser
if client.is_event_active("Vape"):
    print("VARNING: Vaping detekterat!")

# Skriv ut sammanfattning
client.print_summary()
```

### JavaScript/Webbläsare

```javascript
const auth = btoa("admin:REDACTED_HALO_PASSWORD");
const HALO_IP = "REDACTED_HALO_IP";

fetch(`http://${HALO_IP}/api/config/gstate/latest`, {
    headers: { 'Authorization': `Basic ${auth}` }
})
.then(r => r.json())
.then(data => {
    console.log('Temperatur:', data['htsensor/ctemp'], '°C');
    console.log('CO2:', data['co2sensor/co2'], 'ppm');
});
```

### curl

```bash
# Hämta sensordata
curl -u admin:REDACTED_HALO_PASSWORD http://REDACTED_HALO_IP/api/config/gstate/latest

# Hämta konfiguration
curl -u admin:REDACTED_HALO_PASSWORD http://REDACTED_HALO_IP/api/config

# Lista sensorer
curl -u admin:REDACTED_HALO_PASSWORD http://REDACTED_HALO_IP/api/sensors/list
```

---

## Dokumentationsstruktur

### 📘 [QUICK_START.md](QUICK_START.md)
Snabbstart och vanliga exempel för att komma igång direkt.

### 📚 [API_REFERENCE.md](API_REFERENCE.md)
Komplett API-referens med alla 450+ endpoints, request/response-format och användningsexempel.

### 🔗 [INTEGRATIONS.md](INTEGRATIONS.md)
Alla integrationsmöjligheter: MQTT, SNMP, BACnet, RTSP, WebSocket, InfluxDB, Docker och mer.

### 📊 [SENSORS.md](SENSORS.md)
Detaljerad dokumentation om alla 43 sensorer, händelsetyper och hur de används.

### 💻 [EXAMPLES.md](EXAMPLES.md)
Praktiska kodexempel och användningsfall för olika scenarion.

---

## Huvudfunktioner

### 🌡️ Miljösensorer
- **Temperatur** (Celsius/Fahrenheit)
- **Luftfuktighet** (%)
- **Lufttryck** (hPa/inHg)
- **Ljusnivå** (Lux)

### 💨 Luftkvalitetssensorer
- **AQI** (Air Quality Index 0-500)
- **CO2** (ppm) - Kalibrerad och ekvivalent
- **TVOC** (Total VOC, ppb)
- **PM1, PM2.5, PM10** (Partiklar, µg/m³)
- **NO2** (Kvävedioxid, ppb)
- **CO** (Kolmonoxid, ppm)
- **NH3** (Ammoniak, ppm)

### 🔊 Ljudsensorer & AI-detektion
- **Ljudnivå** (dB)
- **Aggression-detektor**
- **Skottlossning-detektor**
- **Nyckelordsdetektion** (t.ex. "help", "emergency")
- Dubbla mikrofoner (hög/låg förstärkning)

### 🏃 Rörelsesensorer
- **PIR-sensor** (Passiv infraröd)
- **Accelerometer** (3-axlad, x/y/z)
- **Rörelseanalys**

### 🧠 Intelligenta Funktioner
- **Hälsoindex** (0-5) - Totalt och per sensor
- **Vaping/THC-detektion**
- **Rökning-detektion**
- **Maskeringsförsök-detektion**

### ⚡ I/O & Kontroll
- **2x Relays** (k1, k2)
- **Watchdog**
- **PoE-status**
- **LED-kontroll** (färg, mönster, prioritet)

### 🔔 Händelsesystem
- 26+ förkonfigurerade händelsetyper
- Tröskelvärdesbaserade triggers
- E-postaviseringar
- VMS-integration
- Ljudaviseringar
- Relay-aktivering

---

## Användningsområden

### 🏫 Skolor & Utbildning
- Vape/rökning-detektion på toaletter
- Mobbning/aggression-detektion
- Nödrop-detektion
- Luftkvalitetsövervakning

### 🏢 Kontor & Kommersiellt
- IAQ-övervakning (Indoor Air Quality)
- Energioptimering via CO2/beläggning
- Säkerhetsövervakning
- Compliance-rapportering

### 🏥 Vård & Äldreboenden
- Falldetektering
- Nödrop-detektion
- Luftkvalitet för känsliga personer
- Ljudövervakning

### 🏭 Industri
- Gassäkerhet (CO, NO2, NH3)
- Partikelövervakning
- Maskinsäkerhet
- Arbetsmiljö

---

## Integration

### 📊 Data & Protokoll
- **MQTT** - Cloud connectivity
- **SNMP** - Network management
- **BACnet** - Building automation
- **RTSP** - Streaming
- **REST API** - HTTP/HTTPS
- **WebSocket** - Real-time data

### 🔧 Verktyg & Kod
- **halo_client.py** - Färdig Python-klient med 40+ metoder
- **web_control_example.html** - Webbgränssnitt med real-time dashboard
- **Docker** - Färdiga integrationer för WebSocket och InfluxDB

---

## Viktigaste Endpoints

### Sensordata
```
GET /api/config/gstate/latest          # Alla sensorer (43 st)
GET /api/sensors/list                  # Sensorbeskrivningar
GET /api/config/gstate/AQI             # AQI-detaljer
```

### Händelser
```
GET /api/config/gstate/event_state     # Aktiva händelser
GET /api/config/gstate/config/eventgen # Händelseregler
```

### Konfiguration
```
GET  /api/config                       # Hela konfigurationen
POST /api/config                       # Uppdatera konfiguration
GET  /api/config/gstate                # Global state
```

### Kontroll
```
POST /api/config/gstate/LED/color      # LED-färg
POST /api/config/gstate/force/sound    # Tvinga ljud
POST /api/config/gstate/relay/k1       # Relay 1
```

**Total:** 450+ fungerande endpoints dokumenterade

---

## Nästa Steg

1. **Läs [QUICK_START.md](QUICK_START.md)** för att komma igång direkt
2. **Granska [API_REFERENCE.md](API_REFERENCE.md)** för detaljerad API-dokumentation
3. **Utforska [INTEGRATIONS.md](INTEGRATIONS.md)** för integrationsmöjligheter
4. **Se [EXAMPLES.md](EXAMPLES.md)** för praktiska exempel

---

## Support & Kontakt

För mer information om Halo 3c:
- Tillverkare: IPVideo Corporation
- Produkt: Halo 3c Smart Sensor

---

**Dokumentation skapad:** 2025-11-24
**Endpoints dokumenterade:** 450+
**Sensorer kartlagda:** 43
**Händelsetyper:** 26
