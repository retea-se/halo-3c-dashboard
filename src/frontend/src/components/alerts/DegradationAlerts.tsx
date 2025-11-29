/**
 * DegradationAlerts - Visar systemdegraderings-varningar
 * Övervakar sensorstatus, dataålder, heartbeat och systemhälsa
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../ui/Card';

interface HeartbeatStatus {
  status: string;
  last_contact: string | null;
  seconds_since_contact: number | null;
  error: string | null;
}

interface SystemHealth {
  backend: { status: string; message?: string };
  influxdb: { status: string; url?: string };
  sensor: { status: string; ip?: string; lastSeen?: string };
  collector: { status: string; message?: string };
  heartbeat?: HeartbeatStatus;
}

interface DegradationAlert {
  id: string;
  component: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: string;
}

interface DegradationAlertsProps {
  refreshInterval?: number; // ms, default 60000
  lastDataTimestamp?: string; // ISO timestamp för senaste data
}

// Kontrollera om timestamp är för gammalt
const isDataStale = (timestamp: string, maxAgeMinutes: number = 5): boolean => {
  const dataTime = new Date(timestamp).getTime();
  const now = Date.now();
  const ageMs = now - dataTime;
  return ageMs > maxAgeMinutes * 60 * 1000;
};

// Formatera hur gammal data är
const formatDataAge = (timestamp: string): string => {
  const dataTime = new Date(timestamp).getTime();
  const now = Date.now();
  const ageMs = now - dataTime;

  if (ageMs < 60000) return 'mindre än 1 minut';
  if (ageMs < 3600000) return `${Math.floor(ageMs / 60000)} minuter`;
  if (ageMs < 86400000) return `${Math.floor(ageMs / 3600000)} timmar`;
  return `${Math.floor(ageMs / 86400000)} dagar`;
};

export const DegradationAlerts: React.FC<DegradationAlertsProps> = ({
  refreshInterval = 60000,
  lastDataTimestamp,
}) => {
  const [alerts, setAlerts] = useState<DegradationAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const checkSystemHealth = useCallback(async () => {
    const newAlerts: DegradationAlert[] = [];
    const now = new Date().toISOString();

    try {
      // Hämta systemstatus från backend
      const response = await fetch('/api/system/status');

      if (!response.ok) {
        newAlerts.push({
          id: 'backend-error',
          component: 'Backend API',
          severity: 'critical',
          message: 'Kunde inte kontakta backend',
          details: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: now,
        });
      } else {
        const health: SystemHealth = await response.json();

        // Kontrollera InfluxDB (API returnerar lowercase)
        const influxStatus = health.influxdb?.status?.toLowerCase();
        if (influxStatus !== 'connected') {
          newAlerts.push({
            id: 'influxdb-disconnected',
            component: 'InfluxDB',
            severity: 'critical',
            message: 'Databasen är inte ansluten',
            details: 'Historisk data kan inte lagras eller hämtas',
            timestamp: now,
          });
        }

        // Kontrollera Halo-sensor (halo_sensor i API-svaret)
        const sensorData = (health as any).halo_sensor || health.sensor;
        const sensorStatus = sensorData?.status?.toLowerCase();
        if (sensorStatus === 'disconnected') {
          newAlerts.push({
            id: 'sensor-disconnected',
            component: 'Halo 3C Sensor',
            severity: 'critical',
            message: 'Sensorn svarar inte',
            details: `IP: ${sensorData?.ip || 'okänd'}`,
            timestamp: now,
          });
        } else if (sensorStatus === 'unknown') {
          newAlerts.push({
            id: 'sensor-unknown',
            component: 'Halo 3C Sensor',
            severity: 'warning',
            message: 'Sensorstatus okänd',
            details: 'Kontrollera sensoranslutningen',
            timestamp: now,
          });
        }

        // Kontrollera Collector
        const collectorStatus = health.collector?.status?.toLowerCase();
        if (collectorStatus === 'stopped' || collectorStatus === 'error') {
          newAlerts.push({
            id: 'collector-stopped',
            component: 'Datainsamlare',
            severity: 'warning',
            message: 'Datainsamlaren är stoppad',
            details: health.collector.message || 'Ingen ny data samlas in',
            timestamp: now,
          });
        }

        // Kontrollera Heartbeat
        const heartbeat = health.heartbeat;
        if (heartbeat) {
          const heartbeatStatus = heartbeat.status?.toLowerCase();
          if (heartbeatStatus === 'offline') {
            const secondsSince = heartbeat.seconds_since_contact;
            const timeStr = secondsSince
              ? secondsSince < 60
                ? `${secondsSince} sekunder`
                : secondsSince < 3600
                ? `${Math.floor(secondsSince / 60)} minuter`
                : `${Math.floor(secondsSince / 3600)} timmar`
              : 'okänd tid';
            newAlerts.push({
              id: 'heartbeat-offline',
              component: 'Halo Heartbeat',
              severity: 'critical',
              message: `Ingen kontakt med Halo-sensorn på ${timeStr}`,
              details: heartbeat.error || 'Kontrollera att sensorn är påslagen och nätverksansluten',
              timestamp: now,
            });
          } else if (heartbeatStatus === 'degraded') {
            newAlerts.push({
              id: 'heartbeat-degraded',
              component: 'Halo Heartbeat',
              severity: 'warning',
              message: 'Fördröjd kontakt med Halo-sensorn',
              details: 'Senaste kontakten var längre än förväntat',
              timestamp: now,
            });
          }
        }
      }
    } catch (error) {
      newAlerts.push({
        id: 'network-error',
        component: 'Nätverk',
        severity: 'critical',
        message: 'Nätverksfel - kunde inte kontrollera systemstatus',
        details: error instanceof Error ? error.message : 'Okänt fel',
        timestamp: now,
      });
    }

    // Kontrollera dataålder
    if (lastDataTimestamp) {
      if (isDataStale(lastDataTimestamp, 5)) {
        newAlerts.push({
          id: 'data-stale',
          component: 'Sensordata',
          severity: 'warning',
          message: `Senaste data är ${formatDataAge(lastDataTimestamp)} gammal`,
          details: 'Kontrollera att sensorn och datainsamlaren fungerar',
          timestamp: now,
        });
      }
    }

    setAlerts(newAlerts);
    setLoading(false);
  }, [lastDataTimestamp]);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [checkSystemHealth, refreshInterval]);

  // Visa ingenting om det laddar eller om det inte finns några alerts
  if (loading || alerts.length === 0) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', icon: '🔴' };
      case 'warning':
        return { bg: '#fffbeb', border: '#fcd34d', text: '#d97706', icon: '🟡' };
      default:
        return { bg: '#eff6ff', border: '#93c5fd', text: '#2563eb', icon: '🔵' };
    }
  };

  // Sortera efter severity (critical först)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  const hasCritical = alerts.some(a => a.severity === 'critical');
  const headerColor = hasCritical ? getSeverityColor('critical') : getSeverityColor('warning');

  return (
    <Card
      padding="md"
      style={{
        marginBottom: 'var(--spacing-lg)',
        backgroundColor: headerColor.bg,
        border: `2px solid ${headerColor.border}`,
      }}
    >
      <h3
        style={{
          fontSize: 'var(--font-size-md)',
          fontWeight: 600,
          marginBottom: 'var(--spacing-sm)',
          color: headerColor.text,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
        }}
      >
        <span style={{ fontSize: '1.2em' }}>{hasCritical ? '🚨' : '⚠️'}</span>
        Systemvarningar ({alerts.length})
      </h3>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {sortedAlerts.map((alert) => {
          const colors = getSeverityColor(alert.severity);
          return (
            <li
              key={alert.id}
              style={{
                padding: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-xs)',
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                <span>{colors.icon}</span>
                <strong style={{ color: colors.text }}>{alert.component}</strong>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                {alert.message}
              </div>
              {alert.details && (
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    marginTop: 'var(--spacing-xs)',
                  }}
                >
                  {alert.details}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default DegradationAlerts;
