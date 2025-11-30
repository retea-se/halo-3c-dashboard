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
  BarChart,
  Bar,
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

// Tröskelvärden för sensorer (för att detektera överskridanden)
const SENSOR_THRESHOLDS: Record<string, { warning: number; critical: number; direction: 'above' | 'below' }> = {
  'audsensor/sum': { warning: 55, critical: 70, direction: 'above' },
  'co2sensor/co2fo': { warning: 800, critical: 1200, direction: 'above' },
  'co2sensor/co2': { warning: 800, critical: 1200, direction: 'above' },
  'co2sensor/tvoc': { warning: 500, critical: 1000, direction: 'above' },
  'htsensor/ctemp': { warning: 26, critical: 30, direction: 'above' },
  'htsensor/humidity': { warning: 70, critical: 80, direction: 'above' },
  'pmsensor/pm2p5conc': { warning: 25, critical: 50, direction: 'above' },
  'pmsensor/pm10conc': { warning: 50, critical: 100, direction: 'above' },
  'gassensor/co': { warning: 9, critical: 35, direction: 'above' },
};

// Trendanalys-typer
interface TrendAnalysis {
  slope: number;
  intercept: number;
  startY: number;
  endY: number;
  percentChange: number;
  direction: 'up' | 'down' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
  description: string;
}

// Calculate linear regression for trendline with extended analysis
const calculateTrendline = (data: any[], sensorId: string): TrendAnalysis | null => {
  const validPoints = data.filter(d => d[sensorId] !== undefined).map((d, i) => ({
    x: i,
    y: d[sensorId] as number
  }));

  if (validPoints.length < 2) return null;

  const n = validPoints.length;
  const sumX = validPoints.reduce((sum, p) => sum + p.x, 0);
  const sumY = validPoints.reduce((sum, p) => sum + p.y, 0);
  const sumXY = validPoints.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = validPoints.reduce((sum, p) => sum + p.x * p.x, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-10) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const startY = intercept;
  const endY = slope * (n - 1) + intercept;

  // Beräkna procentuell förändring
  const avgY = sumY / n;
  const percentChange = avgY !== 0 ? ((endY - startY) / Math.abs(avgY)) * 100 : 0;

  // Bestäm trendriktning och styrka
  let direction: 'up' | 'down' | 'stable';
  let strength: 'strong' | 'moderate' | 'weak';

  const absPercentChange = Math.abs(percentChange);
  if (absPercentChange < 2) {
    direction = 'stable';
    strength = 'weak';
  } else if (percentChange > 0) {
    direction = 'up';
    strength = absPercentChange > 15 ? 'strong' : absPercentChange > 5 ? 'moderate' : 'weak';
  } else {
    direction = 'down';
    strength = absPercentChange > 15 ? 'strong' : absPercentChange > 5 ? 'moderate' : 'weak';
  }

  // Skapa beskrivning
  let description: string;
  if (direction === 'stable') {
    description = 'Stabil';
  } else {
    const dirText = direction === 'up' ? 'Uppgående' : 'Nedgående';
    const strengthText = strength === 'strong' ? 'stark' : strength === 'moderate' ? 'måttlig' : 'svag';
    description = `${dirText} (${strengthText}, ${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%)`;
  }

  return {
    slope,
    intercept,
    startY,
    endY,
    percentChange,
    direction,
    strength,
    description
  };
};

// Analysera ljudnivåtrend för varning
interface SoundTrendWarning {
  isWarning: boolean;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  avgIncrease: number;
}

const analyzeSoundTrend = (data: any[], _timeRangeHours: number): SoundTrendWarning | null => {
  const soundValues = data
    .filter(d => d['audsensor/sum'] !== undefined)
    .map(d => d['audsensor/sum'] as number);

  if (soundValues.length < 10) return null;

  // Dela upp i början och slut för att jämföra
  const firstQuarter = soundValues.slice(0, Math.floor(soundValues.length / 4));
  const lastQuarter = soundValues.slice(-Math.floor(soundValues.length / 4));

  const avgFirst = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
  const avgLast = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
  const avgIncrease = avgLast - avgFirst;

  // Kontrollera om det finns en ihållande ökning
  if (avgIncrease > 5 && avgLast > 50) {
    return {
      isWarning: true,
      message: `Ljudnivån har ökat med ${avgIncrease.toFixed(1)} dB under perioden`,
      severity: avgLast > 65 ? 'critical' : avgIncrease > 10 ? 'warning' : 'info',
      avgIncrease
    };
  }

  return null;
};

