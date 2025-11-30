/**
 * RTSPConfig - Konfigurationsformulär för RTSP-inställningar
 */
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface RTSPConfigData {
  on?: number;
  port?: number;
  auth?: string;
  user?: string;
  pswd?: string;
  img?: string;
  scroll_time?: number;
}

interface RTSPConfigProps {
  config?: RTSPConfigData;
  onUpdate?: (config: RTSPConfigData) => Promise<void>;
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

export const RTSPConfig: React.FC<RTSPConfigProps> = ({
  config: initialConfig,
  onUpdate,
  loading: externalLoading = false,
}) => {
  const [config, setConfig] = useState<RTSPConfigData>(initialConfig || {});
  const [_loading, _setLoading] = useState(false); // Reserved for future use
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleChange = (field: keyof RTSPConfigData, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleToggle = () => {
    const newOnValue = config.on === 1 ? 0 : 1;
    handleChange('on', newOnValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validera port
      if (config.port !== undefined && (config.port < 1 || config.port > 65535)) {
        throw new Error('Port måste vara mellan 1 och 65535');
      }

      // Validera auth
      if (config.auth && !['basic', 'digest', 'both'].some(a => config.auth?.includes(a))) {
        throw new Error('Auth måste vara basic, digest eller both');
      }

      // Om onUpdate callback finns, använd den
      if (onUpdate) {
        await onUpdate(config);
      } else {
        // Annars, skicka direkt till API
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        await fetchWithAuth(`${baseUrl}/integrations/rtsp/config`, {
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
            RTSP Konfiguration
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
              checked={config.on === 1}
              onChange={handleToggle}
              style={{ cursor: 'pointer' }}
            />
            <span>Aktivera RTSP</span>
          </label>
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
            value={config.port || 8554}
            onChange={(e) => handleChange('port', parseInt(e.target.value) || 8554)}
            min={1}
            max={65535}
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Auth */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
            }}
          >
            Autentisering
          </label>
          <select
            value={config.auth || ''}
            onChange={(e) => handleChange('auth', e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="">Ingen autentisering</option>
            <option value="basic">Basic</option>
            <option value="digest">Digest</option>
            <option value="basic,digest">Basic, Digest</option>
          </select>
        </div>

        {/* Username */}
        {(config.auth && config.auth.length > 0) && (
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Användarnamn
            </label>
            <input
              type="text"
              value={config.user || ''}
              onChange={(e) => handleChange('user', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        )}

        {/* Password */}
        {(config.auth && config.auth.length > 0) && (
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Lösenord
            </label>
            <input
              type="password"
              value={config.pswd || ''}
              onChange={(e) => handleChange('pswd', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        )}

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

