# BACnet Exploration - Halo 3C

**Datum:** 2025-11-30
**Uppdaterad:** 2025-11-30 (BACnet aktiverad)
**Status:** BACnet aktiverad och konfigurerad

---

## 🎯 Sammanfattning

BACnet är nu **AKTIVERAD** på Halo 3C! Enheten exponerar sensorer och events via BACnet med definierade instance numbers. BACnet kan potentiellt ge tillgång till historikdata via Trend Log-objekt, vilket skulle lösa catch-up-problemet.

---

## ✅ Bekräftade Fynd

### 1. BACnet-konfiguration

**Aktuell status:** ✅ **AKTIVERAD**

**Aktuell konfiguration:**

```json
{
  "bacnet": {
    "on": true,
    "deviceName": "Halo_Device",
    "instanceNumber": 0,
    "port": 47808,
    "foreignDevice": false,
    "covIncrement": 5
  }
}
```

**Inställningar:**

- **Device Name:** `Halo_Device`
- **Device Instance Number:** `0` (högsta nivå - enheten själv)
- **Port:** `47808/UDP` (standard BACnet-port)
- **Foreign Device:** `false` (lokal enhet)
- **COV Increment:** `5` (Change of Value threshold)

**Port:** Standard BACnet-port 47808/UDP

### 2. BACnet Instance Numbers

Halo 3C exponerar alla sensorer och events via BACnet med specifika instance numbers. Dessa används för att identifiera och läsa värden via BACnet-protokollet.

| Event/Sensor     | Instance Number | BACnet Object Type | Beskrivning           |
| ---------------- | --------------- | ------------------ | --------------------- |
| **Gunshot**      | 1               | Binary Input       | Skottdetektion        |
| **Help**         | 2               | Binary Input       | Nödrop                |
| **Vape**         | 3               | Binary Input       | Vape-detektion        |
| **THC**          | 4               | Binary Input       | THC-detektion         |
| **Masking**      | 5               | Binary Input       | Maskeringsdetektion   |
| **Aggression**   | 6               | Binary Input       | Aggression            |
| **Tamper**       | 7               | Binary Input       | Manipulation          |
| **TVOC**         | 8               | Analog Input       | Total VOC (ppb)       |
| **CO**           | 10              | Analog Input       | Kolmonoxid (ppm)      |
| **AQI**          | 11              | Multi-state Input  | Air Quality Index     |
| **Temp_C**       | 14              | Analog Input       | Temperatur (°C)       |
| **Light**        | 15              | Analog Input       | Ljusnivå (lux)        |
| **PM1**          | 16              | Analog Input       | PM1.0 (µg/m³)         |
| **PM2.5**        | 17              | Analog Input       | PM2.5 (µg/m³)         |
| **PM10**         | 18              | Analog Input       | PM10 (µg/m³)          |
| **NH3**          | 19              | Analog Input       | Ammoniak (ppm)        |
| **NO2**          | 20              | Analog Input       | Kvävedioxid (ppb)     |
| **Sound**        | 21              | Analog Input       | Ljudnivå (dB)         |
| **Pressure**     | 22              | Analog Input       | Lufttryck (hPa)       |
| **Humidity**     | 23              | Analog Input       | Relativ fuktighet (%) |
| **CO2cal**       | 25              | Analog Input       | CO2 kalibrerad (ppm)  |
| **Health_Index** | 26              | Multi-state Input  | Hälsoindex (0-5)      |
| **Motion**       | 27              | Binary Input       | Rörelsedetektion      |
| **Smoking**      | 30              | Binary Input       | Rökning               |
| **Humidity_Low** | 31              | Analog Input       | Låg fuktighet         |
| **Temp_C_Low**   | 33              | Analog Input       | Låg temperatur        |

**Viktigt:** Instance number `0` är reserverat för Device-objektet (enheten själv). Alla sensorer/events har sina egna instance numbers för att identifieras via BACnet.

**Användning:**

- Läsa sensorvärden: Använd instance number med `ReadProperty` service
- Läsa events: Använd instance number med `ReadProperty` service
- Trend Logs (om tillgängliga): Kanske har egna instance numbers eller är kopplade till sensor-instances

### 2. BACnet-relaterade REST API Endpoints

Följande endpoints finns, men returnerar för närvarande bara full konfiguration (inte BACnet-specifik data):

- ✅ `/api/config/bacnet` - Returnerar full config
- ✅ `/api/config/bacnet/objects` - Returnerar full config (ej objekt-lista)
- ✅ `/api/config/bacnet/points` - Returnerar full config (ej points-lista)

**Notera:** Dessa endpoints verkar vara konfigurationsendpoints, inte direkt BACnet-data access.

---

## 📚 BACnet Bakgrund

### Vad är BACnet?

BACnet (Building Automation and Control Networks) är ett kommunikationsprotokoll specifikt utformat för byggautomation och styrning. Det är en internationell standard (ISO 16484-5) som används för att integrera olika byggautomationssystem.

