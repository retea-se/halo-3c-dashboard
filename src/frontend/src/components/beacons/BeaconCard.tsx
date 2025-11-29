/**
 * BeaconCard - Visar enskild beacon med närvaro-status, signalstyrka, batteri
 */
import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeProvider';

interface BeaconCardProps {
  beacon: {
    beacon_id: string;
    beacon_name?: string;
    name?: string;
    rssi: number | null;
    battery: number | null;
    is_present?: boolean;
    timestamp?: string;
    last_seen?: string;
    status?: number;
  };
  onClick?: () => void;
}

export const BeaconCard: React.FC<BeaconCardProps> = ({ beacon, onClick }) => {
  const { colors } = useTheme();

  // Bestäm närvaro-status
  const isPresent = beacon.is_present ?? (beacon.rssi !== null && beacon.rssi > -80);
  const rssi = beacon.rssi || -100;
  const battery = beacon.battery || 0;
  const displayName = beacon.beacon_name || beacon.name || beacon.beacon_id;

  // Färgkodning för signalstyrka
  const getRssiColor = (rssi: number): string => {
    if (rssi > -60) return colors.success;
    if (rssi > -80) return colors.warning;
    if (rssi > -90) return colors.warning;
    return colors.error;
  };

  // Färgkodning för batteri
  const getBatteryColor = (battery: number): string => {
    if (battery > 50) return colors.success;
    if (battery > 20) return colors.warning;
    return colors.error;
  };

  const getSignalStrengthLabel = (rssi: number): string => {
    if (rssi > -60) return 'Mycket nära';
    if (rssi > -80) return 'Nära';
    if (rssi > -90) return 'Långt bort';
    return 'Mycket långt bort';
  };

  return (
    <Card padding="md" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <Icon name="beacon-icon" size={24} color={colors.text.secondary} />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
            {displayName}
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            {beacon.beacon_id}
          </p>
        </div>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isPresent ? colors.success : colors.text.secondary,
          }}
          title={isPresent ? 'Närvarande' : 'Ej närvarande'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
        <div>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Signalstyrka
          </p>
          <p style={{ margin: 0, fontSize: 'var(--font-size-base)', color: getRssiColor(rssi), fontWeight: 600 }}>
            {rssi} dBm
          </p>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            {getSignalStrengthLabel(rssi)}
          </p>
        </div>

        <div>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Batteri
          </p>
          <div style={{ marginTop: 'var(--spacing-xs)' }}>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--color-surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, battery))}%`,
                  height: '100%',
                  backgroundColor: getBatteryColor(battery),
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              {battery}%
            </p>
          </div>
        </div>
      </div>

      {beacon.status === 1 && (
        <div
          style={{
            marginTop: 'var(--spacing-md)',
            padding: 'var(--spacing-sm)',
            backgroundColor: `${colors.error}20`,
            borderRadius: 'var(--radius-sm)',
            color: colors.error,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
          }}
        >
          Panikknapp aktiverad
        </div>
      )}
    </Card>
  );
};
