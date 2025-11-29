/**
 * SensorInfoPopover - Popover med detaljerad sensor-information
 */
import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

interface SensorInfoPopoverProps {
  metadata: any;
  onClose: () => void;
}

export const SensorInfoPopover: React.FC<SensorInfoPopoverProps> = ({
  metadata,
  onClose,
}) => {

  return (
    <Card
      padding="md"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 'var(--spacing-xs)',
        zIndex: 200,
        maxWidth: '400px',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        <h4
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
            margin: 0,
            color: 'var(--color-text-primary)',
          }}
        >
          {metadata.display_name}
        </h4>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      {metadata.long_description && (
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-sm)',
            lineHeight: 1.5,
          }}
        >
          {metadata.long_description}
        </p>
      )}

      {metadata.normal_range && (
        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
          <strong style={{ fontSize: 'var(--font-size-sm)' }}>Normal intervall: </strong>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {metadata.normal_range.min}–{metadata.normal_range.max} {metadata.unit}
          </span>
          {metadata.normal_range.description && (
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--spacing-xs)',
                marginBottom: 0,
              }}
            >
              {metadata.normal_range.description}
            </p>
          )}
        </div>
      )}

      {metadata.warning_thresholds && metadata.warning_thresholds.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
          <strong style={{ fontSize: 'var(--font-size-sm)' }}>Varningstecken:</strong>
          <ul
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--spacing-xs)',
              paddingLeft: 'var(--spacing-md)',
            }}
          >
            {metadata.warning_thresholds.map((threshold: any, idx: number) => (
              <li key={idx}>{threshold.message}</li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to={`/sensors/info/${metadata.id}`}
        style={{
          display: 'inline-block',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-primary)',
          textDecoration: 'none',
          marginTop: 'var(--spacing-sm)',
        }}
        onClick={onClose}
      >
        Läs mer →
      </Link>
    </Card>
  );
};


