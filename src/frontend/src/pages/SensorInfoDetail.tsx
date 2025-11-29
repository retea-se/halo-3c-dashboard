/**
 * Sensor Info Detail - Detaljsida per sensor med graf, FAQ, etc.
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { apiService } from '../services/api';
import { SensorGraph } from '../components/sensors/SensorGraph';
import { useTheme } from '../theme/ThemeProvider';

// Tidsintervall för historik
const TIME_RANGES = [
  { label: '1 timme', hours: 1 },
  { label: '6 timmar', hours: 6 },
  { label: '24 timmar', hours: 24 },
  { label: '7 dagar', hours: 168 },
  { label: '1 månad', hours: 720 },
  { label: '6 månader', hours: 4320 },
  { label: '12 månader', hours: 8640 },
];

const TimeRangeSelector: React.FC<{ onRangeChange: (hours: number) => void }> = ({ onRangeChange }) => {
  const [selectedRange, setSelectedRange] = useState(24);

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
      {TIME_RANGES.map((range) => (
        <button
          key={range.hours}
          onClick={() => {
            setSelectedRange(range.hours);
            onRangeChange(range.hours);
          }}
          style={{
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            border: `1px solid ${selectedRange === range.hours ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)',
            backgroundColor: selectedRange === range.hours ? 'var(--color-primary)' : 'transparent',
            color: selectedRange === range.hours ? 'white' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

interface SensorMetadata {
  id: string;
  technical_name: string;
  display_name: string;
  short_description: string;
  long_description: string;
  category: string;
  unit: string;
  icon: string;
  normal_range?: {
    min: number;
    max: number;
    description?: string;
  };
  warning_thresholds?: Array<{
    level: string;
    min?: number;
    max?: number;
    message: string;
  }>;
  graph_levels?: Array<{
    min: number;
    max?: number;
    label: string;
    color: string;
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  related_events?: string[];
}

export const SensorInfoDetail: React.FC = () => {
  const { sensorId } = useParams<{ sensorId: string }>();
  const [sensor, setSensor] = useState<SensorMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState(24);
  const { colors } = useTheme();

  useEffect(() => {
    const loadSensor = async () => {
      if (!sensorId) return;

      // Avkoda URL-encoded sensor ID
      const decodedSensorId = decodeURIComponent(sensorId);

      try {
        setLoading(true);
        const metadata = await apiService.getSensorMetadataById(decodedSensorId);
        setSensor(metadata);

        // Ladda historik och events
        // Anvand technical_name for historik-queryn om tillgangligt
        const historyId = metadata?.technical_name || decodedSensorId;
        const toTime = new Date().toISOString();
        const fromTime = new Date(Date.now() - timeRange * 60 * 60 * 1000).toISOString();

        const [history, eventsData] = await Promise.all([
          apiService.getSensorHistory(historyId, fromTime, toTime, 1000),
          apiService.getEvents({ from: fromTime, to: toTime }),
        ]);

        setHistoryData(history || []);
        setEvents(eventsData || []);
      } catch (error) {
        console.error('Failed to load sensor:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSensor();
  }, [sensorId, timeRange]);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1400px', margin: '0 auto' }}>
        <div>Laddar sensorinformation...</div>
      </div>
    );
  }

  if (!sensor) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1400px', margin: '0 auto' }}>
        <h1>Sensor hittades inte</h1>
        <p>Sensorn med ID "{sensorId}" kunde inte hittas.</p>
        <Link to="/sensors/info">← Tillbaka till sensoröversikt</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <Link
          to="/sensors/info"
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          ← Tillbaka till sensoröversikt
        </Link>
      </div>

      {/* Sensor Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
          <Icon name={sensor.icon || 'sensor-icon'} size={48} color={colors.text.primary} />
          <div>
            <h1 style={{ margin: 0, marginBottom: 'var(--spacing-xs)' }}>{sensor.display_name}</h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {sensor.category} • {sensor.technical_name}
            </p>
          </div>
        </div>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
          {sensor.long_description}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Vänster kolumn */}
        <div>
          {/* Normal Range */}
          {sensor.normal_range && (
            <Card padding="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                Normal intervall
              </h3>
              <div
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                {sensor.normal_range.min}–{sensor.normal_range.max} {sensor.unit}
              </div>
              {sensor.normal_range.description && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {sensor.normal_range.description}
                </p>
              )}
            </Card>
          )}

          {/* Warning Thresholds */}
          {sensor.warning_thresholds && sensor.warning_thresholds.length > 0 && (
            <Card padding="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                Varningstecken
              </h3>
              <ul style={{ margin: 0, paddingLeft: 'var(--spacing-md)' }}>
                {sensor.warning_thresholds.map((threshold, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    {threshold.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* FAQ */}
          {sensor.faq && sensor.faq.length > 0 && (
            <Card padding="md">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                Vanliga frågor
              </h3>
              {sensor.faq.map((faq, idx) => (
                <div key={idx} style={{ marginBottom: 'var(--spacing-md)' }}>
                  <h4
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      margin: 0,
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    {faq.question}
                  </h4>
                  <p
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                    }}
                  >
                    {faq.answer}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Höger kolumn - Graf */}
        <div>
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, margin: 0 }}>
                Historik
              </h3>
              <TimeRangeSelector onRangeChange={async (hours) => {
                setTimeRange(hours);
                const historyId = sensor?.technical_name || sensorId;
                const toTime = new Date().toISOString();
                const fromTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

                const [history, eventsData] = await Promise.all([
                  apiService.getSensorHistory(historyId, fromTime, toTime, 1000),
                  apiService.getEvents({ from: fromTime, to: toTime }),
                ]);

                setHistoryData(history || []);
                setEvents(eventsData || []);
              }} />
            </div>
            <SensorGraph
              sensorId={sensor.id}
              data={historyData}
              metadata={sensor}
              unit={sensor.unit}
              graphLevels={sensor.graph_levels}
              events={events}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};


