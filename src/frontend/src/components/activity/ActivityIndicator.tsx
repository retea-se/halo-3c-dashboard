/**
 * ActivityIndicator - Visar rörelse/aktivitetsindikering baserat på ljudnivå
 *
 * Halo 3C har flera rörelsedetektorer:
 * - PIR-sensor (pir/max) - passiv infraröd rörelsedetektor
 * - Accelerometer (accsensor/move) - vibrationsdetektor
 *
 * Denna komponent använder ljudnivå som kompletterande indikator för aktivitet,
 * vilket ger en mer nyanserad bild av rumsaktivitet än enbart binär rörelsedetektering.
 *
 * Ljudnivåer:
 * - < 40 dB: Tyst (ingen aktivitet)
 * - 40-55 dB: Låg aktivitet (bakgrundsljud)
 * - 55-65 dB: Normal aktivitet (samtal, rörelse)
 * - > 65 dB: Hög aktivitet
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { apiService } from '../../services/api';

interface ActivityLevel {
  level: 'none' | 'low' | 'medium' | 'high';
  soundLevel: number;
  description: string;
  color: string;
  icon: string;
}

interface ActivityIndicatorProps {
  refreshInterval?: number;
  showHistory?: boolean;
  compact?: boolean;
}

// SVG-ikoner för aktivitetsnivåer
const ActivityIcons = {
  none: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" />
    </svg>
  ),
  low: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="8" opacity="0.3" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  medium: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" opacity="0.3" />
      <circle cx="12" cy="12" r="6" opacity="0.5" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  high: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="11" opacity="0.2" />
      <circle cx="12" cy="12" r="8" opacity="0.4" />
      <circle cx="12" cy="12" r="5" opacity="0.6" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

const getActivityLevel = (soundDb: number): ActivityLevel => {
  if (soundDb < 40) {
    return {
      level: 'none',
      soundLevel: soundDb,
      description: 'Ingen aktivitet',
      color: '#9ca3af',
      icon: 'none',
    };
  }
  if (soundDb < 55) {
    return {
      level: 'low',
      soundLevel: soundDb,
      description: 'Lag aktivitet',
      color: '#22c55e',
      icon: 'low',
    };
  }
  if (soundDb < 65) {
    return {
      level: 'medium',
      soundLevel: soundDb,
      description: 'Normal aktivitet',
      color: '#f59e0b',
      icon: 'medium',
    };
  }
  return {
    level: 'high',
    soundLevel: soundDb,
    description: 'Hog aktivitet',
    color: '#ef4444',
    icon: 'high',
  };
};

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  refreshInterval = 10000,
  showHistory = false,
  compact = false,
}) => {
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [activityHistory, setActivityHistory] = useState<ActivityLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const response = await apiService.getLatestSensors();
      const sensors = response?.sensors || [];

      // Hitta ljudsensor (audsensor/sum)
      const soundSensor = sensors.find(
        (s: any) => s.sensor_id === 'audsensor/sum'
      );

      if (soundSensor) {
        const soundValue = Object.values(soundSensor.values)[0] as number;
        const newActivity = getActivityLevel(soundValue);
        setActivity(newActivity);

        // Uppdatera historik (behåll senaste 12 värden = 2 minuter vid 10s intervall)
        setActivityHistory((prev) => {
          const updated = [...prev, newActivity].slice(-12);
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchActivity, refreshInterval]);

  if (loading || !activity) {
    return null;
  }

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          backgroundColor: `${activity.color}15`,
          border: `1px solid ${activity.color}`,
        }}
        title={`Aktivitet: ${activity.description} (${activity.soundLevel.toFixed(0)} dB)`}
      >
        <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', color: activity.color }}>
          {ActivityIcons[activity.icon as keyof typeof ActivityIcons]}
        </span>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
            color: activity.color,
          }}
        >
          {activity.level === 'none' ? 'Tyst' : activity.description}
        </span>
      </div>
    );
  }

  return (
    <Card padding="md">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
        {/* Aktivitetsindikator */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: `${activity.color}20`,
            border: `3px solid ${activity.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: activity.color,
          }}
        >
          {ActivityIcons[activity.icon as keyof typeof ActivityIcons]}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-sm)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
              Rörelseaktivitet
            </h3>
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: activity.color,
                fontWeight: 500,
              }}
            >
              {activity.description}
            </span>
          </div>

          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginTop: '4px',
            }}
          >
            Ljudnivå: {activity.soundLevel.toFixed(0)} dB
          </div>

          {/* Historik-bar */}
          {showHistory && activityHistory.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Senaste 2 min:
              </div>
              <div style={{ display: 'flex', gap: '2px', height: '20px' }}>
                {activityHistory.map((hist, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      backgroundColor: hist.color,
                      opacity: 0.3 + (idx / activityHistory.length) * 0.7,
                      borderRadius: '2px',
                    }}
                    title={`${hist.description} (${hist.soundLevel.toFixed(0)} dB)`}
                  />
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
              marginTop: 'var(--spacing-sm)',
            }}
          >
            Kompletterar PIR-sensor och accelerometer
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ActivityIndicator;
