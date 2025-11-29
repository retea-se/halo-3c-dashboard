# Halo 3C - Snabbstart

## Anslutning

**Device:** REDACTED_HALO_IP
**Auth:** admin / REDACTED_HALO_PASSWORD

```bash
# Bash
curl -u admin:REDACTED_HALO_PASSWORD http://REDACTED_HALO_IP/api/sensors/list

# Python
from requests.auth import HTTPBasicAuth
auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")
r = requests.get("http://REDACTED_HALO_IP/api/config", auth=auth)

# JavaScript
const auth = btoa("admin:REDACTED_HALO_PASSWORD");
fetch("http://REDACTED_HALO_IP/api/config", {
    headers: { 'Authorization': `Basic ${auth}` }
})
```

---

## Vanligaste Endpoints

| Endpoint | Beskrivning |
|----------|-------------|
| `/api/config` | Komplett konfiguration |
| `/api/config/gstate/latest` | Alla sensorvärden |
| `/api/config/gstate/relay` | Relay-status |
| `/api/config/gstate/event_state` | Aktiva händelser |
| `/api/sensors/list` | Lista sensorer med beskrivningar |
| `/api/logs` | Tillgängliga loggfiler |
| `/api/datalogs` | Sensorloggar över tid |
| `/api/device/netinfo` | Nätverksinformation |
| `/api/wavefiles/list` | Ljudfiler |

---

## Sensorvägar (för latest-endpoint)

### Miljö
```
htsensor/ctemp          # Temperatur (°C)
htsensor/ftemp          # Temperatur (°F)
htsensor/humidity       # Luftfuktighet (%)
htsensor/millibar       # Tryck (hPa)
luxsensor/aluxfilt      # Ljus (lux)
```

### Luftkvalitet
```
AQI/value               # Air Quality Index
co2sensor/co2           # CO2 (ppm)
co2sensor/tvoc          # TVOC (ppb)
pmsensor/raw/0          # PM1 (µg/m³)
pmsensor/raw/1          # PM2.5 (µg/m³)
pmsensor/raw/2          # PM10 (µg/m³)
gassensor/co             # CO (ppm)
gassensor/no2           # NO2 (ppb)
gassensor/nh3           # NH3 (ppm)
```

### Ljud & Säkerhet
```
audsensor/sum           # Ljudnivå (dB)
audsensor/rms0          # Aggression
audsensor/gs            # Skottlossning
audsensor/kw1           # Nyckelord 1
pir/max                 # Rörelse
accsensor/move          # Vibration
```

### Hälsoindex
```
HealthIndex/val         # Total (0-5)
HealthIndex/co2/val     # CO2 hälsoindex
HealthIndex/tvoc/val    # TVOC hälsoindex
HealthIndex/pm2p5/val   # PM2.5 hälsoindex
```

---

## Snabba Exempel

### Hämta temperatur

```bash
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/config/gstate/latest \
  | jq '.["htsensor/ctemp"]'
```

### Python - Övervaka CO2

```python
import requests
from requests.auth import HTTPBasicAuth
import time

auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")
url = "http://REDACTED_HALO_IP/api/config/gstate/latest"

while True:
    r = requests.get(url, auth=auth)
    data = r.json()
    co2 = data.get('co2sensor/co2', 0)
    print(f"CO2: {co2} ppm")
    if co2 > 1000:
        print("VARNING: Hög CO2!")
    time.sleep(10)
```

### JavaScript - Visa alla sensorer

```javascript
const auth = btoa("admin:REDACTED_HALO_PASSWORD");
fetch("http://REDACTED_HALO_IP/api/config/gstate/latest", {
    headers: { 'Authorization': `Basic ${auth}` }
})
.then(r => r.json())
.then(data => {
    console.log('Temperatur:', data['htsensor/ctemp'], '°C');
    console.log('CO2:', data['co2sensor/co2'], 'ppm');
    console.log('AQI:', data['AQI/value']);
    console.log('PM2.5:', data['pmsensor/raw/1'], 'µg/m³');
});
```

---

## Händelser

### Kontrollera aktiva händelser

```bash
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/config/gstate/event_state \
  | jq 'to_entries | map(select(.value.state == 1)) | .[].key'
```

### Python

```python
r = requests.get(
    "http://REDACTED_HALO_IP/api/config/gstate/event_state",
    auth=auth
)
events = r.json()

for event_id, data in events.items():
    if isinstance(data, dict) and data.get('state') == 1:
        print(f"AKTIV: {event_id}")
```

---

## Konfigurera Händelse

