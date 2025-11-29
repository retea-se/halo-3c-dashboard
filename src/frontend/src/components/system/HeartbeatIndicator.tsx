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

  useEffect(() => {
    fetchHeartbeat();
    const interval = setInterval(fetchHeartbeat, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchHeartbeat, refreshInterval]);

  if (loading) return null;

  const status = heartbeat?.status || 'unknown';
  const colors = getStatusColor(status);

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '9999px',
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          fontSize: 'var(--font-size-xs)',
        }}
        title={`Halo Heartbeat: ${getStatusLabel(status)}${heartbeat?.seconds_since_contact ? ` (${formatTimeSince(heartbeat.seconds_since_contact)})` : ''}`}
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

export default HeartbeatIndicator;
