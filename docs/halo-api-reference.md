# HALO 3C Smart Sensor - API Reference

This document describes the REST API for integrating with HALO 3C smart sensors.

## Overview

HALO 3C is an advanced IoT smart sensor with comprehensive capabilities for air quality, sound, motion, and security monitoring. The sensor exposes a REST API with **450+ endpoints**.

## Authentication

All API requests require HTTP Basic Authentication:

```bash
curl -u username:password http://SENSOR_IP/api/config/gstate/latest
```

## Core Endpoints

### Sensor Data

#### GET /api/config/gstate/latest

Returns all current sensor values. This is the primary endpoint for sensor data.

**Example Response:**
```json
{
  "htsensor/ctemp": 22.5,
  "htsensor/humidity": 45.0,
  "co2sensor/co2": 450,
  "co2sensor/tvoc": 120,
  "pmsensor/raw/1": 12,
  "pmsensor/raw/2": 18,
  "AQI/value": 42,
  "audsensor/sum": 35,
  "pir/max": 0,
  "HealthIndex/val": 1
}
```

**Available Sensor Paths:**

| Path | Description | Unit |
|------|-------------|------|
| `htsensor/ctemp` | Temperature | °C |
| `htsensor/humidity` | Relative Humidity | % |
| `htsensor/millibar` | Atmospheric Pressure | hPa |
| `co2sensor/co2` | CO2 (calibrated) | ppm |
| `co2sensor/tvoc` | Total VOC | ppb |
| `pmsensor/raw/0` | PM1.0 | µg/m³ |
| `pmsensor/raw/1` | PM2.5 | µg/m³ |
| `pmsensor/raw/2` | PM10 | µg/m³ |
| `gassensor/co` | Carbon Monoxide | ppm |
| `gassensor/no2` | Nitrogen Dioxide | ppb |
| `gassensor/nh3` | Ammonia | ppm |
| `AQI/value` | Air Quality Index | 0-500 |
| `HealthIndex/val` | Health Index | 0-5 |
| `audsensor/sum` | Sound Level | dB |
| `luxsensor/aluxfilt` | Light Level | lux |
| `pir/max` | Motion (PIR) | 0-1000 |
| `accsensor/move` | Movement (Accelerometer) | arbitrary |

#### GET /api/sensors/list

Returns a list of all available sensors with descriptions.

### Events

#### GET /api/config/gstate/event_state

Returns the current state of all configured events.

**Example:**
```python
import requests

response = requests.get(
    "http://SENSOR_IP/api/config/gstate/event_state",
    auth=("username", "password")
)
events = response.json()

for event_id, data in events.items():
    if isinstance(data, dict) and data.get('state') == 1:
        print(f"ACTIVE: {event_id}")
```

**Event Types:**

| Group | Events |
|-------|--------|
| Vaping/Substance | Vape, THC, Masking, Smoking |
| Safety | Gunshot, Aggression, Tamper, Help, Motion |
| Air Quality | Health_Index, AQI, TVOC, CO2cal, PM2.5 |
| Environment | PM1, PM10, Humidity, Temp_C, NO2, CO, NH3, Light, Sound |

#### GET /api/config/gstate/config/eventgen/events

Returns the configuration for all event rules including thresholds, operators, and actions.

### Configuration

#### GET /api/config

Returns the complete device configuration.

#### POST /api/config

Updates device configuration (supports partial updates).

```python
config = requests.get("http://SENSOR_IP/api/config", auth=auth).json()
config['devicename'] = 'New_Name'
requests.post("http://SENSOR_IP/api/config", auth=auth, json=config)
```

### Control

#### LED Control

```python
# Set LED color (RGB as integer)
requests.post(
    "http://SENSOR_IP/api/config/gstate/LED/color",
    auth=auth,
    json=16711680  # 0xFF0000 = Red
)
```

#### Force Sound

