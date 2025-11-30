# Dokumentation - Halo 3C Dashboard

## Snabbnavigering

| Vad vill du? | Dokument |
|--------------|----------|
| Komma igång snabbt | [Deployment Guide](guides/deployment.md) |
| Förstå systemet | [Arkitektur](system/architecture.md) |
| API-referens (Halo sensor) | [Halo Sensor API](api/halo-sensor-api.md) |
| API-referens (Dashboard) | [Dashboard API](api/dashboard-api.md) |
| Sensorreferens | [Sensor Reference](system/sensor-reference.md) |

---

## Dokumentationsstruktur

```
docs/
├── INDEX.md              ← Du är här
├── BACKLOG.md            ← Framtida features
│
├── system/               ← Systemdesign
│   ├── architecture.md       Övergripande arkitektur
│   ├── dataflow.md           End-to-end dataflöde
│   ├── sensor-reference.md   Sensorkategorier & tröskelvärden
│   └── server-environment.md Servermiljö (Synology)
│
├── api/                  ← API-dokumentation
│   ├── halo-sensor-api.md    Halo 3C REST API (450+ endpoints)
│   └── dashboard-api.md      Dashboard backend API
│
├── integrations/         ← Integrationer
│   ├── bacnet.md             BACnet-protokoll
│   └── rtsp.md               RTSP videoströmning
│
├── guides/               ← Guider & instruktioner
│   ├── deployment.md         Deployment till produktion
│   ├── testing.md            Teststrategi
│   ├── ui-guidelines.md      Designsystem
│   └── server-implementation-analysis.md  Serveranalys
│
├── research/             ← Undersökningar & analyser
│   ├── historical-data-analysis.md  Historisk data (Halo)
│   └── license-analysis.md   Licensanalys
│
├── development/          ← Utvecklarverktyg
│   └── mcp-chrome-devtools.md  Chrome DevTools MCP
│
└── background/           ← Bakgrundsmaterial
    ├── halo 3c/              Original Halo-dokumentation
    └── synology/             Synology-konfiguration
```

---

## Per kategori

### System & Arkitektur

| Dokument | Beskrivning |
|----------|-------------|
| [architecture.md](system/architecture.md) | Övergripande systemdesign, komponenter, tekniska beslut |
| [dataflow.md](system/dataflow.md) | End-to-end dataflöde: Sensor → Collector → InfluxDB → Dashboard |
| [sensor-reference.md](system/sensor-reference.md) | 43 sensorer, 26 händelsetyper, tröskelvärden |
| [server-environment.md](system/server-environment.md) | Synology NAS, Docker, nätverk |

### API-dokumentation

| Dokument | Beskrivning |
|----------|-------------|
| [halo-sensor-api.md](api/halo-sensor-api.md) | Komplett Halo 3C REST API-referens (450+ endpoints) |
| [dashboard-api.md](api/dashboard-api.md) | Dashboard backend API (auth, sensors, events, beacons) |

### Integrationer

| Dokument | Beskrivning |
|----------|-------------|
| [bacnet.md](integrations/bacnet.md) | BACnet-protokoll för byggnadsautomation |
| [rtsp.md](integrations/rtsp.md) | RTSP videoströmning |

### Guider

| Dokument | Beskrivning |
|----------|-------------|
| [deployment.md](guides/deployment.md) | Steg-för-steg deployment till Synology |
| [testing.md](guides/testing.md) | Teststrategi (unit, integration, E2E) |
| [ui-guidelines.md](guides/ui-guidelines.md) | Designsystem, färger, typografi |
| [server-implementation-analysis.md](guides/server-implementation-analysis.md) | Serverimplementation och identifierade problem |

### Undersökningar

| Dokument | Beskrivning |
|----------|-------------|
| [historical-data-analysis.md](research/historical-data-analysis.md) | Undersökning av Halo historisk datalagring |
| [license-analysis.md](research/license-analysis.md) | Licensanalys för alla beroenden |

### Utveckling

| Dokument | Beskrivning |
|----------|-------------|
| [mcp-chrome-devtools.md](development/mcp-chrome-devtools.md) | Chrome DevTools MCP för testning |

---

## Vanliga frågor

**Var hittar jag API-dokumentation?**
→ [api/halo-sensor-api.md](api/halo-sensor-api.md) för Halo-sensorn, [api/dashboard-api.md](api/dashboard-api.md) för dashboard-backend.

**Hur deployar jag systemet?**
→ [guides/deployment.md](guides/deployment.md)

**Vilka sensorer finns?**
→ [system/sensor-reference.md](system/sensor-reference.md)

**Hur fungerar dataflödet?**
→ [system/dataflow.md](system/dataflow.md)

---

*Senast uppdaterad: 2025-11-30*