```python
# Hämta config
r = requests.get("http://REDACTED_HALO_IP/api/config", auth=auth)
config = r.json()

# Ändra tröskelvärde för CO2
for event in config['eventgen']['events']:
    if event['id'] == 'CO2cal':
        event['threshold'] = 800  # Ny tröskel
        event['emailset'] = True  # Aktivera e-post

# Uppdatera
requests.post(
    "http://REDACTED_HALO_IP/api/config",
    auth=auth,
    json=config
)
```

---

## Relay-status

```bash
# Hämta relay-status
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/config/gstate/relay

# Output:
# {"k1":0,"k2":0,"wd":1,"but":1,"test":0,"wdrdy":0,"pse":1}
# k1 = Relay 1 (0=off, 1=on)
# k2 = Relay 2 (0=off, 1=on)
# wd = Watchdog
# pse = PoE status
```

**OBS:** Direkt relay-kontroll verkar ej möjlig via API. Använd händelsesystemet:

```python
# Konfigurera händelse att aktivera relay
event['relay1'] = 1  # Aktivera relay 1 vid trigger
event['relay2'] = 0  # Relay 2 ingen åtgärd
```

---

## Nätverksinformation

```bash
# WiFi-status
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/device/wifistat

# Nätverksinfo
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/device/netinfo

# Tillgängliga WiFi-nätverk
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/device/ssids
```

---

## Ljudfiler

```bash
# Lista ljudfiler
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/wavefiles/list

# Användaruppladdade filer
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/wavefiles/list?user=1
```

---

## Loggar

```bash
# Lista loggfiler
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/logs

# Output: ["20251123.log","drv20251123.log"]

# Hämta dataloggar
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/datalogs
```

---

## Reboot & Administrativa Kommandon

```bash
# Hämta verifieringsnyckel
KEY=$(curl -s -u admin:REDACTED_HALO_PASSWORD \
  "http://REDACTED_HALO_IP/api/device/exec?command=get-key")

# Reboot (kräver nyckel)
curl -u admin:REDACTED_HALO_PASSWORD \
  "http://REDACTED_HALO_IP/api/device/exec?command=reboot&verify=$KEY"
```

---

## Troubleshooting

### HTTPS SSL-fel

```python
import urllib3
urllib3.disable_warnings()
# eller
requests.get(url, verify=False)
```

### CORS-problem i webbläsare

Använd proxy eller backend-server. Direkt CORS från webbläsare kan vara blockerat.

### Timeout

```python
requests.get(url, timeout=10)  # 10 sekunders timeout
```

### Autentiseringsfel

Kontrollera användarnamn/lösenord:
```bash
curl -v -u admin:REDACTED_HALO_PASSWORD http://REDACTED_HALO_IP/api/config
```

---

## Tips & Tricks

1. **Polling-intervall:** Undvik att polla för ofta. 5-10 sekunder är lagom.

2. **Batch requests:** Använd `/api/config/gstate/latest` för att få alla sensorer på en gång.

3. **Hysteres:** Använd hysteres i händelsekonfiguration för att undvika flapping.

4. **Pause:** Använd `pausem` för att pausa händelser efter trigger.

5. **Conditions:** Kombinera flera sensorer med `conditions`-fältet.

6. **Dataloggar:** Använd `/api/datalogs` för historisk data istället för att själv logga.

7. **Health Index:** Använd hälsoindex för snabb översikt av IAQ.

---

## Användbara jq-filter

```bash
# Extrahera alla sensorvärden över 0
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/config/gstate/latest \
  | jq 'to_entries | map(select(.value > 0))'

# Visa endast luftkvalitet
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/config/gstate/latest \
  | jq '{
      aqi: .["AQI/value"],
      co2: .["co2sensor/co2"],
      tvoc: .["co2sensor/tvoc"],
      pm25: .["pmsensor/raw/1"]
    }'

# Lista aktiva händelser
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/config/gstate/event_state \
  | jq 'to_entries | map(select(.value.state == 1)) | map(.key)'
```

---

## Python-klient

Använd den färdiga Python-klienten:

```python
from halo_client import HaloClient

client = HaloClient("REDACTED_HALO_IP", "admin", "REDACTED_HALO_PASSWORD")

# Hämta data
temp = client.get_temperature()
co2 = client.get_co2()
aqi = client.get_aqi()

# Kontrollera händelser
if client.is_event_active("Vape"):
    print("VARNING: Vaping detekterat!")

# Skriv ut sammanfattning
client.print_summary()
```

---

## Webb-dashboard

Öppna `web_control_example.html` i webbläsare för ett färdigt dashboard med:
- Real-time data (auto-refresh 5 sek)
- Visuella statusindikatorer
- Responsiv design

---

**Se även:**
- [API_REFERENCE.md](API_REFERENCE.md) - Komplett API-referens
- [EXAMPLES.md](EXAMPLES.md) - Fler praktiska exempel
- [INTEGRATIONS.md](INTEGRATIONS.md) - Integrationsmöjligheter

