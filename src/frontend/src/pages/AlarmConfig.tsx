/**
 * AlarmConfig - Demo/Mockup sida för larmkonfiguration
 *
 * Visar möjligheter för:
 * - SNMP-integration
 * - E-postlarm
 * - Webhook-integration
 *
 * NOTERA: Detta är en demo/mockup - ingen faktisk backend-integration.
 */
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';

interface AlarmChannel {
  id: string;
  type: 'email' | 'snmp' | 'webhook';
  name: string;
  enabled: boolean;
  config: Record<string, string>;
}

interface AlarmRule {
  id: string;
  name: string;
  eventTypes: string[];
  severity: 'all' | 'warning' | 'critical';
  channels: string[];
  enabled: boolean;
}

// Demo-data
const DEMO_CHANNELS: AlarmChannel[] = [
  {
    id: 'email-1',
    type: 'email',
    name: 'Driftpersonal',
    enabled: true,
    config: {
      recipients: 'drift@example.com, ansvarig@example.com',
      smtpServer: 'smtp.example.com',
      smtpPort: '587',
    },
  },
  {
    id: 'snmp-1',
    type: 'snmp',
    name: 'Central SNMP Manager',
    enabled: false,
    config: {
      host: '192.168.1.100',
      port: '162',
      community: 'public',
      version: 'v2c',
    },
  },
  {
    id: 'webhook-1',
    type: 'webhook',
    name: 'Teams-integration',
    enabled: true,
    config: {
      url: 'https://outlook.office.com/webhook/...',
      method: 'POST',
    },
  },
];

const DEMO_RULES: AlarmRule[] = [
  {
    id: 'rule-1',
    name: 'Kritiska larm till alla',
    eventTypes: ['all'],
    severity: 'critical',
    channels: ['email-1', 'snmp-1', 'webhook-1'],
    enabled: true,
  },
  {
    id: 'rule-2',
    name: 'CO2-varningar till e-post',
    eventTypes: ['CO2cal', 'AQI'],
    severity: 'warning',
    channels: ['email-1'],
    enabled: true,
  },
  {
    id: 'rule-3',
    name: 'Ljudspikar till Teams',
    eventTypes: ['SOUND_SPIKE', 'SOUND_SUSTAINED'],
    severity: 'all',
    channels: ['webhook-1'],
    enabled: false,
  },
];

const EVENT_TYPES = [
  { value: 'all', label: 'Alla events' },
  { value: 'SOUND_SPIKE', label: 'Ljudspikar' },
  { value: 'SOUND_SUSTAINED', label: 'Ihållande ljud' },
  { value: 'CO2cal', label: 'CO2-nivåer' },
  { value: 'AQI', label: 'Luftkvalitet (AQI)' },
  { value: 'Temp_C', label: 'Temperatur' },
  { value: 'Humidity', label: 'Luftfuktighet' },
  { value: 'BEACON_PANIC_BUTTON', label: 'Panikknapp' },
  { value: 'Vape', label: 'Vape-detektion' },
  { value: 'THC', label: 'THC-detektion' },
  { value: 'Tamper', label: 'Tamper/sabotage' },
];