```python
# Play a sound file
requests.post(
    "http://SENSOR_IP/api/config/gstate/force/sound",
    auth=auth,
    json="Emergency2C2N.wav"
)
```

#### Relay Control

```python
# Get relay status
status = requests.get(
    "http://SENSOR_IP/api/config/gstate/relay",
    auth=auth
).json()
# Returns: {"k1": 0, "k2": 0, "wd": 1, "but": 1, ...}
```

### Device Information

| Endpoint | Description |
|----------|-------------|
| `/api/device/netinfo` | Network information |
| `/api/device/gettimeinfo` | Time settings |
| `/api/device/users` | User list |
| `/api/logs` | Available log files |
| `/api/config/gstate/workers/lifetimehrs` | Device uptime (hours) |

### Graphics & Visualization

| Endpoint | Description |
|----------|-------------|
| `/api/gfx/dashboardframe.jpg` | Dashboard image (JPG) |
| `/api/gfx/dashboard.svg` | Dashboard (SVG) |
| `/api/gfx/stream.jpg` | MJPEG video stream |

## Integration Protocols

HALO 3C supports multiple integration methods:

- **REST API** - HTTP/HTTPS (documented here)
- **SNMP** - Network management
- **BACnet** - Building automation
- **RTSP** - Video streaming (port 8554)
- **WebSocket** - Real-time cloud connectivity
- **Email** - SMTP-based alerts

## Event Variables

When configuring integrations, these variables are available:

| Variable | Description |
|----------|-------------|
| `%NAME%` | Device name |
| `%IP%` | IP address |
| `%MAC%` | MAC address |
| `%EID%` | Event ID |
| `%VAL%` | Sensor value |
| `%THR%` | Threshold value |
| `%DATE%` | Event date |
| `%TIME%` | Event time |
| `%SENSOR:id%` | Specific sensor value |
| `%ACTIVE%` | List of active events |

## Python Client Example

```python
import requests
from requests.auth import HTTPBasicAuth

class HaloClient:
    def __init__(self, ip, username, password):
        self.base_url = f"http://{ip}"
        self.auth = HTTPBasicAuth(username, password)

    def get_sensor_data(self):
        """Get all current sensor values."""
        r = requests.get(
            f"{self.base_url}/api/config/gstate/latest",
            auth=self.auth
        )
        return r.json()

    def get_temperature(self):
        """Get current temperature in Celsius."""
        data = self.get_sensor_data()
        return data.get("htsensor/ctemp")

    def get_co2(self):
        """Get current CO2 level in ppm."""
        data = self.get_sensor_data()
        return data.get("co2sensor/co2")

    def get_aqi(self):
        """Get current Air Quality Index."""
        data = self.get_sensor_data()
        return data.get("AQI/value")

    def get_active_events(self):
        """Get list of currently active events."""
        r = requests.get(
            f"{self.base_url}/api/config/gstate/event_state",
            auth=self.auth
        )
        events = r.json()
        active = []
        for event_id, data in events.items():
            if isinstance(data, dict) and data.get('state') == 1:
                active.append(event_id)
        return active

# Usage
client = HaloClient("SENSOR_IP", "username", "password")
print(f"Temperature: {client.get_temperature()}°C")
print(f"CO2: {client.get_co2()} ppm")
print(f"AQI: {client.get_aqi()}")
print(f"Active events: {client.get_active_events()}")
```

## Best Practices

1. **Polling Interval**: Use 5-10 second intervals to avoid overloading the sensor
2. **Caching**: Cache `/api/config` responses as configuration rarely changes
3. **Error Handling**: Implement retry logic for network failures
4. **HTTPS**: Use HTTPS in production (self-signed certificate)
5. **Event System**: Use the built-in event system for automation rather than polling

## Related Documentation

- [Architecture Overview](./architecture.md)
- [API Documentation](./api-documentation.md)

---

*This documentation covers HALO 3C Smart Sensor API v2.8+*
