/**
 * OccupancyCard - Visar rumsnärvarostatus
 * Använder CO2, ljud och BLE-beacons för att bestämma om rummet är bemannat
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { apiService, OccupancyStatus } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';

interface OccupancyCardProps {
  refreshInterval?: number; // ms, default 30000
  showDetails?: boolean;
}

export const OccupancyCard: React.FC<OccupancyCardProps> = ({
  refreshInterval = 30000,
  showDetails = true,
}) => {
  const { colors } = useTheme();
  const [status, setStatus] = useState<OccupancyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiService.getOccupancyStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load occupancy status:', err);
      setError('Kunde inte ladda närvarostatus');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [loadStatus, refreshInterval]);

  const getStateColor = (state: string) => {
    // Anpassade färger för mörkt tema med CSS-variabler som fallback
    switch (state) {
      case 'occupied':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.4)' };
      case 'vacant':
        return { bg: 'rgba(156, 163, 175, 0.15)', text: 'var(--color-text-secondary)', border: 'rgba(156, 163, 175, 0.3)' };
      case 'uncertain':
      default:
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)' };
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'occupied':
        return 'Bemannat';
      case 'vacant':
        return 'Tomt';
      case 'uncertain':
      default:
        return 'Osäkert';
    }
  };

  const getStateIcon = (state: string) => {
    // SVG-baserade ikoner istället för emojis
    switch (state) {
      case 'occupied':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="7" r="4" />
            <path d="M12 14c-6 0-8 3-8 5v2h16v-2c0-2-2-5-8-5z" />
          </svg>
        );
      case 'vacant':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <path d="M10 12h4" />
            <path d="M10 12l2-2m-2 2l2 2" />
          </svg>
        );
      case 'uncertain':
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
          </svg>
        );
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'Hög';
      case 'medium':
        return 'Medium';
      case 'low':
      default:
        return 'Låg';
    }
  };

  if (loading) {
    return (
      <Card padding="md">
        <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            Laddar närvarostatus...
          </span>
        </div>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card padding="md">
        <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
          <span style={{ color: 'var(--color-error)' }}>
            {error || 'Ingen data tillgänglig'}
          </span>
        </div>
      </Card>
    );
  }

  const stateColors = getStateColor(status.state);

  return (
    <Card padding="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {/* Rubrik */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: 'var(--font-size-md)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}>
            Rumsnärvaro
          </h3>
          <span style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-tertiary)',
          }}>
            Konfidens: {getConfidenceLabel(status.confidence)}
          </span>
        </div>

        {/* Huvudstatus */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          backgroundColor: stateColors.bg,
          borderRadius: 'var(--radius-lg)',
          border: `2px solid ${stateColors.border}`,
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: stateColors.text,
          }}>
            {getStateIcon(status.state)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              color: stateColors.text,
            }}>
              {getStateLabel(status.state)}
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: stateColors.text,
              opacity: 0.8,
            }}>
              Score: {status.score} / {status.threshold} (tröskel)
            </div>
          </div>
        </div>

        {/* Detaljerad breakdown */}
        {showDetails && status.details && (
          <div>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              style={{
                background: 'none',
                border: 'none',
                padding: 'var(--spacing-xs) 0',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
              }}
            >
              {showBreakdown ? '▼' : '▶'} Visa sensordetaljer
            </button>

            {showBreakdown && (
              <div style={{
                marginTop: 'var(--spacing-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
              }}>
                {/* CO2 */}
                <DetailRow
                  label="CO₂"
                  value={status.details.co2.value}
                  unit={status.details.co2.unit}
                  contribution={status.details.co2.contribution}
                  thresholds={status.details.co2.thresholds}
                />

                {/* Ljud */}
                <DetailRow
                  label="Ljud"
                  value={status.details.audio.value}
                  unit={status.details.audio.unit}
                  contribution={status.details.audio.contribution}
                  thresholds={status.details.audio.thresholds}
                />

                {/* PIR */}
                {status.details.pir && (
                  <DetailRow
                    label="PIR (rörelse)"
                    value={status.details.pir.value}
                    unit=""
                    contribution={status.details.pir.contribution}
                    thresholds={status.details.pir.thresholds}
                  />
                )}

                {/* Beacon */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    BLE Beacon
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <span style={{
                      color: status.details.beacon.present ? '#166534' : 'var(--color-text-tertiary)',
                      fontWeight: 500,
                    }}>
                      {status.details.beacon.present ? `Närvarande (${status.details.beacon.count})` : 'Ingen'}
                    </span>
                    <ContributionBadge value={status.details.beacon.contribution} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tidsstämpel */}
        <div style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-tertiary)',
          textAlign: 'right',
        }}>
          Uppdaterad: {new Date(status.timestamp).toLocaleTimeString('sv-SE')}
        </div>
      </div>
    </Card>
  );
};

// Hjälpkomponenter
interface DetailRowProps {
  label: string;
  value: number | null;
  unit: string;
  contribution: number;
  thresholds: { high: number; medium: number; baseline: number };
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  unit,
  contribution,
  thresholds,
}) => {
  const getValueColor = () => {
    if (value === null) return 'var(--color-text-tertiary)';
    if (value >= thresholds.high) return '#dc2626';
    if (value >= thresholds.medium) return '#f59e0b';
    return 'var(--color-text-primary)';
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'var(--spacing-xs) var(--spacing-sm)',
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--font-size-sm)',
    }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <span style={{ color: getValueColor(), fontWeight: 500 }}>
          {value !== null ? `${value.toFixed(1)} ${unit}` : 'N/A'}
        </span>
        <ContributionBadge value={contribution} />
      </div>
    </div>
  );
};

interface ContributionBadgeProps {
  value: number;
}

const ContributionBadge: React.FC<ContributionBadgeProps> = ({ value }) => {
  const getBadgeColor = () => {
    if (value >= 3) return { bg: '#dcfce7', text: '#166534' };
    if (value >= 1) return { bg: '#fef3c7', text: '#92400e' };
    return { bg: '#f3f4f6', text: '#6b7280' };
  };

  const colors = getBadgeColor();

  return (
    <span style={{
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: 'var(--font-size-xs)',
      fontWeight: 600,
      backgroundColor: colors.bg,
      color: colors.text,
      minWidth: '24px',
      textAlign: 'center',
    }}>
      +{value}
    </span>
  );
};

export default OccupancyCard;