export const AlarmConfig: React.FC = () => {
  const [channels, setChannels] = useState<AlarmChannel[]>(DEMO_CHANNELS);
  const [rules, setRules] = useState<AlarmRule[]>(DEMO_RULES);
  const [selectedTab, setSelectedTab] = useState<'channels' | 'rules'>('channels');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);

  // Toggle channel enabled
  const toggleChannel = (channelId: string) => {
    setChannels(prev =>
      prev.map(ch =>
        ch.id === channelId ? { ...ch, enabled: !ch.enabled } : ch
      )
    );
  };

  // Toggle rule enabled
  const toggleRule = (ruleId: string) => {
    setRules(prev =>
      prev.map(r =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      )
    );
  };

  // Get channel icon
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '✉️';
      case 'snmp':
        return '📡';
      case 'webhook':
        return '🔗';
      default:
        return '📢';
    }
  };

  // Get channel type label
  const getChannelTypeLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'E-post';
      case 'snmp':
        return 'SNMP Trap';
      case 'webhook':
        return 'Webhook';
      default:
        return type;
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header med demo-banner */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
          }}
        >
          <span style={{ fontSize: '20px' }}>ℹ️</span>
          <div>
            <strong style={{ color: 'var(--color-primary)' }}>Demo / Mockup</strong>
            <span style={{ color: 'var(--color-text-secondary)', marginLeft: 'var(--spacing-sm)' }}>
              Denna sida visar hur larmkonfiguration kan se ut. Ändringar sparas inte.
            </span>
          </div>
        </div>
        <h1 style={{ margin: 0, marginBottom: 'var(--spacing-xs)' }}>Larmkonfiguration</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Konfigurera hur och när larm ska skickas vid olika händelser.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-xs)',
          marginBottom: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--spacing-sm)',
        }}
      >
        <button
          onClick={() => setSelectedTab('channels')}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            border: 'none',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            backgroundColor: selectedTab === 'channels' ? 'var(--color-primary)' : 'transparent',
            color: selectedTab === 'channels' ? 'white' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          📢 Larmkanaler
        </button>
        <button
          onClick={() => setSelectedTab('rules')}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            border: 'none',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            backgroundColor: selectedTab === 'rules' ? 'var(--color-primary)' : 'transparent',
            color: selectedTab === 'rules' ? 'white' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          ⚙️ Larmregler
        </button>
      </div>

      {/* Channels Tab */}
      {selectedTab === 'channels' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Larmkanaler</h2>
            <button
              onClick={() => setShowAddChannel(true)}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              + Lägg till kanal
            </button>
          </div>

          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {channels.map(channel => (
              <Card key={channel.id} padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '32px' }}>{getChannelIcon(channel.type)}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)' }}>{channel.name}</h3>
                        <span
                          style={{
                            padding: '2px 8px',
                            backgroundColor: 'var(--color-surface-elevated)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          {getChannelTypeLabel(channel.type)}
                        </span>
                      </div>
                      <div style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {channel.type === 'email' && (
                          <div>Mottagare: {channel.config.recipients}</div>
                        )}
                        {channel.type === 'snmp' && (
                          <div>Host: {channel.config.host}:{channel.config.port} ({channel.config.version})</div>
                        )}
                        {channel.type === 'webhook' && (
                          <div>URL: {channel.config.url?.substring(0, 50)}...</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={channel.enabled}
                        onChange={() => toggleChannel(channel.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)', color: channel.enabled ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                        {channel.enabled ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </label>
                    <button
                      style={{
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      Redigera
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Integration info boxes */}
          <div style={{ marginTop: 'var(--spacing-xl)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
            <Card padding="md" style={{ borderLeft: '4px solid #22c55e' }}>
              <h4 style={{ margin: 0, marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <span>✉️</span> E-postintegration
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Skicka larm direkt till e-postmottagare. Stöd för SMTP, Office 365 och Gmail.
                Konfigurera flera mottagare per kanal.
              </p>
            </Card>

            <Card padding="md" style={{ borderLeft: '4px solid #3b82f6' }}>
              <h4 style={{ margin: 0, marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <span>📡</span> SNMP Trap
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Integrera med befintliga övervakningssystem via SNMP traps.
                Stöd för SNMPv2c och SNMPv3 med autentisering.
              </p>
            </Card>

            <Card padding="md" style={{ borderLeft: '4px solid #f59e0b' }}>
              <h4 style={{ margin: 0, marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <span>🔗</span> Webhook
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Skicka JSON-data till valfri URL. Perfekt för integration med
                Slack, Microsoft Teams, PagerDuty, eller egna system.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {selectedTab === 'rules' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Larmregler</h2>
            <button
              onClick={() => setShowAddRule(true)}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              + Lägg till regel
            </button>
          </div>

          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {rules.map(rule => (
              <Card key={rule.id} padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                      <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)' }}>{rule.name}</h3>
                      <span
                        style={{
                          padding: '2px 8px',
                          backgroundColor: rule.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' :
                                          rule.severity === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                                          'rgba(59, 130, 246, 0.2)',
                          color: rule.severity === 'critical' ? '#ef4444' :
                                 rule.severity === 'warning' ? '#f59e0b' : '#3b82f6',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 500,
                        }}
                      >
                        {rule.severity === 'critical' ? 'Kritiska' :
                         rule.severity === 'warning' ? 'Varningar' : 'Alla'}
                      </span>
                    </div>

                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                      <strong>Events:</strong>{' '}
                      {rule.eventTypes.map(t => EVENT_TYPES.find(e => e.value === t)?.label || t).join(', ')}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                      {rule.channels.map(channelId => {
                        const channel = channels.find(c => c.id === channelId);
                        if (!channel) return null;
                        return (
                          <span
                            key={channelId}
                            style={{
                              padding: '2px 8px',
                              backgroundColor: 'var(--color-surface-elevated)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 'var(--font-size-xs)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {getChannelIcon(channel.type)} {channel.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)', color: rule.enabled ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                        {rule.enabled ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </label>
                    <button
                      style={{
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      Redigera
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal placeholder for Add Channel */}
      {showAddChannel && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddChannel(false)}
        >
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Card padding="lg" style={{ maxWidth: '500px', width: '100%' }}>
              <h2 style={{ margin: 0, marginBottom: 'var(--spacing-lg)' }}>Lägg till larmkanal</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
              <em>Demo: Denna funktionalitet är inte implementerad i demo-läge.</em>
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                onClick={() => setShowAddChannel(false)}
                style={{
                  flex: 1,
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Stäng
              </button>
            </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal placeholder for Add Rule */}
      {showAddRule && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddRule(false)}
        >
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Card padding="lg" style={{ maxWidth: '500px', width: '100%' }}>
              <h2 style={{ margin: 0, marginBottom: 'var(--spacing-lg)' }}>Lägg till larmregel</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
              <em>Demo: Denna funktionalitet är inte implementerad i demo-läge.</em>
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                onClick={() => setShowAddRule(false)}
                style={{
                  flex: 1,
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Stäng
              </button>
            </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
