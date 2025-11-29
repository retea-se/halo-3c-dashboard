/**
 * Dashboard Page - Huvudsida med sensor cards och beacon list
 */
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { SensorCard } from '../components/sensors/SensorCard';
import { BeaconList } from '../components/beacons/BeaconList';
import { TrendAlerts } from '../components/alerts/TrendAlerts';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';

interface SensorData {
  sensor_id: string;
  timestamp: string;
  values: Record<string, number>;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface LatestSensorsResponse {
  device_id: string;
  timestamp: string;
  sensors: SensorData[];
}

// Prioriterad whitelist - de BÄSTA sensorerna för varje typ
// Om flera sensorer finns för samma mätvärde, väljs den första i listan
const SENSOR_PRIORITY_CONFIG: { [key: string]: { displayName: string; unit: string; category: string; normalRange?: { min: number; max: number } } } = {
  // Temperatur - htsensor är mest tillförlitlig
  'htsensor/ctemp': { displayName: 'Temperatur', unit: '°C', category: 'Miljö', normalRange: { min: 18, max: 24 } },
  // Luftfuktighet
  'htsensor/humidity': { displayName: 'Luftfuktighet', unit: '%', category: 'Miljö', normalRange: { min: 30, max: 60 } },
  // CO2 - co2sensor har bättre precision
  'co2sensor/co2fo': { displayName: 'Koldioxid (CO₂)', unit: 'ppm', category: 'Luftkvalitet', normalRange: { min: 400, max: 1000 } },
  // TVOC
  'co2sensor/tvoc': { displayName: 'TVOC', unit: 'ppb', category: 'Luftkvalitet', normalRange: { min: 0, max: 500 } },
  // AQI
  'AQI/src': { displayName: 'Air Quality Index', unit: 'Index', category: 'Hälsoindex', normalRange: { min: 0, max: 2 } },
  // Hälsoindex
  'HealthIndex/val': { displayName: 'Hälsoindex', unit: 'Index', category: 'Hälsoindex', normalRange: { min: 0, max: 2 } },
  // PM-sensorer
  'pmsensor/pm2p5conc': { displayName: 'PM2.5', unit: 'µg/m³', category: 'Luftkvalitet', normalRange: { min: 0, max: 25 } },
  'pmsensor/pm10conc': { displayName: 'PM10', unit: 'µg/m³', category: 'Luftkvalitet', normalRange: { min: 0, max: 50 } },
  // Ljud
  'audsensor/sum': { displayName: 'Ljudnivå', unit: 'dB', category: 'Ljud', normalRange: { min: 30, max: 60 } },
  // Ljus
  'luxsensor/alux': { displayName: 'Ljusnivå', unit: 'lux', category: 'Ljus', normalRange: { min: 300, max: 500 } },
};

// Funktion för att filtrera och deduplisera sensorer för dashboard
const filterDashboardSensors = (sensors: SensorData[]): SensorData[] => {
  const allowedIds = Object.keys(SENSOR_PRIORITY_CONFIG);

  return sensors.filter(sensor => {
    // Endast sensorer i whitelist (exakt matchning)
    if (!allowedIds.includes(sensor.sensor_id)) {
      return false;
    }

    // Kolla om värde finns
    const value = Object.values(sensor.values)[0];
    if (value === undefined || value === null) return false;

    // Skippa värden som ser ut som timestamps (>1 biljon)
    if (value > 1000000000000) return false;

    return true;
  });
};

export const Dashboard: React.FC = () => {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [previousSensors, setPreviousSensors] = useState<SensorData[]>([]);
  const [sensorMetadata, setSensorMetadata] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  // WebSocket connection för real-time events
  // Dynamisk URL-konstruktion baserat på window.location
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.hostname;

  // Om vi är i produktion (inte localhost), använd relativa URL
  // så att nginx kan proxya WebSocket till backend
  // Annars använd samma port som frontend (för utveckling)
  let wsUrl: string;
  if (wsHost !== 'localhost' && wsHost !== '127.0.0.1') {
    // Produktion med nginx proxy: använd relativa URL
    // Nginx proxar /api/events/stream till backend:8000
    wsUrl = `${wsProtocol}//${wsHost}${window.location.port ? `:${window.location.port}` : ''}/api/events/stream`;
  } else {
    // Utveckling: använd samma host och port
    const defaultPort = window.location.protocol === 'https:' ? '443' : '80';
    const wsPort = window.location.port || defaultPort;
    const portSuffix = wsPort && wsPort !== '80' && wsPort !== '443' ? `:${wsPort}` : '';
    wsUrl = `${wsProtocol}//${wsHost}${portSuffix}/api/events/stream`;
  }
  const { lastMessage } = useWebSocket(wsUrl);

  // Ladda sensor metadata
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const metadata = await apiService.getSensorMetadata();
        setSensorMetadata(metadata);
      } catch (error) {
        console.error('Failed to load sensor metadata:', error);
      }
    };
    loadMetadata();
  }, []);

  // Ladda senaste sensorvärden
  useEffect(() => {
    const loadSensors = async () => {
      try {
        setLoading(true);
        const response: LatestSensorsResponse = await apiService.getLatestSensors();
        const rawSensors = response.sensors || [];

        // Filtrera bort ogiltiga sensorer
        const filteredSensors = filterDashboardSensors(rawSensors);

        // Beräkna trender genom att jämföra med föregående värden
        const sensorsWithTrends = filteredSensors.map(sensor => {
          const currentValue = Object.values(sensor.values)[0];
          const prevSensor = previousSensors.find(p => p.sensor_id === sensor.sensor_id);
          const prevValue = prevSensor ? Object.values(prevSensor.values)[0] : undefined;

          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (prevValue !== undefined && currentValue !== undefined) {
            const diff = currentValue - prevValue;
            const threshold = Math.abs(prevValue) * 0.02; // 2% ändring
            if (diff > threshold) trend = 'up';
            else if (diff < -threshold) trend = 'down';
          }

          return {
            ...sensor,
            previousValue: prevValue,
            trend,
          };
        });

        setPreviousSensors(filteredSensors);
        setSensors(sensorsWithTrends);
      } catch (error) {
        console.error('Failed to load sensors:', error);
        showToast('Kunde inte ladda sensorvärden', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadSensors();
    // Uppdatera varje 10 sekunder
    const interval = setInterval(loadSensors, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  // Hantera WebSocket events
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'new_event') {
          const event = data.event;
          // Visa toast för kritiska events
          if (event.severity === 'CRITICAL' || event.severity === 'WARNING') {
            const severity: 'error' | 'warning' = event.severity === 'CRITICAL' ? 'error' : 'warning';
            showToast(event.summary, severity, 8000);
          }
          // Speciell hantering för panikknapp-events
          if (event.type === 'BEACON_PANIC_BUTTON') {
            showToast(`PANIKKNAPP: ${event.summary}`, 'error', 15000);
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage, showToast]);

  // Kombinera sensor data med inbyggd konfiguration (prioriteras) eller extern metadata
  const sensorsWithMetadata = sensors.map((sensor) => {
    // Använd inbyggd konfiguration om den finns
    const config = SENSOR_PRIORITY_CONFIG[sensor.sensor_id];
    if (config) {
      return {
        ...sensor,
        metadata: {
          display_name: config.displayName,
          unit: config.unit,
          category: config.category,
          normal_range: config.normalRange,
        },
      };
    }

    // Fallback till extern metadata
    const metadata = sensorMetadata.find((m) => {
      const sensorKey = sensor.sensor_id.split('/')[0];
      return (m.id && m.id.includes(sensorKey)) || (m.technical_name && m.technical_name.includes(sensorKey));
    });
    return {
      ...sensor,
      metadata,
    };
  });

  // Gruppera sensorer per kategori med definierad ordning
  const categoryOrder = ['Hälsoindex', 'Luftkvalitet', 'Miljö', 'Ljud', 'Ljus', 'Övrigt'];
  const sensorsByCategory = sensorsWithMetadata.reduce((acc, sensor) => {
    const category = sensor.metadata?.category || 'Övrigt';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(sensor);
    return acc;
  }, {} as Record<string, typeof sensorsWithMetadata>);

  // Sortera kategorier enligt definierad ordning
  const sortedCategories = Object.entries(sensorsByCategory).sort(([a], [b]) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1400px', margin: '0 auto' }}>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Dashboard</h1>

      {loading && sensors.length === 0 ? (
        <div>Laddar sensorvärden...</div>
      ) : sensors.length === 0 ? (
        <div
          style={{
            padding: 'var(--spacing-2xl)',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-primary)' }}>
            Inga sensorvärden tillgängliga
          </h2>
          <p style={{ marginBottom: 'var(--spacing-sm)' }}>
            Väntar på data från Halo 3C-sensorn...
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)' }}>
            Kontrollera att sensorn är ansluten och att collector-tjänsten körs.
          </p>
        </div>
      ) : (
        <>
          {/* Mjuka larm för avvikande värden */}
          <TrendAlerts sensors={sensorsWithMetadata} />

          {/* Sensor Cards grupperade per kategori */}
          {sortedCategories.map(([category, categorySensors]) => (
            <div key={category} style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 600,
                  marginBottom: 'var(--spacing-md)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {category}
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 'var(--spacing-md)',
                }}
              >
                {categorySensors.map((sensor) => (
                  <SensorCard
                    key={sensor.sensor_id}
                    sensorData={sensor}
                    metadata={sensor.metadata}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Beacon List - Tonad ned, mindre prominent */}
          {sensors.length > 0 && (
            <details
              style={{
                marginTop: 'var(--spacing-2xl)',
                padding: 'var(--spacing-md)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-elevated)',
              }}
            >
              <summary
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  listStyle: 'none',
                }}
              >
                BLE Beacons (klicka för att visa)
              </summary>
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <BeaconList />
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
};

