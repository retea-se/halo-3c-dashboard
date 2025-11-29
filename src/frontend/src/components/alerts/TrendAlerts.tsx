/**
 * TrendAlerts - Visar mjuka larm för avvikande sensorvärden och trender
 */
import React from 'react';
import { Card } from '../ui/Card';

interface SensorData {
  sensor_id: string;
  values: Record<string, number>;
  trend?: 'up' | 'down' | 'stable';
  metadata?: {
    display_name?: string;
    unit?: string;
    normal_range?: { min: number; max: number };
  };
}

interface TrendAlert {
  sensorId: string;
  sensorName: string;
  alertType: 'high' | 'low' | 'rising' | 'falling';
  value: number;
  unit: string;
  message: string;
  severity: 'warning' | 'info';
}

interface TrendAlertsProps {
  sensors: SensorData[];
}

// Analysera sensorer och generera alerts
const analyzeAlerts = (sensors: SensorData[]): TrendAlert[] => {
  const alerts: TrendAlert[] = [];

  sensors.forEach((sensor) => {
    const value = Object.values(sensor.values)[0];
    if (value === undefined || value === null) return;

    const name = sensor.metadata?.display_name || sensor.sensor_id;
    const unit = sensor.metadata?.unit || '';
    const range = sensor.metadata?.normal_range;

    // Kontrollera om värdet är utanför normalt intervall
    if (range) {
      if (value > range.max) {
        const percentOver = ((value - range.max) / range.max * 100).toFixed(0);
        alerts.push({
          sensorId: sensor.sensor_id,
          sensorName: name,
          alertType: 'high',
          value,
          unit,
          message: `${name} är ${percentOver}% över normalvärdet (${value.toFixed(1)} ${unit}, normal: ${range.min}-${range.max})`,
          severity: value > range.max * 1.5 ? 'warning' : 'info',
        });
      } else if (value < range.min) {
        const percentUnder = ((range.min - value) / range.min * 100).toFixed(0);
        alerts.push({
          sensorId: sensor.sensor_id,
          sensorName: name,
          alertType: 'low',
          value,
          unit,
          message: `${name} är ${percentUnder}% under normalvärdet (${value.toFixed(1)} ${unit}, normal: ${range.min}-${range.max})`,
          severity: value < range.min * 0.5 ? 'warning' : 'info',
        });
      }
    }

    // Kontrollera snabba trendförändringar
    if (sensor.trend === 'up') {
      // Specifika varningar för kritiska sensorer med stigande trend
      if (sensor.sensor_id.includes('co2') && value > 800) {
        alerts.push({
          sensorId: sensor.sensor_id,
          sensorName: name,
          alertType: 'rising',
          value,
          unit,
          message: `${name} stiger - överväg att vädra (${value.toFixed(0)} ${unit})`,
          severity: 'info',
        });
      }
    }
  });

  return alerts;
};

export const TrendAlerts: React.FC<TrendAlertsProps> = ({ sensors }) => {
  const alerts = analyzeAlerts(sensors);

  if (alerts.length === 0) return null;

  return (
    <Card
      padding="md"
      style={{
        marginBottom: 'var(--spacing-lg)',
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-warning)',
      }}
    >
      <h3
        style={{
          fontSize: 'var(--font-size-md)',
          fontWeight: 600,
          marginBottom: 'var(--spacing-sm)',
          color: 'var(--color-warning)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
        }}
      >
        <span style={{ fontSize: '1.2em' }}>⚠</span>
        Observationer ({alerts.length})
      </h3>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {alerts.map((alert, idx) => (
          <li
            key={`${alert.sensorId}-${idx}`}
            style={{
              padding: 'var(--spacing-xs) 0',
              borderBottom: idx < alerts.length - 1 ? '1px solid var(--color-border)' : 'none',
              fontSize: 'var(--font-size-sm)',
              color: alert.severity === 'warning' ? 'var(--color-warning)' : 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
            }}
          >
            <span>
              {alert.alertType === 'high' && '↑'}
              {alert.alertType === 'low' && '↓'}
              {alert.alertType === 'rising' && '📈'}
              {alert.alertType === 'falling' && '📉'}
            </span>
            {alert.message}
          </li>
        ))}
      </ul>
    </Card>
  );
};
