/**
 * Sensor Compare - Jämför flera sensorer i samma graf
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { apiService } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Fallback-lista med alla kända sensorer (används om API inte returnerar sensorer)
const FALLBACK_SENSORS = [
  // Miljö
  { id: 'htsensor/ctemp', name: 'Temperatur', unit: '°C', color: '#ef4444' },
  { id: 'htsensor/humidity', name: 'Luftfuktighet', unit: '%', color: '#3b82f6' },
  { id: 'htsensor/millibar', name: 'Lufttryck (hPa)', unit: 'hPa', color: '#8b5cf6' },
  { id: 'htsensor/press', name: 'Lufttryck (inHg)', unit: 'inHg', color: '#a855f7' },
  // Luftkvalitet
  { id: 'co2sensor/co2fo', name: 'CO₂', unit: 'ppm', color: '#f59e0b' },
  { id: 'co2sensor/co2', name: 'CO₂ (kalibrerad)', unit: 'ppm', color: '#f97316' },
  { id: 'co2sensor/tvoc', name: 'TVOC', unit: 'ppb', color: '#8b5cf6' },
  { id: 'gassensor/co', name: 'Kolmonoxid (CO)', unit: 'ppm', color: '#dc2626' },
  { id: 'gassensor/no2', name: 'Kvävedioxid (NO₂)', unit: 'ppb', color: '#ea580c' },
  { id: 'gassensor/nh3', name: 'Ammoniak (NH₃)', unit: 'ppm', color: '#d97706' },
  // Partiklar
  { id: 'pmsensor/raw/0', name: 'PM1', unit: 'µg/m³', color: '#10b981' },
  { id: 'pmsensor/pm2p5conc', name: 'PM2.5', unit: 'µg/m³', color: '#059669' },
  { id: 'pmsensor/raw/1', name: 'PM2.5 (rådata)', unit: 'µg/m³', color: '#047857' },
  { id: 'pmsensor/pm10conc', name: 'PM10', unit: 'µg/m³', color: '#06b6d4' },
  { id: 'pmsensor/raw/2', name: 'PM10 (rådata)', unit: 'µg/m³', color: '#0891b2' },
  // Ljud
  { id: 'audsensor/sum', name: 'Ljudnivå', unit: 'dB', color: '#ec4899' },
  // Ljus
  { id: 'luxsensor/aluxfilt', name: 'Ljusnivå (filtrerad)', unit: 'lux', color: '#f97316' },
  { id: 'luxsensor/alux', name: 'Ljusnivå (ofiltrerad)', unit: 'lux', color: '#fb923c' },
  // Hälsoindex
  { id: 'AQI/src', name: 'AQI (src)', unit: 'Index', color: '#6366f1' },
  { id: 'AQI/value', name: 'AQI (value)', unit: 'Index', color: '#4f46e5' },
  { id: 'HealthIndex/val', name: 'Hälsoindex', unit: 'Index', color: '#14b8a6' },
  // Rörelse
  { id: 'pir/max', name: 'PIR Rörelse', unit: 'Signal', color: '#22c55e' },
  { id: 'accsensor/move', name: 'Vibration', unit: 'Status', color: '#16a34a' },
  // System
  { id: 'heartbeat/status', name: 'Halo Heartbeat', unit: 'Status', color: '#ef4444' },
];

// Tidsintervall
const TIME_RANGES = [
  { label: '1 timme', hours: 1 },
  { label: '6 timmar', hours: 6 },
  { label: '24 timmar', hours: 24 },
  { label: '7 dagar', hours: 168 },
  { label: '1 månad', hours: 720 },
  { label: '6 månader', hours: 4320 },
  { label: '12 månader', hours: 8640 },
];

interface SensorHistoryData {
  timestamp: string;
  value: number;
}

export const SensorCompare: React.FC = () => {
  const { colors } = useTheme();
  const [selectedSensors, setSelectedSensors] = useState<string[]>(['htsensor/ctemp', 'htsensor/humidity']);
  const [timeRange, setTimeRange] = useState(24);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [normalizeData, setNormalizeData] = useState(false);
  const [availableSensors, setAvailableSensors] = useState<Array<{ id: string; name: string; unit: string; color: string }>>(FALLBACK_SENSORS);

  // Hämta tillgängliga sensorer från senaste sensorvärden
  useEffect(() => {
    const loadAvailableSensors = async () => {
      try {
        const response = await apiService.getLatestSensors();
        const sensors = response.sensors || [];

        // Hämta metadata för att få display names
        const metadata = await apiService.getSensorMetadata();

        // Skapa lista med sensorer som faktiskt har data
        const sensorsWithData = sensors
          .filter((s: any) => {
            const value = Object.values(s.values || {})[0];
            return value !== undefined && value !== null && value < 1000000000000;
          })
          .map((s: any) => {
            // Hitta metadata för denna sensor
            const meta = metadata.find((m: any) => {
              const techName = m.technical_name || '';
              return techName === s.sensor_id || s.sensor_id.includes(techName.split('/')[0]);
            });

            // Generera färg baserat på sensor-typ
            const getColor = (sensorId: string) => {
              if (sensorId.includes('temp')) return '#ef4444';
              if (sensorId.includes('humidity')) return '#3b82f6';
              if (sensorId.includes('co2')) return '#f59e0b';
              if (sensorId.includes('tvoc')) return '#8b5cf6';
              if (sensorId.includes('pm')) return '#10b981';
              if (sensorId.includes('gas')) return '#dc2626';
              if (sensorId.includes('aud')) return '#ec4899';
              if (sensorId.includes('lux')) return '#f97316';
              if (sensorId.includes('AQI') || sensorId.includes('Health')) return '#6366f1';
              if (sensorId.includes('pir') || sensorId.includes('acc')) return '#22c55e';
              if (sensorId.includes('heartbeat')) return '#ef4444';
              return '#6b7280';
            };

            return {
              id: s.sensor_id,
              name: meta?.display_name || s.sensor_id,
              unit: meta?.unit || '',
              color: getColor(s.sensor_id),
            };
          });

        // Kombinera med fallback för sensorer som kanske inte har data just nu
        const allSensors = [...sensorsWithData];
        FALLBACK_SENSORS.forEach((fallback) => {
          if (!allSensors.find((s) => s.id === fallback.id)) {
            allSensors.push(fallback);
          }
        });

        setAvailableSensors(allSensors);
      } catch (error) {
        console.error('Failed to load available sensors:', error);
        // Använd fallback om API misslyckas
        setAvailableSensors(FALLBACK_SENSORS);
      }
    };

    loadAvailableSensors();
  }, []);

  // Ladda historikdata för valda sensorer
  const loadData = useCallback(async () => {
    if (selectedSensors.length === 0) {
      setChartData([]);
      return;
    }

    setLoading(true);
    try {
      const toTime = new Date().toISOString();
      const fromTime = new Date(Date.now() - timeRange * 60 * 60 * 1000).toISOString();

      // Hämta data för alla valda sensorer parallellt
      const dataPromises = selectedSensors.map(async (sensorId) => {
        try {
          const history = await apiService.getSensorHistory(sensorId, fromTime, toTime, 1000);
          return { sensorId, data: history || [] };
        } catch (error) {
          console.error(`Failed to load history for ${sensorId}:`, error);
          return { sensorId, data: [] };
        }
      });

      const results = await Promise.all(dataPromises);

      // Kombinera data till ett format för Recharts
      // Skapa en tidslinje med alla datapunkter
      const timeMap = new Map<string, any>();

      results.forEach(({ sensorId, data }) => {
        const sensorConfig = availableSensors.find((s) => s.id === sensorId);
        if (!sensorConfig) return;

        data.forEach((point: SensorHistoryData) => {
          // Runda av timestamp till närmaste minut för bättre sammanfogning
          const date = new Date(point.timestamp);
          const roundedTime = new Date(
            Math.round(date.getTime() / (60 * 1000)) * (60 * 1000)
          ).toISOString();

          if (!timeMap.has(roundedTime)) {
            timeMap.set(roundedTime, { timestamp: roundedTime });
          }

          const entry = timeMap.get(roundedTime);
          entry[sensorId] = point.value;
        });
      });

      // Konvertera till array och sortera
      const combinedData = Array.from(timeMap.values())
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Om normalisering är aktiverad, normalisera varje sensor till 0-100
      if (normalizeData && combinedData.length > 0) {
        selectedSensors.forEach((sensorId) => {
          const values = combinedData
            .map((d) => d[sensorId])
            .filter((v) => v !== undefined) as number[];
          if (values.length === 0) return;

          const min = Math.min(...values);
          const max = Math.max(...values);
          const range = max - min || 1;

          combinedData.forEach((d) => {
            if (d[sensorId] !== undefined) {
              d[sensorId] = ((d[sensorId] - min) / range) * 100;
            }
          });
        });
      }

      setChartData(combinedData);
    } catch (error) {
      console.error('Failed to load sensor data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSensors, timeRange, normalizeData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hantera sensor-val
  const toggleSensor = (sensorId: string) => {
    setSelectedSensors((prev) =>
      prev.includes(sensorId) ? prev.filter((id) => id !== sensorId) : [...prev, sensorId]
    );
  };

  // Formatera tid för X-axis
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange <= 24) {
      return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric', hour: '2-digit' });
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Jämför sensorer</h1>

      {/* Kontroller */}
      <Card padding="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-lg)', alignItems: 'flex-start' }}>
          {/* Sensorval */}
          <div style={{ flex: '1 1 400px' }}>
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                marginBottom: 'var(--spacing-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Välj sensorer att jämföra
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
              {availableSensors.map((sensor) => (
                <button
                  key={sensor.id}
                  onClick={() => toggleSensor(sensor.id)}
                  style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    border: `2px solid ${selectedSensors.includes(sensor.id) ? sensor.color : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedSensors.includes(sensor.id)
                      ? `${sensor.color}20`
                      : 'transparent',
                    color: selectedSensors.includes(sensor.id) ? sensor.color : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: selectedSensors.includes(sensor.id) ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {sensor.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tidsintervall */}
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                marginBottom: 'var(--spacing-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Tidsperiod
            </h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              {TIME_RANGES.map((range) => (
                <button
                  key={range.hours}
                  onClick={() => setTimeRange(range.hours)}
                  style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    border: `1px solid ${timeRange === range.hours ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: timeRange === range.hours ? 'var(--color-primary)' : 'transparent',
                    color: timeRange === range.hours ? 'white' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Normalisering */}
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                marginBottom: 'var(--spacing-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Visning
            </h3>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <input
                type="checkbox"
                checked={normalizeData}
                onChange={(e) => setNormalizeData(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Normalisera (0-100%)
            </label>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
              Gör det lättare att jämföra sensorer med olika skalor
            </p>
          </div>
        </div>
      </Card>

      {/* Graf */}
      <Card padding="lg">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
            Laddar sensordata...
          </div>
        ) : selectedSensors.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-2xl)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Välj minst en sensor för att visa graf
          </div>
        ) : chartData.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-2xl)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Ingen data tillgänglig för vald tidsperiod
          </div>
        ) : (
          <div style={{ width: '100%', height: '500px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxis}
                  stroke={colors.text.secondary}
                  style={{ fontSize: '12px' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke={colors.text.secondary}
                  style={{ fontSize: '12px' }}
                  label={
                    normalizeData
                      ? { value: '%', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }
                      : undefined
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 'var(--radius-md)',
                  }}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleString('sv-SE');
                  }}
                  formatter={(value: any, name: string) => {
                    const sensor = availableSensors.find((s) => s.id === name);
                    const unit = normalizeData ? '%' : sensor?.unit || '';
                    return [`${typeof value === 'number' ? value.toFixed(1) : value} ${unit}`, sensor?.name || name];
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const sensor = availableSensors.find((s) => s.id === value);
                    return sensor?.name || value;
                  }}
                />
                {selectedSensors.map((sensorId) => {
                  const sensor = availableSensors.find((s) => s.id === sensorId);
                  if (!sensor) return null;
                  return (
                    <Line
                      key={sensorId}
                      type="monotone"
                      dataKey={sensorId}
                      name={sensorId}
                      stroke={sensor.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Info om valda sensorer */}
      {selectedSensors.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 'var(--spacing-md)',
            marginTop: 'var(--spacing-lg)',
          }}
        >
          {selectedSensors.map((sensorId) => {
            const sensor = availableSensors.find((s) => s.id === sensorId);
            if (!sensor) return null;

            // Hitta senaste värdet
            const latestData = [...chartData].reverse().find((d) => d[sensorId] !== undefined);
            const latestValue = latestData?.[sensorId];

            return (
              <Card key={sensorId} padding="sm">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: sensor.color,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{sensor.name}</div>
                    {latestValue !== undefined && (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                        Senaste: {latestValue.toFixed(1)} {normalizeData ? '%' : sensor.unit}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
