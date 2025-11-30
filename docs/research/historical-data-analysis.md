# Halo 3C Historisk Data - Slutlig Rapport

**Datum:** 2025-11-30
**Status:** Omfattande utforskning genomförd

---

## 🎯 Sammanfattning

Efter omfattande utforskning av Halo 3C API kan vi bekräfta:

✅ **Halo lagrar sensordata internt i 7 dagar** (`datalog.keep_days = 7`)
❌ **Ingen API-endpoint hittades för att hämta historisk data**
✅ **Sensor `/data` paths returnerar aktuell data med tidsstämplar**
❌ **Ingen catch-up-mekanism via REST API**

---

## ✅ Bekräftade Fynd

### 1. Intern Lagring (7 dagar)

**Konfiguration:**
```json
{
  "datalog": {
    "rate_secs": 15,    // Data samlas var 15:e sekund
    "keep_days": 7      // Data lagras i 7 dagar
  }
}
```

**Bekräftat via:** `/api/config` och `/api/config/datalog`

### 2. Sensor Data Paths

Följande endpoints returnerar **aktuell sensordata** med tidsstämplar:

- ✅ `/api/config/gstate/latest/co2sensor/data` - CO2 data med `_rtime`, `t`
- ✅ `/api/config/gstate/latest/htsensor/data` - Temp/Humidity data
- ✅ `/api/config/gstate/latest/pmsensor/data` - PM data med `_rtime`, `_rtimet`
- ✅ `/api/config/gstate/latest/gassensor/data` - Gas data med `_rtime`, `t`
- ✅ `/api/config/gstate/latest/audsensor/data` - Audio data med `_rtime`, `t`
- ✅ `/api/config/gstate/latest/luxsensor/data` - Light data med `time`, `_rtime`, `_rtimet`
- ✅ `/api/config/gstate/latest/AQI/data` - AQI värde
- ✅ `/api/config/gstate/latest/HealthIndex/data` - Health Index med `avg` (rullande medelvärden)

**Exempel på data-struktur:**
```json
{
  "co2": 988,
  "t": 1764498035822,           // Unix timestamp (ms)
  "_rtime": 1764498035822,      // Raw time
  "_rtimet": "11:20:35 AM",      // Formaterad tid
  "tvoc": 6,
  ...
}
```

**Viktigt:** Dessa returnerar endast **aktuella värden**, inte historik.

### 3. Event State Metadata

Följande paths finns i event_state:
- ✅ `/api/config/gstate/event_state/{event}/missing_data` - Antal saknade datapunkter
- ✅ `/api/config/gstate/event_state/{event}/log_set` - Log-status
- ✅ `/api/config/gstate/event_state/{event}/reportTime` - Senaste rapporttid

**Exempel:**
```json
{
  "Health_Index": {
    "missing_data": 0,
    "log_set": 1,
    "reportTime": 1764493829290
  }
}
```

**Tolkning:** `missing_data` kan indikera att Halo spårar datagap, men ingen endpoint hittades för att hämta dessa data.

### 4. Loggfiler

- ✅ `/api/logs` - Lista loggfiler
- ✅ `/api/logs/{filename}` - Hämta loggfil

**Innehåll:** Systemloggar, inte strukturerad sensordata.

---

## ❌ Testade Men Ej Funna

### Historik-Endpoints (alla returnerade 404)
- `/api/config/gstate/history`
- `/api/config/gstate/data` (historik)
- `/api/config/gstate/archive`
- `/api/config/gstate/buffer`
- `/api/data/history`
- `/api/data/archive`
- `/api/sensors/history`

### Tidsintervall-Endpoints
- `/api/config/gstate/range`
- `/api/config/gstate/since`
- `/api/config/gstate/from`

### Datalog-Endpoints (returnerar bara config)
- `/api/config/datalog/data` → Returnerar hela config (inte data)
- `/api/config/datalog/query` → Returnerar hela config (inte data)
- `/api/config/datalog/fetch` → Returnerar hela config (inte data)
- `/api/config/datalog/list` → Returnerar hela config (inte data)
- `/api/config/datalog/files` → Returnerar hela config (inte data)

**Notera:** Dessa endpoints accepterar POST-requests med parametrar, men returnerar fortfarande bara config-strukturen.

### Sensor Historik-Paths
- `/api/config/gstate/latest/{sensor}/history` → 404
- `/api/config/gstate/latest/{sensor}/log` → 404
- `/api/config/gstate/{sensor}/history` → 404

### Port 2332 (Data Collector)
- `http://{ip}:2332` → Connection refused (intern port)
- `http://{ip}:2332/data` → Connection refused
- `http://{ip}:2332/history` → Connection refused

**Notera:** Loggfilen nämner "Data collector ready on port 2332", men porten är inte tillgänglig via HTTP.

---

## 🔍 Testade Metoder

### 1. GET med Query-Parametrar
Testade alla bas-endpoints med:
- `?from=...&to=...`
- `?since=...`
- `?range=7d`
- `?days=7`
- `?history=true`

**Resultat:** Inga ändringar i response - samma data returneras.

### 2. POST-Requests
Testade POST på:
- `/api/config/datalog/query` med olika payloads
- `/api/config/datalog/fetch` med olika payloads

**Resultat:** Returnerar alltid samma config-struktur, oavsett payload.

### 3. Tidsstämplar i URL
Testade:
- `/api/config/gstate/data/{timestamp}`
- `/api/data/{timestamp}`
- `/api/datalog/{timestamp}`

**Resultat:** 404 eller samma response.

