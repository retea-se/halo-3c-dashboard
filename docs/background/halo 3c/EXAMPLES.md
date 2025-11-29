# Halo 3C - Praktiska Exempel

## Översikt

Denna dokumentation innehåller praktiska kodexempel och användningsfall för Halo 3C.

---

## Python-exempel

### Grundläggande Anslutning

```python
import requests
from requests.auth import HTTPBasicAuth

HALO_IP = "REDACTED_HALO_IP"
auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")

# Hämta konfiguration
response = requests.get(f'http://{HALO_IP}/api/config', auth=auth)
config = response.json()
```

### Hämta Sensordata

```python
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")
url = "http://REDACTED_HALO_IP/api/config/gstate/latest"

response = requests.get(url, auth=auth)
latest_data = response.json()

print(f"Temperatur: {latest_data.get('htsensor/ctemp', 'N/A')}°C")
print(f"Luftfuktighet: {latest_data.get('htsensor/humidity', 'N/A')}%")
print(f"CO2: {latest_data.get('co2sensor/co2', 'N/A')} ppm")
print(f"AQI: {latest_data.get('AQI/value', 'N/A')}")
```

### Övervaka CO2

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

### Kontrollera Aktiva Händelser

```python
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")
url = "http://REDACTED_HALO_IP/api/config/gstate/event_state"

response = requests.get(url, auth=auth)
events = response.json()

for event_id, event_data in events.items():
    if isinstance(event_data, dict) and event_data.get('state') == 1:
        print(f"VARNING: {event_id} är aktiv!")
```

### Konfigurera Händelse

```python
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")
base_url = "http://REDACTED_HALO_IP"

# Hämta nuvarande konfiguration
response = requests.get(f'{base_url}/api/config', auth=auth)
config = response.json()

# Hitta och modifiera en händelse
for event in config['eventgen']['events']:
    if event['id'] == 'CO2cal':
        event['threshold'] = 800  # Ändra tröskelvärde till 800 ppm
        event['emailset'] = True  # Aktivera e-postavisering
        event['sound'] = 'Emergency2C2N.wav'  # Spela ljud

# Uppdatera konfiguration
response = requests.post(
    f'{base_url}/api/config',
    auth=auth,
    json=config
)
```

### Använd HaloClient

```python
from halo_client import HaloClient

# Anslut
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

## JavaScript-exempel

### Grundläggande Anslutning

```javascript
const HALO_IP = "REDACTED_HALO_IP";
const auth = btoa("admin:REDACTED_HALO_PASSWORD");

fetch(`http://${HALO_IP}/api/config`, {
    headers: {
        'Authorization': `Basic ${auth}`
    }
})
.then(response => response.json())
.then(data => console.log(data));
```

### Hämta Sensordata

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
    console.log('AQI:', data['AQI/value']);
    console.log('PM2.5:', data['pmsensor/raw/1'], 'µg/m³');
});
```

### Real-time Dashboard

```javascript
const auth = btoa("admin:REDACTED_HALO_PASSWORD");
const HALO_IP = "REDACTED_HALO_IP";

function updateDashboard() {
    fetch(`http://${HALO_IP}/api/config/gstate/latest`, {
        headers: { 'Authorization': `Basic ${auth}` }
    })
    .then(r => r.json())
    .then(data => {
        document.getElementById('temp').textContent =
            data['htsensor/ctemp'] + '°C';
        document.getElementById('co2').textContent =
            data['co2sensor/co2'] + ' ppm';
        document.getElementById('aqi').textContent =
            data['AQI/value'];
    });
}

// Uppdatera var 5:e sekund
setInterval(updateDashboard, 5000);
updateDashboard();
```

### WebSocket-anslutning

```javascript
const ws = new WebSocket('ws://localhost:8765');

ws.onopen = () => {
    console.log('Connected to Halo WebSocket');
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'sensor_data') {
        console.log('Temperature:', message.data.sensors.temperature.value);
        console.log('CO2:', message.data.sensors.co2.value);
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket closed');
};
```

---

## Bash/curl-exempel

### Hämta Sensordata

```bash
curl -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/config/gstate/latest
```

### Hämta Temperatur

```bash
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/config/gstate/latest \
  | jq '.["htsensor/ctemp"]'
```

### Lista Aktiva Händelser

```bash
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/config/gstate/event_state \
  | jq 'to_entries | map(select(.value.state == 1)) | .[].key'
```

### Visa Endast Luftkvalitet

```bash
curl -s -u admin:REDACTED_HALO_PASSWORD \
  http://REDACTED_HALO_IP/api/config/gstate/latest \
  | jq '{
      aqi: .["AQI/value"],
      co2: .["co2sensor/co2"],
      tvoc: .["co2sensor/tvoc"],
      pm25: .["pmsensor/raw/1"]
    }'
