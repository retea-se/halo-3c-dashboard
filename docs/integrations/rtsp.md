# RTSP Configuration - Halo 3C

**Datum:** 2025-11-30
**Status:** RTSP stöd dokumenterat och integrerat i dashboard

---

## 🎯 Översikt

HALO 3C stödjer RTSP (Real-Time Streaming Protocol) för video streaming. RTSP kan aktiveras via webbgränssnittet, REST API, eller direkt från dashboard-applikationen via integrations-sidan (`/integrations`).

---

## ✅ Konfiguration

### Aktuell Status

RTSP kan konfigureras via webbgränssnittet eller via REST API genom att uppdatera `/api/config`.

**Konfigurationssektion:**
```json
{
  "rtsp": {
    "on": 1,                    // 1 = enabled, 0 = disabled
    "port": 8554,              // RTSP port (default: 8554)
    "auth": "basic,digest",    // Authentication methods
    "user": "",                // Username (optional)
    "pswd": "",                // Password (optional)
    "img": "stream.jpg",       // Stream image path
    "scroll_time": 5           // Scroll time (seconds)
  }
}
```

### RTSP Stream URL

När RTSP är aktiverad är stream-URL:en:

```
rtsp://{HALO_IP}:{PORT}/stream
```

**Exempel:**
```
rtsp://192.168.0.73:8554/stream
```

### Autentisering

RTSP stödjer följande autentiseringsmetoder:
- **basic** - Basic HTTP authentication
- **digest** - Digest authentication
- **both** - Både basic och digest

Om autentisering är aktiverad måste username och password anges i konfigurationen.

**Exempel med autentisering:**
```
rtsp://username:password@192.168.0.73:8554/stream
```

---

## 🔧 Aktivering via REST API

### Aktivera RTSP

```python
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth("admin", "password")
base_url = "http://HALO_IP"

# Hämta nuvarande config
config = requests.get(f"{base_url}/api/config", auth=auth).json()

# Aktivera RTSP
config["rtsp"]["on"] = 1
config["rtsp"]["port"] = 8554
config["rtsp"]["auth"] = "basic,digest"

# Sätt autentisering (valfritt)
# config["rtsp"]["user"] = "rtsp_user"
# config["rtsp"]["pswd"] = "rtsp_password"

# Uppdatera config
response = requests.post(f"{base_url}/api/config", auth=auth, json=config)
```

### Kontrollera Status

```python
config = requests.get(f"{base_url}/api/config", auth=auth).json()
rtsp_config = config.get("rtsp", {})

if rtsp_config.get("on"):
    port = rtsp_config.get("port", 8554)
    print(f"RTSP is enabled: rtsp://{HALO_IP}:{port}/stream")
else:
    print("RTSP is disabled")
```

---

## 📺 Användning

### Med VLC Media Player

1. Öppna VLC Media Player
2. Gå till Media → Open Network Stream
3. Ange RTSP URL: `rtsp://192.168.0.73:8554/stream`
4. Klicka Play

### Med ffplay (ffmpeg)

```bash
ffplay rtsp://192.168.0.73:8554/stream
```

### Med Python (opencv)

```python
import cv2

rtsp_url = "rtsp://192.168.0.73:8554/stream"
cap = cv2.VideoCapture(rtsp_url)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    cv2.imshow('RTSP Stream', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

---

## 🔍 Felsökning

### Port är stängd

Om RTSP-porten (8554) är stängd eller blockerad:

1. Kontrollera firewall-inställningar
2. Verifiera att RTSP är aktiverad i konfigurationen
3. Kontrollera nätverksinställningar

### Autentisering misslyckas

Om autentisering misslyckas:

1. Kontrollera username/password i konfigurationen
2. Verifiera att rätt autentiseringsmetod är vald
3. Testa med `rtsp://username:password@HALO_IP:8554/stream`

### Stream fungerar inte

Om streamen inte fungerar:

1. Kontrollera att HALO-enheten har aktiv video-kamera
2. Verifiera nätverksanslutning
3. Testa med olika RTSP-klienter

---

## 📝 Relaterade Dokument

- [Halo API Reference](./halo-api-reference.md)
- [Architecture Overview](./architecture.md)

---

## 📱 Dashboard Integration

RTSP kan konfigureras direkt från dashboard-applikationen via integrations-sidan (`/integrations`). Sidan inkluderar:

- RTSP video viewer för att se live-stream
- Konfigurationsformulär för port, autentisering, etc.
- Statusindikator för att se om RTSP är aktiv och porten är tillgänglig
- Automatisk uppdatering av konfiguration

### API Endpoints

Dashboard-applikationen exponerar följande endpoints för RTSP-konfiguration:

**GET `/api/integrations/rtsp/config`**
- Hämta nuvarande RTSP-konfiguration från Halo
- Returnerar: RTSP-konfiguration med alla inställningar

**PUT `/api/integrations/rtsp/config`**
- Uppdatera RTSP-konfiguration på Halo
- Body: RTSP-konfiguration (se konfigurationssektion ovan)
- Validerar inställningar innan uppdatering

**GET `/api/integrations/rtsp/status`**
- Hämta RTSP-status inklusive port-tillgänglighet
- Returnerar: enabled, port, port_open, stream_url, mjpeg_url, etc.

**Notera:** RTSP-konfigurationen kan ändras via webbgränssnittet, REST API, eller dashboard-integrationen. Ändringar kräver att konfigurationen sparas.

