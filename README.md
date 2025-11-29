# Halo 3C Dashboard

Innovativ dashboard för Halo 3C smart sensor med real-time visualisering, event-hantering och pedagogiska sensorförklaringar.

## Tekniker

- **Backend:** Python + FastAPI
- **Frontend:** React (SPA) med nordisk minimalistisk design
- **Databas:** InfluxDB (time-series)
- **Testning:** Playwright E2E + visuella regressionstester
- **Deployment:** Docker på Synology NAS

## Funktioner

- Real-time sensorvisualisering
- Event-/alarmhantering med toast-notifieringar
- Pedagogiska sensorförklaringar med tooltips och FAQ
- Light/Dark mode
- Sensorinfo-sida med kategori-filtrering
- Grafer med pedagogiska nivåmarkörer

## Dokumentation

- `docs/architecture.md` - Systemarkitektur
- `docs/ui-guidelines.md` - UI-designregler och guidelines
- `docs/summary_sensor.md` - Sensor-översikt
- `docs/summary_server.md` - Server-översikt
- `docs/knowledge_base.md` - Dataflöde och begränsningar

## Status

**MÅL UPPNÅTT: 2025-11-29**

Projektet är nu i produktion och fullt funktionellt via Tailscale Funnel.

### Implementerade funktioner (2025-11-29):
- [x] Filtrering av sensorvärden - strikt whitelist med 10 utvalda sensorer
- [x] Trendindikatorer (↑/↓/→) på Dashboard
- [x] Jämförande grafer - ny sida `/sensors/compare`
- [x] Mjuka larm vid avvikelser - TrendAlerts-komponent
- [x] BLE Beacon-hantering - ny sida `/beacons`
- [x] Tailscale Funnel - tillgänglig på `https://mittemellan.tail00c71f.ts.net`

### Produktions-URL
```
https://mittemellan.tail00c71f.ts.net
```

### Navigation
| Sida | URL | Beskrivning |
|------|-----|-------------|
| Dashboard | `/` | Översikt med sensorvärden, trender och observationer |
| Grafer | `/sensors/compare` | Jämför flera sensorer i samma graf |
| Beacons | `/beacons` | Hantera BLE-beacons |
| Events | `/events` | Händelselogg |
| Sensor Info | `/sensors/info` | Detaljerad sensorinformation |

---

**Skapad:** 2025-01-27
**Mål uppnått:** 2025-11-29

