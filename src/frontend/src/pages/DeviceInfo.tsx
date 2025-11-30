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
    eth0?: { ip?: string; router?: string; dns?: string };
    wlan0?: { wifion?: boolean; ssid?: string; ip?: string };
  };
  cloud?: {
    connected?: boolean;
    server?: string;
    hadcloud?: boolean;
    domain?: string;
    state?: string;
    alertsOn?: boolean;
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
    go?: number;
    throttled?: number;
    checkfiles?: string;
    [key: string]: unknown;
  };
  time_info?: string;
  fetched_at?: string;
}

interface SystemStatus {
  backend: string;
  influxdb: { status: string; url?: string; org?: string; bucket?: string; error?: string };
  halo_sensor: { status: string; ip?: string; error?: string };
  collector: { status: string; note?: string };
  heartbeat?: {
    status: string;
    last_contact?: string;
    seconds_since_contact?: number;
    error?: string | null;
  };
  timestamp: string;
}

interface SystemStats {
  sensors: {
    total_count: number;
    categories: Record<string, number>;
  };
  software: {
    python_version: string;
    fastapi_version: string;
    pydantic_version: string;
    influxdb_client_version: string;
  };
  deployment: {
    docker: boolean;
    hostname: string;
    environment: string;
  };
  configuration: {
    halo_ip: string;
    influxdb_url: string;
    poll_interval: number;
  };
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
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Hämta systemstatus, enhetsinformation och stats parallellt
        const [statusRes, infoRes, statsRes] = await Promise.allSettled([
          fetchWithAuth('/api/system/status'),
          fetchWithAuth('/api/system/device/info'),
          fetchWithAuth('/api/system/stats'),
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

        if (statsRes.status === 'fulfilled') {
          setSystemStats(statsRes.value);
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
              {deviceInfo?.workers?.go !== undefined && (
                <div style={{ marginTop: 'var(--spacing-xs)' }}>
                  <span>Status: </span>
                  <span style={{ color: deviceInfo.workers.go === 1 ? '#166534' : '#991b1b' }}>
                    {deviceInfo.workers.go === 1 ? 'Aktiv' : 'Stoppad'}
                  </span>
                </div>
              )}
              {deviceInfo?.workers?.checkfiles && (
                <div style={{ marginTop: 'var(--spacing-xs)' }}>
                  <span>Filer: </span>
                  <span style={{ fontFamily: 'monospace' }}>{deviceInfo.workers.checkfiles.trim()}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Heartbeat */}
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
              <strong>Heartbeat</strong>
              <StatusBadge status={systemStatus?.heartbeat?.status || 'unknown'} />
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              <div>Sensokövervakning via polling</div>
              {systemStatus?.heartbeat?.seconds_since_contact !== undefined && (
                <div style={{ marginTop: 'var(--spacing-xs)' }}>
                  <span>Senaste kontakt: </span>
                  <span style={{ fontFamily: 'monospace' }}>
                    {systemStatus.heartbeat.seconds_since_contact < 60
                      ? `${systemStatus.heartbeat.seconds_since_contact}s sedan`
                      : `${Math.floor(systemStatus.heartbeat.seconds_since_contact / 60)}m sedan`}
                  </span>
                </div>
              )}
              {systemStatus?.heartbeat?.last_contact && (
                <div style={{ marginTop: 'var(--spacing-xs)' }}>
                  <span>Tid: </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                    {new Date(systemStatus.heartbeat.last_contact).toLocaleString('sv-SE')}
                  </span>
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
                {/* Visa sensorserienummer från about-objektet */}
                {deviceInfo.about && Object.keys(deviceInfo.about).filter(k => k.includes('sensor') || k.includes('Sensor')).map((key) => (
                  <div key={key} style={{ marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{key.replace(' ser#', ': ')}</span>
                  </div>
                ))}
                {deviceInfo.ip && (
                  <div style={{ marginTop: 'var(--spacing-sm)' }}>
                    <a
                      href={`http://${deviceInfo.ip}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: 'var(--font-size-xs)' }}
                    >
                      Öppna webbgränssnitt
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Tid & Synkronisering */}
            <Card padding="md">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                Tid & Synkronisering
              </h3>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                {deviceInfo.time_info ? (
                  <>
                    {deviceInfo.time_info.includes('Time zone:') && (
                      <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Tidszon: </span>
                        <span>{deviceInfo.time_info.match(/Time zone: ([^\n]+)/)?.[1] || '-'}</span>
                      </div>
                    )}
                    {deviceInfo.time_info.includes('synchronized:') && (
                      <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Synkroniserad: </span>
                        <span style={{
                          color: deviceInfo.time_info.includes('synchronized: yes') ? '#166534' : '#991b1b',
                          fontWeight: 500
                        }}>
                          {deviceInfo.time_info.includes('synchronized: yes') ? 'Ja' : 'Nej'}
                        </span>
                      </div>
                    )}
                    {deviceInfo.time_info.includes('NTP service:') && (
                      <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>NTP: </span>
                        <span style={{
                          color: deviceInfo.time_info.includes('NTP service: active') ? '#166534' : '#991b1b'
                        }}>
                          {deviceInfo.time_info.includes('NTP service: active') ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                    )}
                    {deviceInfo.time_info.includes('NTP=') && (
                      <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>NTP-server: </span>
                        <span style={{ fontFamily: 'monospace' }}>
                          {deviceInfo.time_info.match(/NTP=([^\n]+)/)?.[1] || '-'}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: 'var(--color-text-secondary)' }}>Ingen tidsinfo tillgänglig</div>
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
                    <StatusBadge status={
                      deviceInfo.cloud.state === 'Connected' ? 'connected' :
                      deviceInfo.cloud.connected ? 'connected' : 'disconnected'
                    } />
                  </div>
                  {deviceInfo.cloud.state && (
                    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Tillstånd: </span>
                      <span>{deviceInfo.cloud.state}</span>
                    </div>
                  )}
                  {deviceInfo.cloud.domain && (
                    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Domän: </span>
                      <span>{deviceInfo.cloud.domain}</span>
                    </div>
                  )}
                  {deviceInfo.cloud.alertsOn !== undefined && (
                    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Larm: </span>
                      <span style={{ color: deviceInfo.cloud.alertsOn ? '#166534' : '#991b1b' }}>
                        {deviceInfo.cloud.alertsOn ? 'Aktiverat' : 'Avaktiverat'}
                      </span>
                    </div>
                  )}
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

      {/* Systemstatistik */}
      {systemStats && (
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
            Systemstatistik
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
            {/* Sensorer */}
            <Card padding="md">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                Sensorstatistik
              </h3>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                {systemStats.sensors.total_count} sensorer
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                {Object.entries(systemStats.sensors.categories).map(([category, count]) => (
                  <div key={category} style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{category}</span>
                    <span style={{ fontWeight: 500 }}>{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Programvaruversioner */}
            <Card padding="md">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                Programvara
              </h3>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Python: </span>
                  <span style={{ fontFamily: 'monospace' }}>{systemStats.software.python_version}</span>
                </div>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>FastAPI: </span>
                  <span style={{ fontFamily: 'monospace' }}>{systemStats.software.fastapi_version}</span>
                </div>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Pydantic: </span>
                  <span style={{ fontFamily: 'monospace' }}>{systemStats.software.pydantic_version}</span>
                </div>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>InfluxDB Client: </span>
                  <span style={{ fontFamily: 'monospace' }}>{systemStats.software.influxdb_client_version}</span>
                </div>
              </div>
            </Card>

            {/* Deployment */}
            <Card padding="md">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                Deployment
              </h3>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Docker: </span>
                  <span style={{ color: systemStats.deployment.docker ? '#166534' : '#991b1b', fontWeight: 500 }}>
                    {systemStats.deployment.docker ? 'Ja' : 'Nej'}
                  </span>
                </div>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Värdnamn: </span>
                  <span style={{ fontFamily: 'monospace' }}>{systemStats.deployment.hostname}</span>
                </div>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Miljö: </span>
                  <span style={{ textTransform: 'uppercase', fontWeight: 500 }}>{systemStats.deployment.environment}</span>
                </div>
              </div>
            </Card>

            {/* Konfiguration */}
            <Card padding="md">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                Konfiguration
              </h3>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Halo IP: </span>
                  <span style={{ fontFamily: 'monospace' }}>{systemStats.configuration.halo_ip}</span>
                </div>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>InfluxDB: </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>{systemStats.configuration.influxdb_url}</span>
                </div>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Poll-intervall: </span>
                  <span>{systemStats.configuration.poll_interval}s</span>
                </div>
              </div>
            </Card>
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
