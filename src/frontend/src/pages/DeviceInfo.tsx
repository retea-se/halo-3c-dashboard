/**
 * DeviceInfo - Enhetsinformationssida
 * Visar teknisk information om Halo 3C-sensorn och systemkomponenter
 */
import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';

interface DeviceInfoData {
  ip?: string;
  lifetime_hours?: number;
  lifetime_formatted?: string;
  start_time?: number;
  start_time_formatted?: string;
  network?: {
    ip?: string;
    mac?: string;
    gateway?: string;
    netmask?: string;
    dns1?: string;
    dns2?: string;
    dhcp?: boolean;
  };
  cloud?: {
    connected?: boolean;
    server?: string;
  };
  about?: {
    serial?: string;
    model?: string;
    firmware?: string;
    hardware?: string;
    [key: string]: unknown;
  };
  workers?: {
    lifetimehrs?: number;
    starttime?: number;
    [key: string]: unknown;
  };
  time_info?: {
    timezone?: string;
    ntp_server?: string;
    [key: string]: unknown;
  };
  fetched_at?: string;
}

interface SystemStatus {
  backend: string;
  influxdb: { status: string; url?: string; org?: string; bucket?: string; error?: string };
  halo_sensor: { status: string; ip?: string; error?: string };
  collector: { status: string; note?: string };
  timestamp: string;
}

const TOKEN_KEY = 'tekniklokaler_auth_token';