### 4. Alternativa Endpoint-Strukturer
Testade 30+ alternativa strukturer:
- `/api/data/*`
- `/api/history/*`
- `/api/query/*`
- `/api/export/*`
- `/api/backup/*`

**Resultat:** Alla returnerade 404.

---

## 💡 Slutsatser

### Vad Vi Vet

1. **Halo lagrar data:** Konfigurationen bekräftar 7 dagars lagring
2. **Data samlas kontinuerligt:** Var 15:e sekund (`rate_secs: 15`)
3. **Aktuell data tillgänglig:** Sensor `/data` paths returnerar nuvarande värden med tidsstämplar
4. **Ingen REST API för historik:** Inga endpoints hittades för att hämta historisk data

### Möjliga Förklaringar

1. **Intern lagring utan extern API**
   - Data lagras internt men exponeras inte via REST API
   - Möjligtvis endast tillgänglig via:
     - SNMP (Halo stödjer SNMP)
     - BACnet (Halo stödjer BACnet)
     - Intern firmware-logik
     - Filsystem (om SSH-åtkomst finns)

2. **Moln-baserad synkronisering**
   - Config visar `revproxy` med moln-anslutning
   - Historik kan vara tillgänglig via moln-API istället för lokal API

3. **Okänd endpoint-struktur**
   - Halo har 450+ endpoints
   - Historik-endpoint kan ha annan struktur än testad
   - Möjligtvis krävs specifik autentisering eller headers

---

## 📋 Rekommendationer

### Kortsiktigt (Nuvarande Situation)

**Vi har INTE stöd för catch-up från Halo:**

1. **Fortsätt med nuvarande lösning:**
   - Kontinuerlig datainsamling via collector (var 5-10 sek)
   - Lagring i InfluxDB med konfigurerbar retention
   - Historik från InfluxDB (inte från Halo)

2. **Förbättra datainsamling:**
   - Öka samplingfrekvens om nödvändigt
   - Implementera robust retry-logik
   - Logga datagap i InfluxDB (redan implementerat via heartbeat)

### Långsiktigt (Om Historik Hittas)

**Om historik-endpoint hittas senare:**

1. **Implementera catch-up-funktionalitet:**
   ```python
   # src/backend/collector/main.py

   def catch_up_missing_data(last_successful: datetime, now: datetime):
       """
       Fyll i datagap efter förlorad kontakt
       """
       if now - last_successful > timedelta(minutes=5):
           # Försök hämta historik från Halo
           historical = halo_client.get_historical_data(
               from_time=last_successful,
               to_time=now
           )
           if historical:
               # Skriv till InfluxDB med korrekta tidsstämplar
               for data_point in historical:
                   sensor_data_service.write_sensor_data(
                       data_point,
                       timestamp=parse_timestamp(data_point)
                   )
   ```

2. **Utöka HaloClient:**
   ```python
   # src/backend/collector/halo_client.py

   def get_historical_data(
       self,
       from_time: datetime,
       to_time: datetime
   ) -> Optional[List[Dict]]:
       """
       Hämta historisk sensordata från Halo
       """
       # Implementation när endpoint hittas
       pass
   ```

### Ytterligare Utforskning

1. **SNMP/BACnet:**
   - Halo stödjer SNMP och BACnet
   - Dessa protokoll kan ha historikdata
   - Kräver specifik klient-implementation

2. **Kontakta Halo Support:**
   - Fråga om API-endpoint för historik
   - Be om dokumentation för datalog-funktionalitet
   - Fråga om moln-API för historik

3. **Firmware-dokumentation:**
   - Sök i Halo firmware-dokumentation
   - Kolla om det finns hidden/dokumenterade endpoints

---

## 📊 Testresultat

### Testscripts Skapade

1. `explore_halo_historical_data.py` - Generell utforskning
2. `explore_halo_storage.py` - Lagringsanalys
3. `explore_halo_deep.py` - Djupare utforskning (POST, query params)
4. `explore_halo_specific_paths.py` - Specifika paths
5. `test_datalog_endpoints.py` - Datalog-endpoints i detalj
6. `test_sensor_data_paths.py` - Sensor /data paths

### Resultatfiler

- `halo_historical_data_exploration.json`
- `halo_storage_exploration.json`
- `halo_deep_exploration.json`
- `halo_specific_paths_exploration.json`
- `datalog_endpoints_detailed.json`
- `sensor_data_paths_detailed.json`

### Teststatistik

- **Totalt testade endpoints:** 100+
- **Fungerande endpoints:** ~15 (config, latest, logs)
- **Historik-endpoints hittade:** 0
- **Catch-up möjlig:** ❌ Nej (med nuvarande API)

---

## 🎯 Slutlig Bedömning

**Fråga:** "Kan Halo lagra mätvärden internt i 7 dagar?"
**Svar:** ✅ **JA** - Bekräftat via `datalog.keep_days = 7`

**Fråga:** "Har vi stöd för att hämta värden om vi tappar kontakten?"
**Svar:** ❌ **NEJ** - Ingen API-endpoint hittades för historisk data

**Rekommendation:**
- Fortsätt med kontinuerlig datainsamling
- Behåll InfluxDB som primär historik
- Om kontakten tappas, data kan INTE hämtas från Halo (med nuvarande API)
- Överväg att kontakta Halo-support för ytterligare information

---

**Nästa steg:**
1. Dokumentera detta i koden (kommentarer om begränsningar)
2. Överväg SNMP/BACnet-utforskning
3. Kontakta Halo-support om API-endpoint för historik

