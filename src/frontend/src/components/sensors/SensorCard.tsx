/**
 * SensorCard - Visar enskild sensor med värde, metadata och tooltip/popover
 */
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { SensorInfoPopover } from './SensorInfoPopover';
import { useTheme } from '../../theme/ThemeProvider';

interface SensorCardProps {
  sensorData: {
    sensor_id: string;
    timestamp: string;
    values: Record<string, number>;
    metadata?: any;
    trend?: 'up' | 'down' | 'stable';
    previousValue?: number;
  };
  metadata?: any;
}

// Trend-indikator komponent
const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'stable'; size?: number }> = ({ trend, size = 16 }) => {
  const getColor = () => {
    switch (trend) {
      case 'up': return '#ef4444'; // röd - ökar
      case 'down': return '#22c55e'; // grön - minskar (oftast bra)
      default: return '#6b7280'; // grå - stabil
    }
  };

  const getIcon = () => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        fontSize: size * 0.75,
        fontWeight: 'bold',
        color: getColor(),
        marginLeft: 'var(--spacing-xs)',
      }}
      title={trend === 'up' ? 'Ökande' : trend === 'down' ? 'Minskande' : 'Stabil'}
    >
      {getIcon()}
    </span>
  );
};

export const SensorCard: React.FC<SensorCardProps> = ({ sensorData, metadata }) => {
  const { colors } = useTheme();
  const [showPopover, setShowPopover] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Hämta första värdet (för nu, kan utökas)
  const firstValue = Object.values(sensorData.values)[0];
  const value = firstValue !== undefined ? firstValue : null;

  const sensorMeta = metadata || sensorData.metadata;
  const displayName = sensorMeta?.display_name || sensorData.sensor_id;
  const unit = sensorMeta?.unit || '';
  const shortDescription = sensorMeta?.short_description || '';
  const normalRange = sensorMeta?.normal_range;

  // Bestäm status baserat på normal range
  let statusColor = colors.text.secondary;
  if (normalRange && value !== null) {
    if (value >= normalRange.min && value <= normalRange.max) {
      statusColor = colors.success;
    } else if (normalRange.min && value < normalRange.min) {
      statusColor = colors.warning;
    } else if (normalRange.max && value > normalRange.max) {
      statusColor = colors.error;
    }
  }

  return (
    <Card padding="md" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                margin: 0,
                color: 'var(--color-text-primary)',
              }}
            >
              {displayName}
            </h3>
            {/* Info icon för popover */}
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowPopover(!showPopover)}
            >
              <Icon
                name="info-icon"
                size={16}
                color={colors.text.secondary}
                style={{ opacity: 0.6 }}
              />
              {showTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 'var(--spacing-xs)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm)',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 100,
                  }}
                >
                  {shortDescription || 'Klicka för mer information'}
                </div>
              )}
            </div>
          </div>
          {value !== null ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 700,
                color: statusColor,
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              {value.toFixed(1)} {unit}
              {sensorData.trend && <TrendIndicator trend={sensorData.trend} size={20} />}
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Inga data
            </div>
          )}
          {normalRange && (
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              Normal: {normalRange.min}–{normalRange.max} {unit}
            </div>
          )}
        </div>
      </div>

      {/* Popover för detaljerad information */}
      {showPopover && sensorMeta && (
        <SensorInfoPopover
          metadata={sensorMeta}
          onClose={() => setShowPopover(false)}
        />
      )}
    </Card>
  );
};

