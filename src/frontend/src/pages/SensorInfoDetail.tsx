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
  const { colors } = useTheme();

  useEffect(() => {
    const loadSensor = async () => {
      if (!sensorId) return;

      try {
        setLoading(true);
        const metadata = await apiService.getSensorMetadataById(sensorId);
        setSensor(metadata);

        // Ladda historik (senaste 24 timmarna)
        const toTime = new Date().toISOString();
        const fromTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const history = await apiService.getSensorHistory(sensorId, fromTime, toTime, 500);
        setHistoryData(history || []);
      } catch (error) {
        console.error('Failed to load sensor:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSensor();
  }, [sensorId]);

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
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              Historik (24 timmar)
            </h3>
            <SensorGraph
              sensorId={sensor.id}
              data={historyData}
              metadata={sensor}
              unit={sensor.unit}
              graphLevels={sensor.graph_levels}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};