### BACnet Object Types

| Type                        | Beskrivning                | Användning för Halo                   |
| --------------------------- | -------------------------- | ------------------------------------- |
| **Analog Input (AI)**       | Kontinuerliga sensorvärden | CO2, temperatur, fuktighet, PM, etc.  |
| **Binary Input (BI)**       | On/Off-status              | Relay-status, event-triggers          |
| **Multi-state Input (MSI)** | Status-värden              | Health Index, AQI-level               |
| **Trend Log**               | Historikdata               | ⭐ **Potentiell källa för catch-up!** |
| **Device**                  | Enhetsinformation          | Device name, firmware, etc.           |

### BACnet Services

| Service                  | Beskrivning                  | Användning                            |
| ------------------------ | ---------------------------- | ------------------------------------- |
| **Who-Is / I-Am**        | Enhetsupptäckt               | Hitta Halo-enheten på nätverket       |
| **ReadProperty**         | Läsa enskilt värde           | Läsa aktuellt sensorvärde             |
| **ReadPropertyMultiple** | Läsa flera värden            | Läsa alla sensorer samtidigt          |
| **SubscribeCOV**         | Change of Value              | Real-time uppdateringar (som polling) |
| **ReadRange**            | Läsa historik från Trend Log | ⭐ **Potentiell catch-up-lösning!**   |

---

## 💡 Potentiell Lösning för Catch-up

### Trend Log Objects

BACnet Trend Log-objekt är designade för att lagra historisk data:

- **Buffer Size:** Konfigurerbart antal datapunkter
- **Log Interval:** Tidsintervall mellan loggningar
- **ReadRange Service:** Kan läsa historikdata för specifikt tidsintervall

### Om Halo Exponerar Trend Logs

Om Halo 3C exponerar Trend Log-objekt via BACnet för sina sensorer, kan vi:

1. **Aktivera BACnet** på Halo
2. **Upptäcka enheten** med Who-Is broadcast
3. **Läsa objektlista** för att hitta Trend Log-objekt
4. **Använda ReadRange** för att läsa historikdata för saknade perioder
5. **Få tillgång till 7-dagars historiken** som lagras internt

**Detta skulle lösa catch-up-problemet!**

---

## 🔧 Nästa Steg

### Steg 1: Aktivera BACnet på Halo

```python
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth("admin", "password")
base_url = "http://HALO_IP"

# Hämta nuvarande config
config = requests.get(f"{base_url}/api/config", auth=auth).json()

# Aktivera BACnet
config["bacnet"]["on"] = True
config["bacnet"]["deviceName"] = "Halo_Device_001"
config["bacnet"]["instanceNumber"] = 1001  # Unikt nummer

# Uppdatera config
response = requests.post(f"{base_url}/api/config", auth=auth, json=config)
```

### Steg 2: Installera BACnet-klient

**Rekommenderat: BAC0**

```bash
pip install BAC0
```

**Alternativ: bacpypes**

```bash
pip install bacpypes3
```

### Steg 3: Upptäcka Enheten

```python
from BAC0 import lite

# Skapa BACnet-klient
bacnet = lite()

# Gör Who-Is broadcast för att hitta enheten
devices = bacnet.whois()
# Returns list of discovered devices

# Hitta Halo-enheten
halo_device = next(d for d in devices if "Halo" in d.name or d.address == "HALO_IP")
```

### Steg 4: Läsa Objektlista

```python
# Hämta alla objekt från enheten
objects = halo_device.objects

# Sök efter Trend Log-objekt
trend_logs = [obj for obj in objects if obj.objectType == "trendLog"]
```

### Steg 5: Läsa Historik (Om Trend Logs Finns)

```python
from datetime import datetime, timedelta

# Läsa historik för senaste 24 timmarna
end_time = datetime.now()
start_time = end_time - timedelta(hours=24)

# ReadRange från Trend Log
history = trend_log.readRange(
    startTime=start_time,
    endTime=end_time
)

# Processa historikdata
for point in history:
    print(f"{point.timestamp}: {point.value}")
```

---

## 📋 Testplan

### Test 1: BACnet Aktivierung

- [ ] Aktivera BACnet via REST API
- [ ] Verifiera att port 47808 är öppen
- [ ] Testa Who-Is från BACnet-klient

### Test 2: Objektupptäckt

- [ ] Hämta objektlista från enheten
- [ ] Identifiera sensorobjekt (Analog Input)
- [ ] Söka efter Trend Log-objekt

### Test 3: Historiktest (Om Trend Logs Finns)

- [ ] Identifiera Trend Log-objekt för sensorer
- [ ] Läsa ReadRange för senaste timmen
- [ ] Verifiera att historikdata matchar internt lagring (7 dagar)
- [ ] Testa ReadRange för längre perioder

