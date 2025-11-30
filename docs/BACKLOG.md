# Backlog - Framtida funktioner och förbättringar

## BLE Beacon Integration (Parkerad)

**Status:** Parkerad (2024-11-30)

**Beskrivning:**
BLE (Bluetooth Low Energy) beacon-integration för förbättrad rumsnärvarodetektering.
Beacon-funktionaliteten var tidigare en del av occupancy-beräkningen men har tagits bort
för att förenkla den initiala implementationen.

**Tidigare implementation:**
- BLE Beacon närvarande gav +5 poäng (högsta prioritet)
- Beacons listades separat på Dashboard under "BLE Beacons"
- BeaconService i backend hämtade beacon-data

**Varför parkerad:**
- Komplexitet i setup och konfiguration av beacons
- Kräver ytterligare hårdvara (BLE beacons)
- Prioritera grundläggande sensorbaserad detektion först

**Framtida implementation:**
Om BLE-beacons ska återimplementeras:
1. Återaktivera BeaconService i `occupancy.py`
2. Lägg till beacon-poäng (+5) tillbaka i `_calculate_occupancy_score()`
3. Uppdatera frontend OccupancyCard för att visa beacon-status
4. Testa med faktiska BLE beacons

**Relaterade filer:**
- `src/backend/services/occupancy.py` - Beacon-logik borttagen
- `src/backend/services/beacons.py` - BeaconService finns kvar (oanvänd i occupancy)
- `src/frontend/src/components/occupancy/OccupancyCard.tsx` - Visar beacon som "Ingen"

---

## Önskade framtida förbättringar

### Dashboard
- [ ] Anpassningsbara dashboard-layouts
- [ ] Exportera data till CSV/Excel
- [ ] Historisk jämförelse (dag mot dag, vecka mot vecka)

### Sensorer
- [ ] Kalibreringsgränssnitt för sensorer
- [ ] Anpassningsbara tröskelvärden per sensor
- [ ] Push-notifikationer för kritiska värden

### Rapportering
- [ ] Automatiska dagliga/veckovisa rapporter
- [ ] Trendanalys över längre tidsperioder
- [ ] Energieffektivitetsberäkningar baserat på närvaro

---

*Senast uppdaterad: 2024-11-30*