const fetchWithAuth = async (url: string) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export const DeviceInfo: React.FC = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoData | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Hämta systemstatus och enhetsinformation parallellt
        const [statusRes, infoRes] = await Promise.allSettled([
          fetchWithAuth('/api/system/status'),
          fetchWithAuth('/api/system/device/info'),
        ]);

        if (statusRes.status === 'fulfilled') {
          setSystemStatus(statusRes.value);
        }

        if (infoRes.status === 'fulfilled') {
          setDeviceInfo(infoRes.value);
        } else {
          // Device info misslyckades, men vi kan fortfarande visa systemstatus
          console.warn('Device info fetch failed:', infoRes.reason);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Uppdatera var 30:e sekund
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRawData = async () => {
    try {
      const data = await fetchWithAuth('/api/system/device/raw');
      setRawData(data);
      setShowRawData(true);
    } catch (err) {
      console.error('Failed to load raw data:', err);
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getColor = () => {
      switch (status) {
        case 'connected':
        case 'healthy':
          return { bg: '#dcfce7', text: '#166534' };
        case 'disconnected':
        case 'error':
          return { bg: '#fee2e2', text: '#991b1b' };
        case 'not_configured':
        case 'unknown':
        default:
          return { bg: '#fef3c7', text: '#92400e' };
      }
    };
    const colors = getColor();
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 600,
        backgroundColor: colors.bg,
        color: colors.text,
        textTransform: 'uppercase',
      }}>
        {status}
      </span>
    );
  };

  if (loading && !systemStatus) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Enhetsinformation</h1>
        <div>Laddar...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Enhetsinformation</h1>

      {error && (
        <Card padding="md" style={{ marginBottom: 'var(--spacing-lg)', backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          <div style={{ color: '#991b1b' }}>
            <strong>Fel:</strong> {error}
          </div>
        </Card>
      )}

      {/* Systemstatus */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
          Systemstatus
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
          {/* Backend */}
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
              <strong>Backend API</strong>
              <StatusBadge status={systemStatus?.backend || 'unknown'} />
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              FastAPI server
            </div>
          </Card>

          {/* InfluxDB */}
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
              <strong>InfluxDB</strong>
              <StatusBadge status={systemStatus?.influxdb?.status || 'unknown'} />
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              {systemStatus?.influxdb?.url && (
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span>URL: </span>
                  <span style={{ fontFamily: 'monospace' }}>{systemStatus.influxdb.url}</span>
                </div>
              )}
              {systemStatus?.influxdb?.org && (
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span>Organisation: </span>
                  <span>{systemStatus.influxdb.org}</span>
                </div>
              )}
              {systemStatus?.influxdb?.bucket && (
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span>Bucket: </span>
                  <span>{systemStatus.influxdb.bucket}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Halo Sensor */}
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
              <strong>Halo 3C Sensor</strong>
              <StatusBadge status={systemStatus?.halo_sensor?.status || 'unknown'} />
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              {systemStatus?.halo_sensor?.ip && (
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span>IP: </span>
                  <span style={{ fontFamily: 'monospace' }}>{systemStatus.halo_sensor.ip}</span>
                </div>
              )}
              {deviceInfo?.network?.mac && (
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span>MAC: </span>
                  <span style={{ fontFamily: 'monospace' }}>{deviceInfo.network.mac}</span>
                </div>
              )}
              {deviceInfo?.about?.serial && (
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span>Serienummer: </span>
                  <span style={{ fontFamily: 'monospace' }}>{String(deviceInfo.about.serial)}</span>
                </div>
              )}
              {systemStatus?.halo_sensor?.ip && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <a
                    href={`http://${systemStatus.halo_sensor.ip}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                  >
                    Öppna webbgränssnitt →
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Collector */}
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
              <strong>Datainsamlare</strong>
              <StatusBadge status={systemStatus?.collector?.status || 'unknown'} />
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              <div>Hämtar sensordata från Halo och lagrar i InfluxDB</div>
              {systemStatus?.collector?.note && (
                <div style={{ marginTop: 'var(--spacing-xs)', fontStyle: 'italic' }}>
                  {systemStatus.collector.note}
                </div>
              )}
            </div>
          </Card>
        </div>
        {systemStatus?.timestamp && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-sm)' }}>
            Senast uppdaterad: {new Date(systemStatus.timestamp).toLocaleString('sv-SE')}
          </div>
        )}
      </div>

      {/* Enhetsinformation */}
      {deviceInfo && (
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
            Sensorenhet
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
            {/* Drifttid */}
            <Card padding="md">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                Drifttid
              </h3>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
                {deviceInfo.lifetime_formatted || `${deviceInfo.lifetime_hours || 0} timmar`}
              </div>
              {deviceInfo.start_time_formatted && (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                  Startad: {deviceInfo.start_time_formatted}
                </div>
              )}
            </Card>

            {/* Enhetsinformation */}
            <Card padding="md">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                Enhet
              </h3>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                {deviceInfo.about?.serial && (
                  <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Serienummer: </span>
                    <span style={{ fontFamily: 'monospace' }}>{String(deviceInfo.about.serial)}</span>
                  </div>
                )}
                {deviceInfo.about?.model && (
                  <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Modell: </span>
                    <span>{String(deviceInfo.about.model)}</span>
                  </div>
                )}
                {deviceInfo.about?.firmware && (
                  <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Firmware: </span>
                    <span style={{ fontFamily: 'monospace' }}>{String(deviceInfo.about.firmware)}</span>
                  </div>
                )}
                {deviceInfo.about?.hardware && (
                  <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Hårdvara: </span>
                    <span style={{ fontFamily: 'monospace' }}>{String(deviceInfo.about.hardware)}</span>
                  </div>
                )}
                {deviceInfo.ip && (
                  <div style={{ marginTop: 'var(--spacing-sm)' }}>
                    <a
                      href={`http://${deviceInfo.ip}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: 'var(--font-size-xs)' }}
                    >
                      Öppna webbgränssnitt →
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Nätverksinfo */}
            <Card padding="md">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                Nätverksanslutning
              </h3>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>IP: </span>
                  <span style={{ fontFamily: 'monospace' }}>{deviceInfo.ip || deviceInfo.network?.ip || '-'}</span>
                </div>
                {deviceInfo.network?.mac && (
                  <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>MAC: </span>
                    <span style={{ fontFamily: 'monospace' }}>{deviceInfo.network.mac}</span>
                  </div>
                )}
                {deviceInfo.network?.gateway && (
                  <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Gateway: </span>
                    <span style={{ fontFamily: 'monospace' }}>{deviceInfo.network.gateway}</span>
                  </div>
                )}
                {deviceInfo.network?.netmask && (
                  <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Nätmask: </span>
                    <span style={{ fontFamily: 'monospace' }}>{deviceInfo.network.netmask}</span>
                  </div>
                )}
                {deviceInfo.network?.dns1 && (
                  <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>DNS: </span>
                    <span style={{ fontFamily: 'monospace' }}>{deviceInfo.network.dns1}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Moln-status */}
            {deviceInfo.cloud && (
              <Card padding="md">
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                  Molnanslutning
                </h3>
                <div style={{ fontSize: 'var(--font-size-sm)' }}>
                  <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Status: </span>
                    <StatusBadge status={deviceInfo.cloud.connected ? 'connected' : 'disconnected'} />
                  </div>
                  {deviceInfo.cloud.server && (
                    <div style={{ marginTop: 'var(--spacing-xs)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Server: </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>{deviceInfo.cloud.server}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Rådata sektion */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
          Rådata
        </h2>
        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Hämta senaste API-svar från Halo 3C-sensorn (JSON-format)
            </p>
            <button
              onClick={() => showRawData ? setShowRawData(false) : loadRawData()}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              {showRawData ? 'Dölj' : 'Visa rådata'}
            </button>
          </div>
          {showRawData && rawData && (
            <pre style={{
              backgroundColor: 'var(--color-background)',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'monospace',
            }}>
              {JSON.stringify(rawData, null, 2)}
            </pre>
          )}
        </Card>
      </div>

      {/* Footer med senaste uppdatering */}
      {deviceInfo?.fetched_at && (
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
          Enhetsinformation hämtad: {new Date(deviceInfo.fetched_at).toLocaleString('sv-SE')}
        </div>
      )}
    </div>
  );
};