```

### Reboot Enheten

```bash
# Hämta verifieringsnyckel
KEY=$(curl -s -u admin:REDACTED_HALO_PASSWORD \
  "http://REDACTED_HALO_IP/api/device/exec?command=get-key")

# Reboot
curl -u admin:REDACTED_HALO_PASSWORD \
  "http://REDACTED_HALO_IP/api/device/exec?command=reboot&verify=$KEY"
```

---

## Användningsfall

### 1. Realtidsövervakning

```python
import requests
from requests.auth import HTTPBasicAuth
import time
from datetime import datetime

auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")
url = "http://REDACTED_HALO_IP/api/config/gstate/latest"

while True:
    response = requests.get(url, auth=auth)
    data = response.json()

    print(f"[{datetime.now()}]")
    print(f"  Temperatur: {data.get('htsensor/ctemp', 'N/A')}°C")
    print(f"  CO2: {data.get('co2sensor/co2', 'N/A')} ppm")
    print(f"  AQI: {data.get('AQI/value', 'N/A')}")
    print()

    time.sleep(15)
```

### 2. Event-driven Integration

```python
from flask import Flask, request, jsonify
import requests
from requests.auth import HTTPBasicAuth

app = Flask(__name__)
auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")
HALO_IP = "REDACTED_HALO_IP"

@app.route('/halo/webhook', methods=['POST'])
def halo_webhook():
    event = request.json
    if event.get('status') == 'active':
        send_alert(event)
        trigger_camera_recording()
    return jsonify({'status': 'ok'})

def send_alert(event):
    # Skicka alert till extern system
    pass

def trigger_camera_recording():
    # Starta kamerainspelning
    pass
```

### 3. Data-analys

```python
import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime, timedelta

auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")
HALO_IP = "REDACTED_HALO_IP"

# Samla historisk data
sensor_history = []

for day in range(7):
    # Hämta dataloggar (förenklat exempel)
    date = (datetime.now() - timedelta(days=day)).strftime('%Y%m%d')
    # Implementera loggning baserat på dataloggar
    pass

# Analysera trender
def analyze_trends(history):
    # Implementera trendanalys
    pass
```

### 4. HVAC-integration via BACnet

```python
# Läs sensorvärden via BACnet
# (Kräver BACnet-bibliotek)
from bacpypes.core import run
from bacpypes.primitivedata import Real

# Läs CO2-värde
co2 = read_bacnet_object('CO2')

if co2 > 1000:
    increase_ventilation()
```

### 5. Dashboard med Grafana

```python
# Skriv data till InfluxDB för Grafana-visualisering
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

client = InfluxDBClient(url="http://influxdb:8086", token="token")
write_api = client.write_api(write_options=SYNCHRONOUS)

# Hämta sensordata från Halo
halo_data = get_halo_sensors()

# Skriv till InfluxDB
point = Point("halo_sensors") \
    .tag("device", "halo-3c") \
    .field("temperature", halo_data['temperature']) \
    .field("co2", halo_data['co2']) \
    .field("aqi", halo_data['aqi'])

write_api.write(bucket="halo-sensors", record=point)
```

---

## Best Practices

### 1. Error Handling

```python
import requests
from requests.auth import HTTPBasicAuth
import time

auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")
url = "http://REDACTED_HALO_IP/api/config/gstate/latest"

def get_sensors_with_retry(max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.get(url, auth=auth, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise
    return None
```

### 2. Caching

```python
from functools import lru_cache
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth("admin", "REDACTED_HALO_PASSWORD")
HALO_IP = "REDACTED_HALO_IP"

@lru_cache(maxsize=1)
def get_config():
    response = requests.get(
        f'http://{HALO_IP}/api/config',
        auth=auth,
        timeout=10
    )
    return response.json()
```

### 3. Async Requests

```python
import asyncio
import aiohttp
from aiohttp import BasicAuth

async def get_sensors_async():
    auth = BasicAuth("admin", "REDACTED_HALO_PASSWORD")
    url = "http://REDACTED_HALO_IP/api/config/gstate/latest"

    async with aiohttp.ClientSession() as session:
        async with session.get(url, auth=auth) as response:
            return await response.json()

# Använd
data = asyncio.run(get_sensors_async())
```

---

## Felsökning

### SSL-fel

```python
import urllib3
urllib3.disable_warnings()
# eller
requests.get(url, verify=False)
```

### Timeout

```python
requests.get(url, timeout=10)  # 10 sekunders timeout
```

### Autentiseringsfel

```bash
curl -v -u admin:REDACTED_HALO_PASSWORD http://REDACTED_HALO_IP/api/config
```

---

**Se även:**
- [QUICK_START.md](QUICK_START.md) - Snabbstart
- [API_REFERENCE.md](API_REFERENCE.md) - Komplett API-referens
- [INTEGRATIONS.md](INTEGRATIONS.md) - Integrationsmöjligheter

