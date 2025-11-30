# Halo 3C Sensor - Nyckelfakta

## Översikt

Halo 3C är en smart sensor med 43 dokumenterade sensorer och 26 händelsetyper för omfattande miljö- och säkerhetsövervakning.

## Anslutning

- **IP-adress:** REDACTED_HALO_IP
- **Autentisering:** HTTP Basic Auth (admin / REDACTED_HALO_PASSWORD)
- **Portar:** HTTP (80), HTTPS (443)
- **Huvudendpoint:** `GET /api/config/gstate/latest` (alla sensorvärden)

## Sensorkategorier

### Miljösensorer (5 sensorer)

- **Temperatur** (°C/°F): `htsensor/ctemp`, `htsensor/ftemp`
- **Luftfuktighet** (%): `htsensor/humidity`
- **Lufttryck** (hPa/inHg): `htsensor/press`, `htsensor/millibar`
- **Ljusnivå** (Lux): `luxsensor/aluxfilt`

**Användning:** Miljöövervakning, HVAC-integration, komfortövervakning

### Luftkvalitetssensorer (13 sensorer)

- **AQI** (0-500): `AQI/value` med kategorier (Bra/Måttlig/Ohälsosamt/Farligt)
- **CO2** (ppm): `co2sensor/co2` (kalibrerat), `co2sensor/co2o` (ekvivalent)
- **TVOC** (ppb): `co2sensor/tvoc`
- **Partiklar** (µg/m³): `pmsensor/raw/0` (PM1), `pmsensor/raw/1` (PM2.5), `pmsensor/raw/2` (PM10)
- **Gaser:** `gassensor/co` (CO, ppm), `gassensor/no2` (NO2, ppb), `gassensor/nh3` (NH3, ppm)

**Användning:** IAQ-övervakning, hälsövervakning, säkerhetsövervakning

### Ljudsensorer (11 sensorer)

- **Ljudnivå** (dB): `audsensor/sum`, `audsensor/l` (hög förstärkning), `audsensor/r` (låg förstärkning)
- **Aggression-detektor:** `audsensor/rms0`
- **Skottlossning:** `audsensor/gs`
- **Nyckelordsdetektion:** `audsensor/kw1-8` (8 kanaler med multi-språkstöd)

**Användning:** Säkerhetsövervakning, mobbning-detektion, nödrop-detektion

### Rörelsesensorer (4 sensorer)

- **PIR:** `pir/max` (passiv infraröd)
- **Accelerometer:** `accsensor/x`, `accsensor/y`, `accsensor/z`, `accsensor/move`
- **Extern ingång:** `extin/inp`
- **BLE Beacon:** `blebcn/alert/status`

**Användning:** Rörelsedetektering, tamper-detektering, falldetektering

### Hälsoindex (8 sensorer)

- **Totalt hälsoindex:** `HealthIndex/val` (0-5: Utmärkt → Mycket dålig)
- **Per-sensor index:** CO2, Humidity, PM1, PM2.5, PM10, TVOC, NO2

**Användning:** Snabb översikt av IAQ, dashboard-visualisering, alarm-triggers

## Händelsetyper (26 st)

### Grupp 1: Vaping/Smoking

- Vape, THC, Masking, Smoking

### Grupp 4: Säkerhet

- Gunshot, Aggression, Tamper, Help, Motion

### Grupp 8: Luftkvalitet

- Health_Index, AQI, TVOC, CO2cal, PM2.5

### Grupp 16: Miljövarningar

- PM1, PM10, Humidity, Humidity_Low, Temp_C, Temp_C_Low, NO2, CO, NH3, Light, Sound

## Viktiga tröskelvärden

- **CO2:** <1000 ppm optimalt, >2000 ppm kritiskt
- **AQI:** 0-50 Bra, 51-100 Måttlig, 101-150 Ohälsosamt för känsliga, 151-200 Ohälsosamt, 201-300 Mycket ohälsosamt, 301-500 Farligt
- **Hälsoindex:** 0=Utmärkt, 1=Mycket bra, 2=Bra, 3=Måttlig, 4=Dålig, 5=Mycket dålig

## Händelsesystem

Varje händelse har:

- Tröskelvärde (threshold)
- Operator (gte, lte, eq)
- Hysteres (för att undvika flapping)
- Paus i minuter (pausem)
- Aviseringar (email, VMS, ljud, LED, relay)

## Användningsområden

- **Skolor:** Vape/rökning-detektion, mobbning/aggression, nödrop
- **Kontor:** IAQ-övervakning, energioptimering, komfort
- **Vård:** Falldetektering, nödrop, luftkvalitet för känsliga
- **Industri:** Gassäkerhet, partikelövervakning, arbetsmiljö

## API-hastighet

- Polling-intervall: 5-10 sekunder rekommenderat
- Endpoint: `GET /api/config/gstate/latest` (alla sensorer på en gång)
- Event-status: `GET /api/config/gstate/event_state` (aktiva händelser)

## Dokumentation

- **SENSORS.md:** Komplett sensorlista med format och användning
- **API_REFERENCE.md:** 450+ dokumenterade endpoints
- **EXAMPLES.md:** Praktiska kodexempel
- **INTEGRATIONS.md:** Integrationsmöjligheter

---

**Dokumentation skapad:** 2025-01-27