### Test 4: Catch-up Implementation

- [ ] Implementera funktion för att läsa historik för saknad period
- [ ] Testa med simulerad kontaktsförlust
- [ ] Verifiera data-integritet mot REST API

---

## 🛠️ Python-verktyg

### BAC0 (Rekommenderat)

**Fördelar:**

- Hög nivå API, lätt att använda
- Stöd för Trend Log och historik
- Bra dokumentation
- Aktivt underhållen

**Installation:**

```bash
pip install BAC0
```

**Exempel:**

```python
from BAC0 import lite

bacnet = lite()
device = bacnet.device("192.168.0.73", 1001)
trend_log = device[("trendLog", 1)]
history = trend_log.readRange(...)
```

### bacpypes3

**Fördelar:**

- Full BACnet-stack
- Mer kontroll
- Standard BACnet-implementation

**Nackdelar:**

- Mer komplex API
- Lägre nivå

**Installation:**

```bash
pip install bacpypes3
```

---

## ❓ Öppna Frågor

1. **Exponerar Halo Trend Log-objekt?**

   - Behöver verifieras när BACnet är aktiverad
   - Om ja: Potentiell lösning för catch-up
   - Om nej: BACnet ger bara real-time data (som REST API)

2. **Vilka sensorer exponeras via BACnet?**

   - Alla sensorer?
   - Bara vissa?
   - Behöver testas

3. **Hur många Trend Log-objekt?**

   - Ett per sensor?
   - Aggregerade?
   - Ingen?

4. **Stöd för ReadRange?**
   - Standard BACnet-service
   - Bör fungera om Trend Logs finns
   - Behöver testas

---

## 📊 Riskbedömning

### Positiva Signaler

✅ Halo har BACnet-konfiguration
✅ Standard BACnet-port (47808)
✅ COV Increment konfigurerad (indikerar COV-stöd)
✅ 7-dagars intern lagring bekräftad

### Risker

⚠️ BACnet är inaktiverad (behöver aktiveras)
⚠️ Okänt om Trend Log-objekt exponeras
⚠️ Kräver BACnet-klient för testning
⚠️ Kräver nätverksåtkomst till port 47808

---

## 🎯 Rekommendationer

### Kortsiktigt

1. **Aktivera BACnet** på Halo för testning
2. **Installera BAC0** Python-bibliotek
3. **Utför initialt test** för att upptäcka enheten
4. **Läs objektlista** och identifiera Trend Log-objekt

### Långsiktigt

Om Trend Log-objekt exponeras:

1. **Implementera BACnet-klient** i collector-service
2. **Lägg till catch-up-funktionalitet** via ReadRange
3. **Dokumentera BACnet-integration** i projektet
4. **Överväg BACnet som alternativ** till kontinuerlig polling

Om Trend Log-objekt INTE exponeras:

1. **Fortsätt med REST API-polling** (nuvarande lösning)
2. **Behåll InfluxDB** som primär historik
3. **Överväg att kontakta Halo-support** om Trend Log-stöd

---

## 📱 Dashboard Integration

BACnet kan konfigureras direkt från dashboard-applikationen via integrations-sidan (`/integrations`). Sidan inkluderar:

- BACnet-konfigurationsformulär (device name, instance number, port, etc.)
- Statusindikator för att se om BACnet är aktiv och porten är tillgänglig
- Tabell med alla BACnet instance numbers för sensorer och events
- Automatisk validering av inställningar (t.ex. deviceName och instanceNumber krävs när aktiverad)

### API Endpoints

Dashboard-applikationen exponerar följande endpoints för BACnet-konfiguration:

**GET `/api/integrations/bacnet/config`**

- Hämta nuvarande BACnet-konfiguration från Halo
- Returnerar: BACnet-konfiguration med alla inställningar

**PUT `/api/integrations/bacnet/config`**

- Uppdatera BACnet-konfiguration på Halo
- Body: BACnet-konfiguration (deviceName, instanceNumber, port, etc.)
- Validerar att deviceName och instanceNumber är satta när aktiverad

**GET `/api/integrations/bacnet/status`**

- Hämta BACnet-status inklusive port-tillgänglighet
- Returnerar: enabled, port, port_open, device_name, instance_number, etc.

**Notera:** BACnet-konfigurationen kan ändras via webbgränssnittet, REST API, eller dashboard-integrationen. Se [BACnet Instance Numbers](#bacnet-instance-numbers) för lista över alla instance numbers.

## 📝 Relaterade Dokument

- [Halo API Reference](./halo-api-reference.md)
- [Historical Data Final Report](./halo-historical-data-final-report.md)
- [Architecture Overview](./architecture.md)
- [RTSP Configuration](./rtsp-configuration.md)

---

**Nästa steg:** Aktivera BACnet via dashboard-integrationen eller REST API och testa med BAC0-biblioteket för att verifiera om Trend Log-objekt exponeras.
