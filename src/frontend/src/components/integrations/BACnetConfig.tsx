/**
 * BACnetConfig - Konfigurationsformulär för BACnet-inställningar
 */
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface BACnetConfigData {
  on?: boolean;
  deviceName?: string;
  instanceNumber?: number;
  location?: string;
  port?: number;
  foreignDevice?: boolean;
  foreignBBMD?: string;
  foreignTTL?: number;
  covIncrement?: number;
}

interface BACnetConfigProps {
  config?: BACnetConfigData;
  onUpdate?: (config: BACnetConfigData) => Promise<void>;
  loading?: boolean;
}

const TOKEN_KEY = 'tekniklokaler_auth_token';

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export const BACnetConfig: React.FC<BACnetConfigProps> = ({
  config: initialConfig,
  onUpdate,
  loading: externalLoading = false,
}) => {
  const [config, setConfig] = useState<BACnetConfigData>(initialConfig || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleChange = (field: keyof BACnetConfigData, value: string | number | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleToggle = () => {
    handleChange('on', !config.on);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validera required fields om aktiverad
      if (config.on) {
        if (!config.deviceName || config.deviceName.trim().length === 0) {
          throw new Error('Device name måste anges när BACnet är aktiverad');
        }
        if (!config.instanceNumber || config.instanceNumber === 0) {
          throw new Error('Instance number måste vara > 0 när BACnet är aktiverad');
        }
      }

      // Validera port
      if (config.port !== undefined && (config.port < 1 || config.port > 65535)) {
        throw new Error('Port måste vara mellan 1 och 65535');
      }

      // Validera instance number
      if (config.instanceNumber !== undefined && (config.instanceNumber < 0 || config.instanceNumber > 4194303)) {
        throw new Error('Instance number måste vara mellan 0 och 4194303');
      }

      // Om onUpdate callback finns, använd den
      if (onUpdate) {
        await onUpdate(config);
      } else {
        // Annars, skicka direkt till API
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        await fetchWithAuth(`${baseUrl}/integrations/bacnet/config`, {
          method: 'PUT',
          body: JSON.stringify(config),
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara konfiguration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="md">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
            BACnet Konfiguration
          </h3>
        </div>

        {/* Toggle för aktivering */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <input
              type="checkbox"
              checked={config.on || false}
              onChange={handleToggle}
              style={{ cursor: 'pointer' }}
            />
            <span>Aktivera BACnet</span>
          </label>
        </div>

        {/* Device Name */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
            }}
          >
            Device Name {config.on && <span style={{ color: '#dc2626' }}>*</span>}
          </label>
          <input
            type="text"
            value={config.deviceName || ''}
            onChange={(e) => handleChange('deviceName', e.target.value)}
            required={config.on === true}
            disabled={!config.on}
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: config.on ? 'var(--color-background)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              opacity: config.on ? 1 : 0.6,
            }}
          />
        </div>

        {/* Instance Number */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
            }}
          >
            Instance Number {config.on && <span style={{ color: '#dc2626' }}>*</span>}
          </label>
          <input
            type="number"
            value={config.instanceNumber || 0}
            onChange={(e) => handleChange('instanceNumber', parseInt(e.target.value) || 0)}
            min={0}
            max={4194303}
            required={config.on === true}
            disabled={!config.on}
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: config.on ? 'var(--color-background)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              opacity: config.on ? 1 : 0.6,
            }}
          />
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            Måste vara unikt på nätverket (0-4194303)
          </div>
        </div>

        {/* Port */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
            }}
          >
            Port
          </label>
          <input
            type="number"
            value={config.port || 47808}
            onChange={(e) => handleChange('port', parseInt(e.target.value) || 47808)}
            min={1}
            max={65535}
            disabled={!config.on}
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: config.on ? 'var(--color-background)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              opacity: config.on ? 1 : 0.6,
            }}
          />
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            Standard BACnet-port är 47808
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
            }}
          >
            Location (valfritt)
          </label>
          <input
            type="text"
            value={config.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            disabled={!config.on}
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: config.on ? 'var(--color-background)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              opacity: config.on ? 1 : 0.6,
            }}
          />
        </div>

        {/* COV Increment */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
            }}
          >
            COV Increment
          </label>
          <input
            type="number"
            value={config.covIncrement || 5}
            onChange={(e) => handleChange('covIncrement', parseInt(e.target.value) || 5)}
            min={0}
            disabled={!config.on}
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: config.on ? 'var(--color-background)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              opacity: config.on ? 1 : 0.6,
            }}
          />
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            Change of Value threshold
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              marginBottom: 'var(--spacing-md)',
              padding: 'var(--spacing-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#dc2626',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div
            style={{
              marginBottom: 'var(--spacing-md)',
              padding: 'var(--spacing-sm)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#16a34a',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Konfiguration sparad!
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          disabled={saving || externalLoading}
        >
          {saving ? 'Sparar...' : 'Spara konfiguration'}
        </Button>
      </form>
    </Card>
  );
};

