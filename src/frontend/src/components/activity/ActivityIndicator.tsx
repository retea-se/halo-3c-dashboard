/**
 * ActivityIndicator - Visar rörelse/aktivitetsindikering baserat på ljudnivå
 *
 * Eftersom Halo 3C inte har dedikerad rörelsesensor (PIR) används ljudnivå
 * som proxy för att indikera aktivitet i rummet.
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

const getActivityLevel = (soundDb: number): ActivityLevel => {
  if (soundDb < 40) {
    return {
      level: 'none',
      soundLevel: soundDb,
      description: 'Ingen aktivitet',
      color: '#9ca3af',
      icon: '😴',
    };
  }
  if (soundDb < 55) {
    return {
      level: 'low',
      soundLevel: soundDb,
      description: 'Låg aktivitet',
      color: '#22c55e',
      icon: '🟢',
    };
  }
  if (soundDb < 65) {
    return {
      level: 'medium',
      soundLevel: soundDb,
      description: 'Normal aktivitet',
      color: '#f59e0b',
      icon: '🟡',
    };
  }
  return {
    level: 'high',
    soundLevel: soundDb,
    description: 'Hög aktivitet',
    color: '#ef4444',
    icon: '🔴',
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
        <span style={{ fontSize: '14px' }}>{activity.icon}</span>
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
            fontSize: '24px',
            flexShrink: 0,
          }}
        >
          {activity.icon}
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
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--spacing-sm)',
              fontStyle: 'italic',
            }}
          >
            Baserat på ljudnivå (ingen PIR-sensor)
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ActivityIndicator;
