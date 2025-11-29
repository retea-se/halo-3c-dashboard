/**
 * Documentation - Teknisk dokumentation för Tekniklokaler Dashboard
 */
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';

type DocSection = 'overview' | 'sensors' | 'monitoring' | 'occupancy' | 'alerts' | 'api' | 'deployment';

export const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<DocSection>('overview');

  const sections: { id: DocSection; title: string; icon: string }[] = [
    { id: 'overview', title: 'Översikt', icon: '📋' },
    { id: 'sensors', title: 'Sensorer', icon: '📡' },
    { id: 'monitoring', title: 'Systemövervakning', icon: '💓' },
    { id: 'occupancy', title: 'Närvarodetektion', icon: '👤' },
    { id: 'alerts', title: 'Larm & Varningar', icon: '🚨' },
    { id: 'api', title: 'API-referens', icon: '🔌' },
    { id: 'deployment', title: 'Driftsättning', icon: '🚀' },
  ];

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Dokumentation</h1>

      <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        {/* Sidnavigering */}
        <nav style={{
          minWidth: '200px',
          flex: '0 0 200px',
        }}>
          <Card padding="md">
            <h3 style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-md)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Innehåll
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      border: 'none',
                      background: activeSection === section.id
                        ? 'var(--color-primary)'
                        : 'transparent',
                      color: activeSection === section.id
                        ? 'white'
                        : 'var(--color-text-primary)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    <span>{section.icon}</span>
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </nav>

        {/* Huvudinnehåll */}
        <main style={{ flex: 1, minWidth: '300px' }}>
          <Card padding="lg">
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'sensors' && <SensorsSection />}
            {activeSection === 'monitoring' && <MonitoringSection />}
            {activeSection === 'occupancy' && <OccupancySection />}
            {activeSection === 'alerts' && <AlertsSection />}
            {activeSection === 'api' && <ApiSection />}
            {activeSection === 'deployment' && <DeploymentSection />}
          </Card>
        </main>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{
    fontSize: 'var(--font-size-xl)',
    marginBottom: 'var(--spacing-lg)',
    paddingBottom: 'var(--spacing-sm)',
    borderBottom: '2px solid var(--color-border)',
  }}>
    {children}
  </h2>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 'var(--spacing-xl)' }}>
    <h3 style={{
      fontSize: 'var(--font-size-lg)',
      marginBottom: 'var(--spacing-md)',
      color: 'var(--color-text-primary)',
    }}>
      {title}
    </h3>
    <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
      {children}
    </div>
  </div>
);

const CodeBlock: React.FC<{ children: string }> = ({ children }) => (
  <pre style={{
    backgroundColor: 'var(--color-surface)',
    padding: 'var(--spacing-md)',
    borderRadius: 'var(--radius-md)',
    overflow: 'auto',
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'monospace',
    border: '1px solid var(--color-border)',
  }}>
    {children}
  </pre>
);

const OverviewSection: React.FC = () => (
  <>
    <SectionTitle>Översikt</SectionTitle>

    <SubSection title="Om Tekniklokaler Dashboard">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Tekniklokaler Dashboard är ett övervakningssystem för obemannade tekniska utrymmen.
        Systemet samlar in data från Halo 3C-sensorer och presenterar realtidsövervakning
        av luftkvalitet, temperatur, ljudnivåer och närvarodetektion.
      </p>
      <p>
        Dashboarden är byggd med React (TypeScript) för frontend och FastAPI (Python) för backend,
        med InfluxDB som tidsserie-databas för historisk data.
      </p>
    </SubSection>

    <SubSection title="Arkitektur">
      <CodeBlock>{`┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Halo 3C       │────▶│   Collector      │────▶│  InfluxDB   │
│   Sensor        │     │   (Python)       │     │  (TimeSeries)│
└─────────────────┘     └──────────────────┘     └─────────────┘
                                                        │
                        ┌──────────────────┐            │
                        │   FastAPI        │◀───────────┘
                        │   Backend        │
                        └──────────────────┘
                                │
                        ┌──────────────────┐
                        │   React          │
                        │   Frontend       │
                        └──────────────────┘`}</CodeBlock>
    </SubSection>

    <SubSection title="Funktioner">
      <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
        <li>Realtidsövervakning av sensorvärden</li>
        <li>Närvarodetektion baserad på CO2, ljud och BLE-beacons</li>
        <li>Historiska grafer och trendanalys</li>
        <li>Halo Heartbeat - övervakning av sensorkontakt</li>
        <li>Rörelseindikering baserad på ljudnivå och accelerometer</li>
        <li>Systemhälsa och degraderingsvarningar</li>
        <li>BLE-beacon-övervakning för panikknappsfunktion</li>
        <li>Event-loggning och notifikationer</li>
      </ul>
    </SubSection>
  </>
);

