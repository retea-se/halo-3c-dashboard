/**
 * Integrations - RTSP och BACnet konfigurationssida
 */
import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { RTSPViewer } from '../components/integrations/RTSPViewer';
import { RTSPConfig } from '../components/integrations/RTSPConfig';
import { BACnetConfig } from '../components/integrations/BACnetConfig';
import { BACnetInstances } from '../components/integrations/BACnetInstances';

interface RTSPConfigData {
  on?: number;
  port?: number;
  auth?: string;
  user?: string;
  pswd?: string;
  img?: string;
  scroll_time?: number;
}

interface RTSPStatus {
  enabled: boolean;
  port: number;
  port_open: boolean;
  stream_url?: string | null;
  mjpeg_url?: string;
  auth?: string;
  config?: RTSPConfigData;
}

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

interface BACnetStatus {
  enabled: boolean;
  port: number;
  port_open: boolean;
  device_name?: string;
  instance_number?: number;
  location?: string;
  foreign_device?: boolean;
  cov_increment?: number;
  config?: BACnetConfigData;
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

export const Integrations: React.FC = () => {
  const [rtspConfig, setRtspConfig] = useState<RTSPConfigData | null>(null);
  const [rtspStatus, setRtspStatus] = useState<RTSPStatus | null>(null);
  const [bacnetConfig, setBacnetConfig] = useState<BACnetConfigData | null>(null);
  const [bacnetStatus, setBacnetStatus] = useState<BACnetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = import.meta.env.VITE_API_URL || '/api';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ladda RTSP och BACnet data parallellt
      const [rtspConfigRes, rtspStatusRes, bacnetConfigRes, bacnetStatusRes] = await Promise.allSettled([
        fetchWithAuth(`${baseUrl}/integrations/rtsp/config`),
        fetchWithAuth(`${baseUrl}/integrations/rtsp/status`),
        fetchWithAuth(`${baseUrl}/integrations/bacnet/config`),
        fetchWithAuth(`${baseUrl}/integrations/bacnet/status`),
      ]);

      if (rtspConfigRes.status === 'fulfilled') {
        setRtspConfig(rtspConfigRes.value.rtsp || {});
      }
      if (rtspStatusRes.status === 'fulfilled') {
        setRtspStatus(rtspStatusRes.value);
      }
      if (bacnetConfigRes.status === 'fulfilled') {
        setBacnetConfig(bacnetConfigRes.value.bacnet || {});
      }
      if (bacnetStatusRes.status === 'fulfilled') {
        setBacnetStatus(bacnetStatusRes.value);
      }

      // Kolla om någon av requests misslyckades
      const failures = [
        rtspConfigRes.status === 'rejected' && rtspConfigRes.reason,
        rtspStatusRes.status === 'rejected' && rtspStatusRes.reason,
        bacnetConfigRes.status === 'rejected' && bacnetConfigRes.reason,
        bacnetStatusRes.status === 'rejected' && bacnetStatusRes.reason,
      ].filter(Boolean);

      if (failures.length > 0) {
        console.warn('Some integration data failed to load:', failures);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ladda integrationsdata');
      console.error('Failed to load integrations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Uppdatera var 30:e sekund
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRTSPUpdate = async (config: RTSPConfigData) => {
    try {
      await fetchWithAuth(`${baseUrl}/integrations/rtsp/config`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      // Ladda om data efter uppdatering
      await loadData();
    } catch (err) {
      throw err;
    }
  };

  const handleBACnetUpdate = async (config: BACnetConfigData) => {
    try {
      await fetchWithAuth(`${baseUrl}/integrations/bacnet/config`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      // Ladda om data efter uppdatering
      await loadData();
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontSize: 'var(--font-size-md)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Laddar integrationsdata...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 'var(--spacing-lg)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          Integrationer
        </h1>
        <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>
          Konfigurera och övervaka RTSP video streaming och BACnet-protokoll
        </p>
      </div>

      {error && (
        <Card
          padding="md"
          style={{
            marginBottom: 'var(--spacing-lg)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ color: '#dc2626', fontSize: 'var(--font-size-sm)' }}>{error}</div>
        </Card>
      )}

      {/* RTSP Section */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-md)',
          }}
        >
          RTSP Video Streaming
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}
        >
          {/* RTSP Viewer */}
          <div>
            <Card padding="md">
              <h3
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 600,
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                Video Stream
              </h3>
              <RTSPViewer
                streamUrl={rtspStatus?.stream_url || null}
                mjpegUrl={rtspStatus?.mjpeg_url || undefined}
                enabled={rtspStatus?.enabled || false}
              />

              {/* Status info */}
              {rtspStatus && (
                <div style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: rtspStatus.enabled
                          ? rtspStatus.port_open
                            ? '#22c55e'
                            : '#eab308'
                          : '#6b7280',
                      }}
                    />
                    <span>
                      Status:{' '}
                      {rtspStatus.enabled
                        ? rtspStatus.port_open
                          ? 'Aktiv'
                          : 'Aktiverad men port ej tillgänglig'
                        : 'Inaktiverad'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>
                    Port: {rtspStatus.port}
                  </div>
                  {rtspStatus.stream_url && (
                    <div
                      style={{
                        marginTop: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'monospace',
                        color: 'var(--color-text-tertiary)',
                        wordBreak: 'break-all',
                      }}
                    >
                      {rtspStatus.stream_url}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* RTSP Config */}
          <div>
            <RTSPConfig config={rtspConfig || {}} onUpdate={handleRTSPUpdate} loading={loading} />
          </div>
        </div>
      </div>

      {/* BACnet Section */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-md)',
          }}
        >
          BACnet Protocol
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}
        >
          {/* BACnet Config */}
          <div>
            <BACnetConfig config={bacnetConfig || {}} onUpdate={handleBACnetUpdate} loading={loading} />

            {/* Status info */}
            {bacnetStatus && (
              <Card padding="md" style={{ marginTop: 'var(--spacing-md)' }}>
                <h3
                  style={{
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 600,
                    marginBottom: 'var(--spacing-sm)',
                  }}
                >
                  Status
                </h3>
                <div style={{ fontSize: 'var(--font-size-sm)' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: bacnetStatus.enabled
                          ? bacnetStatus.port_open
                            ? '#22c55e'
                            : '#eab308'
                          : '#6b7280',
                      }}
                    />
                    <span>
                      Status:{' '}
                      {bacnetStatus.enabled
                        ? bacnetStatus.port_open
                          ? 'Aktiv'
                          : 'Aktiverad men port ej tillgänglig'
                        : 'Inaktiverad'}
                    </span>
                  </div>
                  {bacnetStatus.device_name && (
                    <div style={{ marginTop: 'var(--spacing-xs)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Device Name: </span>
                      <span style={{ fontFamily: 'monospace' }}>{bacnetStatus.device_name}</span>
                    </div>
                  )}
                  {bacnetStatus.instance_number !== undefined && (
                    <div style={{ marginTop: 'var(--spacing-xs)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Instance Number: </span>
                      <span style={{ fontFamily: 'monospace' }}>{bacnetStatus.instance_number}</span>
                    </div>
                  )}
                  <div style={{ marginTop: 'var(--spacing-xs)', color: 'var(--color-text-secondary)' }}>
                    Port: {bacnetStatus.port} (UDP)
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* BACnet Instances */}
          <div>
            <BACnetInstances />
          </div>
        </div>
      </div>
    </div>
  );
};