// Hitta tröskelöverskridanden i data
interface ThresholdEvent {
  timestamp: string;
  sensorId: string;
  sensorName: string;
  value: number;
  threshold: number;
  type: 'exceeded' | 'returned';
  severity: 'warning' | 'critical';
}

const findThresholdEvents = (
  data: any[],
  selectedSensors: string[],
  sensorConfigs: Array<{ id: string; name: string; unit: string; color: string }>
): ThresholdEvent[] => {
  const events: ThresholdEvent[] = [];

  selectedSensors.forEach(sensorId => {
    const thresholds = SENSOR_THRESHOLDS[sensorId];
    if (!thresholds) return;

    const sensorConfig = sensorConfigs.find(s => s.id === sensorId);
    if (!sensorConfig) return;

    let wasExceeded = false;
    let lastExceededLevel: 'warning' | 'critical' | null = null;

    data.forEach((point) => {
      const value = point[sensorId];
      if (value === undefined) return;

      const exceedsCritical = thresholds.direction === 'above'
        ? value >= thresholds.critical
        : value <= thresholds.critical;
      const exceedsWarning = thresholds.direction === 'above'
        ? value >= thresholds.warning
        : value <= thresholds.warning;

      if (exceedsCritical && lastExceededLevel !== 'critical') {
        events.push({
          timestamp: point.timestamp,
          sensorId,
          sensorName: sensorConfig.name,
          value,
          threshold: thresholds.critical,
          type: 'exceeded',
          severity: 'critical'
        });
        wasExceeded = true;
        lastExceededLevel = 'critical';
      } else if (exceedsWarning && !exceedsCritical && lastExceededLevel !== 'warning' && lastExceededLevel !== 'critical') {
        events.push({
          timestamp: point.timestamp,
          sensorId,
          sensorName: sensorConfig.name,
          value,
          threshold: thresholds.warning,
          type: 'exceeded',
          severity: 'warning'
        });
        wasExceeded = true;
        lastExceededLevel = 'warning';
      } else if (!exceedsWarning && wasExceeded) {
        events.push({
          timestamp: point.timestamp,
          sensorId,
          sensorName: sensorConfig.name,
          value,
          threshold: thresholds.warning,
          type: 'returned',
          severity: 'warning'
        });
        wasExceeded = false;
        lastExceededLevel = null;
      }
    });
  });

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const SensorCompare: React.FC = () => {
  const { colors } = useTheme();
  const [selectedSensors, setSelectedSensors] = useState<string[]>(['htsensor/ctemp', 'htsensor/humidity']);
  const [timeRange, setTimeRange] = useState(24);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [normalizeData, setNormalizeData] = useState(false);
  const [showTrendline, setShowTrendline] = useState(false);
  const [trendlines, setTrendlines] = useState<Record<string, TrendAnalysis>>({});
  const [showEventChart, setShowEventChart] = useState(false);
  const [eventData, setEventData] = useState<any[]>([]);
  const [availableSensors, setAvailableSensors] = useState<Array<{ id: string; name: string; unit: string; color: string }>>(FALLBACK_SENSORS);
  const [soundWarning, setSoundWarning] = useState<SoundTrendWarning | null>(null);
  const [thresholdEvents, setThresholdEvents] = useState<ThresholdEvent[]>([]);
  const [showThresholdTimeline, setShowThresholdTimeline] = useState(false);

  // Hämta tillgängliga sensorer från senaste sensorvärden
  useEffect(() => {
    const loadAvailableSensors = async () => {
      try {
        const response = await apiService.getLatestSensors();
        const sensors = response.sensors || [];

        // Filtrera live-sensorer som har giltig data
        const liveSensorIds = new Set(
          sensors
            .filter((s: any) => {
              const value = Object.values(s.values || {})[0];
              return value !== undefined && value !== null && typeof value === 'number' && value < 1000000000000;
            })
            .map((s: any) => s.sensor_id)
        );

        // Ta bara med fallback-sensorer som faktiskt har data
        // Plus eventuella live-sensorer som inte finns i fallback
        const activeSensors = new Map<string, { id: string; name: string; unit: string; color: string }>();

        // Lägg till fallback-sensorer som har aktiv data
        FALLBACK_SENSORS.forEach((sensor) => {
          if (liveSensorIds.has(sensor.id)) {
            activeSensors.set(sensor.id, sensor);
          }
        });

        // Vi visar ENDAST sensorer från FALLBACK_SENSORS som har aktiv data
        // Detta undviker att visa hundratals råa sensorer från API:et

        // Konvertera Map till array och sortera alfabetiskt
        const uniqueSensors = Array.from(activeSensors.values()).sort((a, b) =>
          a.name.localeCompare(b.name, 'sv')
        );

        setAvailableSensors(uniqueSensors.length > 0 ? uniqueSensors : FALLBACK_SENSORS);
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

      // Calculate trendlines for each sensor
      const newTrendlines: Record<string, TrendAnalysis> = {};
      selectedSensors.forEach(sensorId => {
        const trend = calculateTrendline(combinedData, sensorId);
        if (trend) {
          newTrendlines[sensorId] = trend;

          // Add trendline data points to combinedData if showTrendline is enabled
          if (showTrendline) {
            const trendlineKey = `${sensorId}_trend`;
            combinedData.forEach((point, i) => {
              point[trendlineKey] = trend.intercept + trend.slope * i;
            });
          }
        }
      });
      setTrendlines(newTrendlines);

      // Analysera ljudnivåtrend
      if (selectedSensors.includes('audsensor/sum')) {
        const warning = analyzeSoundTrend(combinedData, timeRange);
        setSoundWarning(warning);
      } else {
        setSoundWarning(null);
      }

      // Hitta tröskelöverskridanden
      const events = findThresholdEvents(combinedData, selectedSensors, availableSensors);
      setThresholdEvents(events);

      setChartData(combinedData);
    } catch (error) {
      console.error('Failed to load sensor data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSensors, timeRange, normalizeData, showTrendline]);

  // Load event data for activity chart
  useEffect(() => {
    const loadEventData = async () => {
      if (!showEventChart) return;

      try {
        const toTime = new Date().toISOString();
        const fromTime = new Date(Date.now() - timeRange * 60 * 60 * 1000).toISOString();
        const events = await apiService.getEvents({ from: fromTime, to: toTime });

        // Aggregate events by hour/day depending on time range
        const bucketSize = timeRange <= 24 ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 hour or 1 day
        const buckets = new Map<string, { timestamp: string; occupancy: number; vibration: number; total: number }>();

        events.forEach((event: any) => {
          const eventTime = new Date(event.timestamp).getTime();
          const bucketTime = new Date(Math.floor(eventTime / bucketSize) * bucketSize);
          const bucketKey = bucketTime.toISOString();

          if (!buckets.has(bucketKey)) {
            buckets.set(bucketKey, { timestamp: bucketKey, occupancy: 0, vibration: 0, total: 0 });
          }

          const bucket = buckets.get(bucketKey)!;
          bucket.total++;

          // Categorize events
          const eventType = (event.type || '').toLowerCase();
          if (eventType.includes('occupancy') || eventType.includes('presence') || eventType.includes('beacon')) {
            bucket.occupancy++;
          } else if (eventType.includes('vibration') || eventType.includes('tamper') || eventType.includes('movement')) {
            bucket.vibration++;
          }
        });

        const sortedData = Array.from(buckets.values())
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        setEventData(sortedData);
      } catch (error) {
        console.error('Failed to load event data:', error);
      }
    };

    loadEventData();
  }, [showEventChart, timeRange]);

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
    <div style={{ padding: 'var(--spacing-md)', maxWidth: '1600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-xl)' }}>Grafer</h1>

      {/* Kontroller */}
      <Card padding="md" style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {/* Sensorval */}
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                marginBottom: 'var(--spacing-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Sensorer
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {availableSensors.map((sensor) => (
                <button
                  key={sensor.id}
                  onClick={() => toggleSensor(sensor.id)}
                  style={{
                    padding: '4px 8px',
                    border: `2px solid ${selectedSensors.includes(sensor.id) ? sensor.color : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedSensors.includes(sensor.id)
                      ? `${sensor.color}20`
                      : 'transparent',
                    color: selectedSensors.includes(sensor.id) ? sensor.color : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: selectedSensors.includes(sensor.id) ? 600 : 400,
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sensor.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tidsintervall och normalisering i rad */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
            {/* Tidsintervall */}
            <div style={{ flex: '1 1 auto' }}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.hours}
                    onClick={() => setTimeRange(range.hours)}
                    style={{
                      padding: '4px 8px',
                      border: `1px solid ${timeRange === range.hours ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: timeRange === range.hours ? 'var(--color-primary)' : 'transparent',
                      color: timeRange === range.hours ? 'white' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-xs)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visningsalternativ */}
            <div style={{ flex: '0 0 auto' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
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
                    checked={showTrendline}
                    onChange={(e) => setShowTrendline(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  Visa trendlinje
                </label>
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
                    checked={showEventChart}
                    onChange={(e) => setShowEventChart(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  Visa aktivitetshistorik
                </label>
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
                    checked={showThresholdTimeline}
                    onChange={(e) => setShowThresholdTimeline(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  Visa tröskel-händelser
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ljudvarning */}
      {soundWarning && soundWarning.isWarning && (
        <Card padding="md" style={{
          marginBottom: 'var(--spacing-md)',
          backgroundColor: soundWarning.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' :
                          soundWarning.severity === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                          'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${soundWarning.severity === 'critical' ? '#ef4444' :
                               soundWarning.severity === 'warning' ? '#f59e0b' : '#3b82f6'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span style={{ fontSize: '20px' }}>
              {soundWarning.severity === 'critical' ? '!!' : soundWarning.severity === 'warning' ? '!' : 'i'}
            </span>
            <div>
              <div style={{
                fontWeight: 600,
                color: soundWarning.severity === 'critical' ? '#ef4444' :
                       soundWarning.severity === 'warning' ? '#f59e0b' : '#3b82f6'
              }}>
                {soundWarning.severity === 'critical' ? 'Kritisk ljudvarning' :
                 soundWarning.severity === 'warning' ? 'Ljudvarning' : 'Ljudobservation'}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {soundWarning.message}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Graf */}
      <Card padding="sm">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            Laddar sensordata...
          </div>
        ) : selectedSensors.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-xl)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Välj minst en sensor
          </div>
        ) : chartData.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-xl)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Ingen data för vald tidsperiod
          </div>
        ) : (
          <div style={{ width: '100%', height: 'min(500px, 60vh)' }}>
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
                      : selectedSensors.length === 1
                        ? {
                            value: availableSensors.find(s => s.id === selectedSensors[0])?.unit || '',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize: '12px' }
                          }
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
                {/* Trendlines */}
                {showTrendline && selectedSensors.map((sensorId) => {
                  const sensor = availableSensors.find((s) => s.id === sensorId);
                  const trendData = trendlines[sensorId];
                  if (!sensor || !trendData || chartData.length < 2) return null;

                  // Create trendline data points (start and end)
                  const trendlineKey = `${sensorId}_trend`;
                  return (
                    <Line
                      key={trendlineKey}
                      type="linear"
                      dataKey={trendlineKey}
                      name={`${sensor.name} (trend)`}
                      stroke={sensor.color}
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      dot={false}
                      legendType="none"
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Aktivitetshistorik (events) */}
      {showEventChart && (
        <Card padding="sm" style={{ marginTop: 'var(--spacing-md)' }}>
          <h3 style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            Aktivitetshistorik (händelser per {timeRange <= 24 ? 'timme' : 'dag'})
          </h3>
          {eventData.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
              color: 'var(--color-text-secondary)'
            }}>
              Inga händelser under vald period
            </div>
          ) : (
            <div style={{ width: '100%', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventData} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatXAxis}
                    stroke={colors.text.secondary}
                    style={{ fontSize: '11px' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke={colors.text.secondary}
                    style={{ fontSize: '11px' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                    }}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleString('sv-SE');
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="occupancy"
                    name="Närvaro/besök"
                    fill="#22c55e"
                    stackId="a"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="vibration"
                    name="Vibrationer/rörelse"
                    fill="#f59e0b"
                    stackId="a"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="total"
                    name="Totalt händelser"
                    fill="#6366f1"
                    opacity={0.3}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {/* Tröskel-händelsetidslinje */}
      {showThresholdTimeline && (
        <Card padding="sm" style={{ marginTop: 'var(--spacing-md)' }}>
          <h3 style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            Tröskel-händelser (när värden överskrider gränsvärden)
          </h3>
          {thresholdEvents.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
              color: 'var(--color-text-secondary)'
            }}>
              Inga tröskelöverskridanden under vald period
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {/* Tidslinje */}
              <div style={{
                position: 'relative',
                minHeight: '80px',
                padding: 'var(--spacing-md) 0',
              }}>
                {/* Tidslinjelinje */}
                <div style={{
                  position: 'absolute',
                  left: '0',
                  right: '0',
                  top: '50%',
                  height: '2px',
                  backgroundColor: 'var(--color-border)',
                }} />

                {/* Händelser */}
                <div style={{
                  display: 'flex',
                  gap: 'var(--spacing-xs)',
                  flexWrap: 'wrap',
                  position: 'relative',
                }}>
                  {thresholdEvents.slice(0, 20).map((event, idx) => {
                    const sensorConfig = availableSensors.find(s => s.id === event.sensorId);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: 'var(--spacing-xs)',
                          backgroundColor: event.type === 'exceeded'
                            ? (event.severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)')
                            : 'rgba(34, 197, 94, 0.15)',
                          border: `1px solid ${event.type === 'exceeded'
                            ? (event.severity === 'critical' ? '#ef4444' : '#f59e0b')
                            : '#22c55e'}`,
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--font-size-xs)',
                          minWidth: '100px',
                        }}
                        title={`${event.sensorName}: ${event.value.toFixed(1)} (tröskel: ${event.threshold})`}
                      >
                        <div style={{
                          fontWeight: 600,
                          color: event.type === 'exceeded'
                            ? (event.severity === 'critical' ? '#ef4444' : '#f59e0b')
                            : '#22c55e',
                        }}>
                          {event.type === 'exceeded'
                            ? (event.severity === 'critical' ? 'KRITISK' : 'VARNING')
                            : 'OK'}
                        </div>
                        <div style={{
                          color: sensorConfig?.color || 'var(--color-text-secondary)',
                          fontWeight: 500,
                        }}>
                          {event.sensorName}
                        </div>
                        <div style={{ color: 'var(--color-text-tertiary)' }}>
                          {new Date(event.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                  {thresholdEvents.length > 20 && (
                    <div style={{
                      padding: 'var(--spacing-sm)',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-xs)',
                    }}>
                      +{thresholdEvents.length - 20} fler...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Info om valda sensorer med trendindikator */}
      {selectedSensors.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
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
            const trend = trendlines[sensorId];

            // Trendpil och färg
            const getTrendArrow = () => {
              if (!trend) return null;
              if (trend.direction === 'up') {
                return { arrow: '\u2191', color: trend.strength === 'strong' ? '#ef4444' : trend.strength === 'moderate' ? '#f59e0b' : '#6b7280' };
              } else if (trend.direction === 'down') {
                return { arrow: '\u2193', color: trend.strength === 'strong' ? '#22c55e' : trend.strength === 'moderate' ? '#3b82f6' : '#6b7280' };
              }
              return { arrow: '\u2194', color: '#6b7280' };
            };
            const trendArrow = getTrendArrow();

            return (
              <Card key={sensorId} padding="sm">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: sensor.color,
                      marginTop: '4px',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{sensor.name}</span>
                      {trendArrow && (
                        <span style={{
                          fontSize: 'var(--font-size-lg)',
                          fontWeight: 700,
                          color: trendArrow.color,
                          lineHeight: 1,
                        }}>
                          {trendArrow.arrow}
                        </span>
                      )}
                    </div>
                    {latestValue !== undefined && (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                        Senaste: {latestValue.toFixed(1)} {normalizeData ? '%' : sensor.unit}
                      </div>
                    )}
                    {trend && (
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: trend.direction === 'up'
                          ? (trend.strength === 'strong' ? '#ef4444' : trend.strength === 'moderate' ? '#f59e0b' : 'var(--color-text-tertiary)')
                          : trend.direction === 'down'
                          ? (trend.strength === 'strong' ? '#22c55e' : trend.strength === 'moderate' ? '#3b82f6' : 'var(--color-text-tertiary)')
                          : 'var(--color-text-tertiary)',
                        marginTop: '2px',
                      }}>
                        {trend.description}
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
