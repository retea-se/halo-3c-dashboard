# API Documentation - Halo 3C Dashboard

## Översikt

Halo 3C Dashboard API är byggd med FastAPI och exponerar REST-endpoints för sensor data, events, beacons och autentisering.

**Base URL:** `http://localhost:8000` (utveckling)
**API Version:** 1.0.0
**OpenAPI Docs:** `/docs` (Swagger UI)
**ReDoc:** `/redoc` (alternativ dokumentation)

---

## Authentication

API:et använder JWT (JSON Web Tokens) för autentisering.

### Login

**POST** `/api/auth/login`

Login med username/password och få JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Basic Auth Login

**POST** `/api/auth/login/basic`

Login med HTTP Basic Authentication.

**Headers:**
```
Authorization: Basic <base64(username:password)>
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Get Current User

**GET** `/api/auth/me`

Hämta information om autentiserad användare (kräver JWT token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "username": "admin",
  "payload": {
    "sub": "admin",
    "exp": 1234567890
  }
}
```

---

## Sensors

### Get All Sensor Metadata

**GET** `/api/sensors/meta`

Hämta metadata för alla sensorer.

**Response:**
```json
[
  {
    "id": "temperature_c",
    "technical_name": "temperature",
    "display_name": "Temperatur",
    "short_description": "Mäter omgivningstemperaturen",
    "category": "Luftkvalitet",
    "unit": "°C",
    "normal_range": {
      "min": 18,
      "max": 24,
      "description": "Bekväm temperatur för inomhusmiljö"
    }
  }
]
```

### Get Sensor Metadata by ID

**GET** `/api/sensors/meta/{sensor_id}`

Hämta metadata för specifik sensor.

**Parameters:**
- `sensor_id` (path) - Sensor ID, t.ex. "temperature_c"

**Response:**
```json
{
  "id": "temperature_c",
  "technical_name": "temperature",
  "display_name": "Temperatur",
  "long_description": "...",
  "category": "Luftkvalitet",
  "unit": "°C",
  "normal_range": {...},
  "warning_thresholds": [...],
  "faq": [...]
}
```

### Get Latest Sensor Values

**GET** `/api/sensors/latest`

Hämta senaste sensorvärden från InfluxDB.

**Query Parameters:**
- `device_id` (optional) - Device ID för att filtrera

**Response:**
```json
{
  "device_id": "halo-device-1",
  "timestamp": "2025-01-27T10:00:00Z",
  "sensors": [
    {
      "sensor_id": "temperature",
      "timestamp": "2025-01-27T10:00:00Z",
      "values": {
        "value": 22.5
      }
    }
  ]
}
```

### Get Sensor History

**GET** `/api/sensors/{sensor_id}/history`

Hämta historisk data för specifik sensor.

**Parameters:**
- `sensor_id` (path) - Sensor ID
- `from_time` (query, optional) - Starttid (ISO 8601)
- `to_time` (query, optional) - Sluttid (ISO 8601)
- `limit` (query, optional) - Max antal datapoints (default: 1000)
- `device_id` (query, optional) - Device ID

**Response:**
```json
[
  {
    "_time": "2025-01-27T10:00:00Z",
    "_value": 22.5,
    "sensor_id": "temperature",
    "device_id": "halo-device-1"
  }
]
```

---

## Events

### Get Latest Events

**GET** `/api/events/latest`

Hämta senaste events.

**Query Parameters:**
- `limit` (optional) - Max antal events (default: 50, max: 1000)

**Response:**
```json
[
  {
    "id": "event-123",
    "timestamp": "2025-01-27T10:00:00Z",
    "type": "SENSOR_THRESHOLD",
    "severity": "WARNING",
    "source": "temperature",
    "summary": "Temperature exceeded threshold",
    "details": {...},
    "status": "ACTIVE",
    "device_id": "halo-device-1"
  }
]
```

### Get Events (Filtered)

**GET** `/api/events`

Hämta events med filtrering.

**Query Parameters:**
- `from_time` (optional) - Starttid (ISO 8601)
- `to_time` (optional) - Sluttid (ISO 8601)
- `type` (optional) - Event typ
- `severity` (optional) - Severity (INFO, WARNING, CRITICAL)
- `status` (optional) - Status (ACTIVE, ACKNOWLEDGED, RESOLVED)

**Response:**
```json
[
  {
    "id": "event-123",
    "timestamp": "2025-01-27T10:00:00Z",
    "type": "SENSOR_THRESHOLD",
    "severity": "WARNING",
    ...
  }
]
```

### Acknowledge Event

**POST** `/api/events/ack/{event_id}`

Kvittera ett event (sätt status till ACKNOWLEDGED).