const SensorsSection: React.FC = () => (
  <>
    <SectionTitle>Sensorer</SectionTitle>

    <SubSection title="Halo 3C Multi-sensor">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Halo 3C är en avancerad multi-sensor designad för övervakning av inomhusmiljö.
        Den samlar in följande mätvärden:
      </p>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: 'var(--spacing-md)',
      }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-surface)' }}>
            <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>Sensor</th>
            <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>Enhet</th>
            <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>Normalvärde</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>Temperatur</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>°C</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>18-24</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>Luftfuktighet</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>%</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>30-60</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>Lufttryck</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>hPa</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>980-1050</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>CO2</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>ppm</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>400-1000</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>TVOC</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>ppb</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>0-500</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>PM1</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>µg/m³</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>0-12</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>PM2.5</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>µg/m³</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>0-25</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>PM10</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>µg/m³</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>0-50</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>Kolmonoxid (CO)</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>ppm</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>0-9</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>Kvävedioxid (NO2)</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>ppb</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>0-100</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>Ammoniak (NH3)</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>ppm</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>0-25</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>Ljudnivå</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>dB</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>30-60</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>Ljusnivå</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>lux</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>0-500</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>PIR Rörelse</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>Signal</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>0-1</td></tr>
          <tr><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>Accelerometer (X/Y/Z)</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>milli g</td><td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>-1000 till 1000</td></tr>
        </tbody>
      </table>
    </SubSection>

    <SubSection title="Air Quality Index (AQI)">
      <p>
        AQI beräknas av sensorn baserat på en kombination av CO2, TVOC och PM-värden.
        Skalan går från 0 (utmärkt) till 5 (mycket dålig).
      </p>
      <ul style={{ paddingLeft: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
        <li><strong>0-1:</strong> Utmärkt luftkvalitet</li>
        <li><strong>1-2:</strong> Bra luftkvalitet</li>
        <li><strong>2-3:</strong> Måttlig luftkvalitet</li>
        <li><strong>3-4:</strong> Dålig luftkvalitet</li>
        <li><strong>4-5:</strong> Mycket dålig luftkvalitet</li>
      </ul>
    </SubSection>
  </>
);

const MonitoringSection: React.FC = () => (
  <>
    <SectionTitle>Systemövervakning</SectionTitle>

    <SubSection title="Halo Heartbeat">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Systemet övervakar kontinuerligt kontakten med Halo 3C-sensorn genom en
        heartbeat-mekanism. Vid varje datainsamling (var 10:e sekund) kontrolleras
        om sensorn svarar och responstiden mäts.
      </p>
      <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
        <li><strong>Online (grön):</strong> Sensorn svarar inom 30 sekunder</li>
        <li><strong>Degraderad (gul):</strong> Sensorn svarade för 30-120 sekunder sedan</li>
        <li><strong>Offline (röd):</strong> Ingen kontakt på över 2 minuter</li>
      </ul>
      <p style={{ marginTop: 'var(--spacing-md)' }}>
        Heartbeat-status visas i navigeringsfältet och loggas till InfluxDB för
        historisk analys. I Grafer-sidan kan du välja "Halo Heartbeat" för att se
        när och hur länge sensorn varit onåbar över tid.
      </p>
    </SubSection>

    <SubSection title="Heartbeat-data i grafer">
      <CodeBlock>{`Heartbeat-mätning:
────────────────────────────────────────
Measurement: halo_heartbeat
Fields:
  connected      →  1.0 (online) / 0.0 (offline)
  response_time  →  Responstid i millisekunder
Tags:
  device_id      →  Enhets-ID
  error          →  Felmeddelande (vid offline)

Användning i Grafer-sidan:
────────────────────────────────────────
1. Gå till "Grafer" i menyn
2. Välj "Halo Heartbeat" i sensorlistan
3. Välj tidsperiod (1h, 24h, 7d, etc.)
4. Perioder med värde 0 = sensorn offline`}</CodeBlock>
    </SubSection>

    <SubSection title="Rörelseindikering">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Systemet indikerar rörelse och aktivitet på flera sätt:
      </p>
      <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
        <li><strong>PIR-sensor:</strong> Detekterar rörelse via passiv infraröd sensor (0 = ingen rörelse, 1 = rörelse)</li>
        <li><strong>Accelerometer:</strong> Detekterar vibration och rörelse i X/Y/Z-axlar</li>
        <li><strong>Ljudbaserad aktivitet:</strong> Ljudnivå används som proxy för aktivitet:</li>
      </ul>
      <CodeBlock>{`Aktivitetsnivåer baserat på ljud:
────────────────────────────────────────
< 40 dB   →  Ingen aktivitet (tyst)
40-55 dB  →  Låg aktivitet (bakgrundsljud)
55-65 dB  →  Normal aktivitet (samtal, rörelse)
> 65 dB   →  Hög aktivitet`}</CodeBlock>
    </SubSection>

    <SubSection title="Accelerometer-magnitud">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Accelerometerns X-, Y- och Z-värden kombineras till en magnitud för enklare
        analys av total rörelse/vibration:
      </p>
      <CodeBlock>{`Magnitud = √(X² + Y² + Z²)

Normal magnitud (stillastående): ~1000 milli g (1g = gravitation)
Förhöjd magnitud: Indikerar rörelse, vibration eller tamper`}</CodeBlock>
    </SubSection>
  </>
);

const OccupancySection: React.FC = () => (
  <>
    <SectionTitle>Närvarodetektion</SectionTitle>

    <SubSection title="Hur det fungerar">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Systemet använder en poängbaserad approach för att avgöra om ett rum är bemannat.
        Tre olika datakällor bidrar till den totala poängen:
      </p>
      <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
        <li><strong>CO2-nivå:</strong> Förhöjd CO2 indikerar mänsklig närvaro</li>
        <li><strong>Ljudnivå:</strong> Ljud från röster eller aktivitet</li>
        <li><strong>BLE-beacons:</strong> Registrerade enheter i närheten</li>
      </ul>
    </SubSection>

    <SubSection title="Poängsystem">
      <CodeBlock>{`Poängberäkning:
────────────────────────────────────────
CO2 > 800 ppm (hög)      →  +3 poäng
CO2 > 600 ppm (medium)   →  +1 poäng
Ljud > 55 dB (hög)       →  +2 poäng
Ljud > 45 dB (medium)    →  +1 poäng
BLE Beacon närvarande    →  +5 poäng

Statusbestämning:
────────────────────────────────────────
Score >= 3  →  BEMANNAT (occupied)
Score <= 1  →  TOMT (vacant)
Annars      →  OSÄKERT (uncertain)`}</CodeBlock>
    </SubSection>

    <SubSection title="Konfidensgrad">
      <p>
        Systemet rapporterar också en konfidensgrad baserat på hur många datakällor
        som bidrar till beslutet:
      </p>
      <ul style={{ paddingLeft: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
        <li><strong>Hög:</strong> Flera datakällor överensstämmer</li>
        <li><strong>Medium:</strong> Några datakällor stödjer bedömningen</li>
        <li><strong>Låg:</strong> Osäker data eller endast en källa</li>
      </ul>
    </SubSection>
  </>
);

const AlertsSection: React.FC = () => (
  <>
    <SectionTitle>Larm & Varningar</SectionTitle>

    <SubSection title="Systemvarningar (Degradation Alerts)">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Systemet övervakar kontinuerligt komponenternas hälsa och visar varningar vid problem:
      </p>
      <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
        <li><strong>🔴 Kritisk:</strong> Sensor offline, databas nere</li>
        <li><strong>🟡 Varning:</strong> Gammal data, collector stoppad</li>
        <li><strong>🔵 Info:</strong> Mindre avvikelser</li>
      </ul>
    </SubSection>

    <SubSection title="Trendvarningar (Trend Alerts)">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Observationer visas när sensorvärden avviker från normalintervallet:
      </p>
      <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
        <li>Värden över normalmax markeras med ↑</li>
        <li>Värden under normalmin markeras med ↓</li>
        <li>Snabba förändringar indikeras med trendpilar</li>
      </ul>
    </SubSection>

    <SubSection title="BLE Panikknapp">
      <p>
        Systemet stödjer BLE-beacons med panikknappsfunktion. När en panikknapp
        trycks skickas en kritisk notifikation till dashboarden.
      </p>
    </SubSection>
  </>
);

const ApiSection: React.FC = () => (
  <>
    <SectionTitle>API-referens</SectionTitle>

    <SubSection title="Endpoints">
      <CodeBlock>{`Sensorer:
GET  /api/sensors/latest           - Senaste sensorvärden
GET  /api/sensors/history          - Historiska värden
GET  /api/sensors/meta             - Sensormetadata
GET  /api/sensors/heartbeat/history - Heartbeat-historik

Närvaro:
GET  /api/occupancy/status    - Aktuell närvarostatus
GET  /api/occupancy/history   - Närvarohistorik
GET  /api/occupancy/config    - Konfiguration

Events:
GET  /api/events              - Event-lista
POST /api/events/ack/:id      - Kvittera event

Beacons:
GET  /api/beacons             - Lista beacons
GET  /api/beacons/:id         - Beacon-detaljer
GET  /api/beacons/:id/history - Beacon-historik

System:
GET  /api/system/status       - Systemhälsa
GET  /api/system/heartbeat    - Aktuell heartbeat-status
GET  /api/auth/login          - Autentisering`}</CodeBlock>
    </SubSection>

    <SubSection title="Autentisering">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        API:et använder JWT-tokens för autentisering. Token skickas i Authorization-headern:
      </p>
      <CodeBlock>{`Authorization: Bearer <jwt_token>`}</CodeBlock>
    </SubSection>

    <SubSection title="WebSocket">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Realtidsuppdateringar sker via WebSocket:
      </p>
      <CodeBlock>{`WebSocket: /api/events/stream

Meddelanden:
{
  "type": "new_event",
  "event": {
    "id": "...",
    "type": "SENSOR_ALERT",
    "severity": "WARNING",
    "summary": "..."
  }
}`}</CodeBlock>
    </SubSection>
  </>
);

const DeploymentSection: React.FC = () => (
  <>
    <SectionTitle>Driftsättning</SectionTitle>

    <SubSection title="Docker Compose">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Systemet körs via Docker Compose med följande tjänster:
      </p>
      <CodeBlock>{`services:
  frontend    # React-app (nginx)
  backend     # FastAPI server
  collector   # Datainsamlare
  influxdb    # Tidsserie-databas`}</CodeBlock>
    </SubSection>

    <SubSection title="Miljövariabler">
      <CodeBlock>{`# Backend
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_TOKEN=<token>
INFLUXDB_ORG=halo-org
INFLUXDB_BUCKET=halo-sensors
JWT_SECRET=<secret>

# Collector
HALO_SENSOR_IP=192.168.0.73
COLLECTION_INTERVAL=10

# Auth (demo-läge)
DEMO_MODE=true
DEMO_USERNAME=demo
DEMO_PASSWORD=<password>`}</CodeBlock>
    </SubSection>

    <SubSection title="Felsökning">
      <p style={{ marginBottom: 'var(--spacing-md)' }}>
        Vanliga felsökningskommandon:
      </p>
      <CodeBlock>{`# Visa loggar
docker-compose logs -f backend
docker-compose logs -f collector

# Starta om tjänster
docker-compose restart backend
docker-compose restart collector

# Kontrollera status
docker-compose ps`}</CodeBlock>
    </SubSection>
  </>
);

export default Documentation;
