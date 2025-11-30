/**
 * HeartbeatIndicator - Visar Halo sensor heartbeat-status
 * Indikerar när vi senast hade kontakt med Halo-enheten
 */
import React, { useEffect, useState, useCallback } from 'react';

interface HeartbeatStatus {
  status: 'healthy' | 'degraded' | 'offline' | 'unknown';
  last_contact: string | null;
  seconds_since_contact: number | null;
  error: string | null;
}

interface SystemStatus {
  backend: string;
  influxdb: {
    status: string;
    url?: string;
    bucket?: string;
    error?: string;
  };
  halo_sensor: {
    status: string;
    ip?: string;
    error?: string;
  };
  heartbeat: HeartbeatStatus;
  collector: {
    status: string;
    note?: string;
  };
  timestamp: string;
}

interface HeartbeatIndicatorProps {
  refreshInterval?: number; // ms, default 10000
  showDetails?: boolean;
  compact?: boolean;
}

const formatTimeSince = (seconds: number | null): string => {
  if (seconds === null) return 'Okänd';
  if (seconds < 60) return `${seconds}s sedan`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m sedan`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h sedan`;
  return `${Math.floor(seconds / 86400)}d sedan`;
};

const getStatusColor = (status: string): { bg: string; border: string; text: string; pulse: boolean } => {
  switch (status) {
    case 'healthy':
      return { bg: '#dcfce7', border: '#22c55e', text: '#166534', pulse: true };
    case 'degraded':
      return { bg: '#fef9c3', border: '#eab308', text: '#854d0e', pulse: true };
    case 'offline':
      return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', pulse: false };
    default:
      return { bg: '#f3f4f6', border: '#9ca3af', text: '#4b5563', pulse: false };
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'healthy':
      return 'Online';
    case 'degraded':
      return 'Fördröjd';
    case 'offline':
      return 'Offline';
    default:
      return 'Okänd';
  }
};

export const HeartbeatIndicator: React.FC<HeartbeatIndicatorProps> = ({
  refreshInterval = 10000,
  showDetails = false,
  compact = false,
}) => {
  const [heartbeat, setHeartbeat] = useState<HeartbeatStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loadingSystemStatus, setLoadingSystemStatus] = useState(false);
  const popupRef = React.useRef<HTMLDivElement>(null);

  const fetchHeartbeat = useCallback(async () => {
    try {
      const response = await fetch('/api/system/heartbeat');
      if (response.ok) {
        const data = await response.json();
        setHeartbeat(data);
      } else {
        setHeartbeat({
          status: 'unknown',
          last_contact: null,
          seconds_since_contact: null,
          error: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      setHeartbeat({
        status: 'offline',
        last_contact: null,
        seconds_since_contact: null,
        error: error instanceof Error ? error.message : 'Nätverksfel',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSystemStatus = useCallback(async () => {
    setLoadingSystemStatus(true);
    try {
      const response = await fetch('/api/system/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoadingSystemStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchHeartbeat();
    const interval = setInterval(fetchHeartbeat, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchHeartbeat, refreshInterval]);

  // Hämta systemstatus när popup öppnas
  useEffect(() => {
    if (showPopup) {
      fetchSystemStatus();
    }
  }, [showPopup, fetchSystemStatus]);

  // Stäng popup vid klick utanför
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  if (loading) return null;

  const status = heartbeat?.status || 'unknown';
  const colors = getStatusColor(status);

  if (compact) {
    return (
      <div ref={popupRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowPopup(!showPopup)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '9999px',
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title={`Klicka för systemstatus`}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: colors.border,
              animation: colors.pulse ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span style={{ color: colors.text, fontWeight: 500 }}>
            {getStatusLabel(status)}
          </span>
        </button>

        {/* Popup */}
        {showPopup && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: '280px',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Systemstatus
              </span>
              <button
                onClick={() => setShowPopup(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--color-text-secondary)',
                  fontSize: '16px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 'var(--spacing-sm)' }}>
              {loadingSystemStatus ? (
                <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Laddar...
                </div>
              ) : systemStatus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <StatusRow
                    label="Halo Sensor"
                    status={systemStatus.halo_sensor.status}
                    detail={systemStatus.halo_sensor.ip}
                  />
                  <StatusRow
                    label="InfluxDB"
                    status={systemStatus.influxdb.status}
                    detail={systemStatus.influxdb.bucket}
                  />
                  <StatusRow
                    label="Backend"
                    status={systemStatus.backend}
                  />
                  <StatusRow
                    label="Collector"
                    status={systemStatus.collector.status}
                  />
                </div>
              ) : (
                <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Kunde inte hämta status
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {heartbeat?.seconds_since_contact !== null && heartbeat?.seconds_since_contact !== undefined && (
                <div>Senaste kontakt: {formatTimeSince(heartbeat.seconds_since_contact)}</div>
              )}
              {systemStatus?.timestamp && (
                <div>Uppdaterad: {new Date(systemStatus.timestamp).toLocaleTimeString('sv-SE')}</div>
              )}
            </div>
          </div>
        )}

        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: colors.border,
          animation: colors.pulse ? 'pulse 2s infinite' : 'none',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-sm)',
          }}
        >
          <span style={{ fontWeight: 600, color: colors.text }}>
            Halo Heartbeat
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: colors.text,
              backgroundColor: 'rgba(255,255,255,0.5)',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            {getStatusLabel(status)}
          </span>
        </div>
        {showDetails && heartbeat && heartbeat.seconds_since_contact !== null && (
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              marginTop: '2px',
            }}
          >
            Senaste kontakt: {formatTimeSince(heartbeat.seconds_since_contact)}
          </div>
        )}
        {showDetails && heartbeat?.error && status !== 'healthy' && (
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: colors.text,
              marginTop: '2px',
            }}
          >
            Fel: {heartbeat.error}
          </div>
        )}
      </div>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

// Hjälpkomponent för att visa status-rad i popup
interface StatusRowProps {
  label: string;
  status: string;
  detail?: string;
}

const StatusRow: React.FC<StatusRowProps> = ({ label, status, detail }) => {
  const getStatusColor = (s: string): string => {
    const normalized = s.toLowerCase();
    if (normalized === 'connected' || normalized === 'healthy' || normalized === 'running') {
      return '#22c55e'; // grön
    }
    if (normalized === 'degraded' || normalized === 'warning') {
      return '#f59e0b'; // gul
    }
    if (normalized === 'error' || normalized === 'offline' || normalized === 'disconnected') {
      return '#ef4444'; // röd
    }
    return '#9ca3af'; // grå för unknown
  };

  const getStatusLabel = (s: string): string => {
    const labels: Record<string, string> = {
      'connected': 'Ansluten',
      'disconnected': 'Frånkopplad',
      'healthy': 'OK',
      'degraded': 'Fördröjd',
      'offline': 'Offline',
      'error': 'Fel',
      'running': 'Kör',
      'unknown': 'Okänd',
      'not_configured': 'Ej konfigurerad',
    };
    return labels[s.toLowerCase()] || s;
  };

  const color = getStatusColor(status);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ color, fontWeight: 500 }}>
          {getStatusLabel(status)}
        </span>
        {detail && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            {detail}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeartbeatIndicator;