**Parameters:**
- `event_id` (path) - Event ID

**Response:**
```json
{
  "id": "event-123",
  "status": "ACKNOWLEDGED",
  "acknowledged_at": "2025-01-27T10:05:00Z"
}
```

---

## Beacons

### Get All Beacons

**GET** `/api/beacons`

Hämta alla kända beacons med senaste status.

**Query Parameters:**
- `device_id` (optional) - Device ID

**Response:**
```json
[
  {
    "beacon_id": "beacon-001",
    "beacon_name": "Test Beacon",
    "rssi": -65,
    "battery": 85,
    "is_present": true,
    "timestamp": "2025-01-27T10:00:00Z"
  }
]
```

### Get Beacon Details

**GET** `/api/beacons/{beacon_id}`

Hämta detaljerad info om specifik beacon.

**Parameters:**
- `beacon_id` (path) - Beacon ID

**Response:**
```json
{
  "beacon_id": "beacon-001",
  "beacon_name": "Test Beacon",
  "rssi": -65,
  "filter_rssi": -67,
  "battery": 85,
  "signal_strength": 75,
  "is_present": true,
  "timestamp": "2025-01-27T10:00:00Z"
}
```

### Get Beacon History

**GET** `/api/beacons/{beacon_id}/history`

Hämta närvarohistorik för beacon.

**Parameters:**
- `beacon_id` (path) - Beacon ID
- `from_time` (query, optional) - Starttid (ISO 8601)
- `to_time` (query, optional) - Sluttid (ISO 8601)
- `limit` (query, optional) - Max antal datapoints (default: 100)
- `device_id` (query, optional) - Device ID

**Response:**
```json
[
  {
    "timestamp": "2025-01-27T10:00:00Z",
    "beacon_id": "beacon-001",
    "rssi": -65,
    "battery": 85,
    "is_present": true
  }
]
```

### Get Beacon Alerts

**GET** `/api/beacons/{beacon_id}/alerts`

Hämta panikknapp-events för beacon.

**Parameters:**
- `beacon_id` (path) - Beacon ID
- `from_time` (query, optional) - Starttid (ISO 8601)
- `to_time` (query, optional) - Sluttid (ISO 8601)
- `limit` (query, optional) - Max antal alerts (default: 50)
- `device_id` (query, optional) - Device ID

**Response:**
```json
[
  {
    "timestamp": "2025-01-27T10:00:00Z",
    "beacon_id": "beacon-001",
    "alert_type": "panic_button",
    "status": 1,
    "battery": 85,
    "rssi": -65
  }
]
```

### Get Current Presence

**GET** `/api/beacons/presence/current`

Hämta alla närvarande beacons just nu.

**Query Parameters:**
- `device_id` (optional) - Device ID

**Response:**
```json
[
  {
    "beacon_id": "beacon-001",
    "beacon_name": "Test Beacon",
    "rssi": -65,
    "battery": 85,
    "is_present": true,
    "timestamp": "2025-01-27T10:00:00Z"
  }
]
```

---

## System

### Get System Status

**GET** `/api/system/status`

Hämta systemstatus (InfluxDB, Halo sensor, etc.).

**Response:**
```json
{
  "status": "healthy",
  "influxdb": {
    "status": "connected",
    "url": "http://influxdb:8086"
  },
  "halo_sensor": {
    "status": "connected",
    "ip": "REDACTED_HALO_IP"
  },
  "timestamp": "2025-01-27T10:00:00Z"
}
```

---

## WebSocket

### Event Stream

**WebSocket** `/api/events/stream`

Real-time event stream via WebSocket.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/api/events/stream');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'new_event') {
    console.log('New event:', data.event);
  }
};
```

**Message Types:**
- `connected` - Anslutning etablerad
- `new_event` - Nytt event genererat
- `pong` - Response på ping

**Heartbeat:**
```json
{
  "type": "ping"
}
```

**Event Message:**
```json
{
  "type": "new_event",
  "event": {
    "id": "event-123",
    "timestamp": "2025-01-27T10:00:00Z",
    "type": "BEACON_PANIC_BUTTON",
    "severity": "CRITICAL",
    "summary": "Panic button activated",
    ...
  }
}
```

---

## Error Handling

API:et returnerar standard HTTP status codes:

- **200 OK** - Successful request
- **400 Bad Request** - Invalid request parameters
- **401 Unauthorized** - Authentication required
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

**Error Response Format:**
```json
{
  "detail": "Error message description"
}
```

---

## Rate Limiting

För närvarande inget rate limiting implementerat. Kan läggas till i framtiden.

---

## OpenAPI Documentation

Fullständig API-dokumentation är tillgänglig via:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

**Senast uppdaterad:** 2025-01-27


