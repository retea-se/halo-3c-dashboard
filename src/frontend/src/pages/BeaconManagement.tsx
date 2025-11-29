/**
 * Beacon Management - Hantera BLE Beacons
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { apiService } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';

interface Beacon {
  beacon_id: string;
  name?: string;
  rssi?: number;
  battery?: number;
  is_present?: boolean;
  last_seen?: string;
  device_type?: string;
}

export const BeaconManagement: React.FC = () => {
  const { colors } = useTheme();
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newBeaconMac, setNewBeaconMac] = useState('');
  const [newBeaconName, setNewBeaconName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Ladda beacons
  const loadBeacons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getBeacons();
      setBeacons(data || []);
    } catch (error) {
      console.error('Failed to load beacons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBeacons();
    // Uppdatera var 30:e sekund
    const interval = setInterval(loadBeacons, 30000);
    return () => clearInterval(interval);
  }, [loadBeacons]);

  // Spara beacon-namn (för framtida implementation)
  const saveBeaconName = async (beaconId: string, name: string) => {
    // TODO: Implementera backend-endpoint för att spara beacon-namn
    console.log(`Saving beacon ${beaconId} with name ${name}`);
    setEditingId(null);
    // Uppdatera lokalt tills backend stödjer det
    setBeacons(prev =>
      prev.map(b => (b.beacon_id === beaconId ? { ...b, name } : b))
    );
  };

  // Lägg till beacon (för framtida implementation)
  const addBeacon = async () => {
    if (!newBeaconMac.trim()) return;
    // TODO: Implementera backend-endpoint för att lägga till beacon
    console.log(`Adding beacon ${newBeaconMac} with name ${newBeaconName}`);
    setNewBeaconMac('');
    setNewBeaconName('');
    setShowAddForm(false);
    // Lägg till lokalt
    setBeacons(prev => [
      ...prev,
      {
        beacon_id: newBeaconMac.toUpperCase(),
        name: newBeaconName || undefined,
        is_present: false,
      },
    ]);
  };

  // Formatera RSSI till signal-styrka
  const getSignalStrength = (rssi?: number): { label: string; color: string } => {
    if (rssi === undefined) return { label: 'Okänd', color: colors.text.secondary };
    if (rssi > -50) return { label: 'Utmärkt', color: colors.success };
    if (rssi > -70) return { label: 'Bra', color: colors.success };
    if (rssi > -85) return { label: 'Svag', color: colors.warning };
    return { label: 'Mycket svag', color: colors.error };
  };

  // Formatera tid sedan senast sedd
  const formatLastSeen = (timestamp?: string): string => {
    if (!timestamp) return 'Aldrig';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just nu';
    if (diffMins < 60) return `${diffMins} min sedan`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} tim sedan`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dagar sedan`;
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <h1 style={{ margin: 0 }}>BLE Beacon-hantering</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
          }}
        >
          {showAddForm ? 'Avbryt' : '+ Lägg till beacon'}
        </button>
      </div>

      {/* Lägg till beacon-formulär */}
      {showAddForm && (
        <Card padding="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h3
            style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: 600,
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Lägg till ny beacon
          </h3>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Ange MAC-adressen för din BLE-enhet (t.ex. din mobiltelefon med en beacon-app).
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--spacing-xs)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                MAC-adress *
              </label>
              <input
                type="text"
                value={newBeaconMac}
                onChange={(e) => setNewBeaconMac(e.target.value)}
                placeholder="AA:BB:CC:DD:EE:FF"
                style={{
                  width: '100%',
                  padding: 'var(--spacing-sm)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-base)',
                }}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--spacing-xs)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Namn (valfritt)
              </label>
              <input
                type="text"
                value={newBeaconName}
                onChange={(e) => setNewBeaconName(e.target.value)}
                placeholder="T.ex. Markus iPhone"
                style={{
                  width: '100%',
                  padding: 'var(--spacing-sm)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-base)',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={addBeacon}
                disabled={!newBeaconMac.trim()}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  backgroundColor: newBeaconMac.trim() ? 'var(--color-success)' : 'var(--color-border)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: newBeaconMac.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                }}
              >
                Lägg till
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Info-box */}
      <Card
        padding="md"
        style={{
          marginBottom: 'var(--spacing-lg)',
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h3
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-xs)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Om BLE Beacons
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Halo 3C-sensorn kan detektera BLE-beacons i närheten. Detta kan användas för närvarodetektering
          (t.ex. din mobiltelefon) eller för att spåra beacons med panikknapp. Beacons som detekteras
          visas automatiskt här.
        </p>
      </Card>

      {/* Beacon-lista */}
      {loading && beacons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
          Laddar beacons...
        </div>
      ) : beacons.length === 0 ? (
        <Card
          padding="lg"
          style={{
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          <h2 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-primary)' }}>
            Inga beacons detekterade
          </h2>
          <p>
            Halo 3C-sensorn har inte detekterat några BLE-beacons ännu.
            Se till att din beacon är aktiverad och inom räckvidd.
          </p>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          {beacons.map((beacon) => {
            const signal = getSignalStrength(beacon.rssi);
            const isEditing = editingId === beacon.beacon_id;

            return (
              <Card key={beacon.beacon_id} padding="md">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--spacing-sm)',
                  }}
                >
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => saveBeaconName(beacon.beacon_id, editName)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveBeaconName(beacon.beacon_id, editName);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        style={{
                          fontSize: 'var(--font-size-md)',
                          fontWeight: 600,
                          border: '1px solid var(--color-primary)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--spacing-xs)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    ) : (
                      <h3
                        style={{
                          fontSize: 'var(--font-size-md)',
                          fontWeight: 600,
                          margin: 0,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setEditingId(beacon.beacon_id);
                          setEditName(beacon.name || beacon.beacon_id);
                        }}
                        title="Klicka för att redigera namn"
                      >
                        {beacon.name || beacon.beacon_id}
                      </h3>
                    )}
                    <p
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        margin: '4px 0 0 0',
                        fontFamily: 'monospace',
                      }}
                    >
                      {beacon.beacon_id}
                    </p>
                  </div>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: beacon.is_present ? colors.success : colors.text.secondary,
                    }}
                    title={beacon.is_present ? 'Närvarande' : 'Inte synlig'}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--spacing-sm)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Signal: </span>
                    <span style={{ color: signal.color }}>{signal.label}</span>
                    {beacon.rssi && (
                      <span style={{ color: 'var(--color-text-secondary)' }}> ({beacon.rssi} dBm)</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Batteri: </span>
                    <span
                      style={{
                        color:
                          beacon.battery !== undefined
                            ? beacon.battery > 20
                              ? colors.success
                              : colors.warning
                            : colors.text.secondary,
                      }}
                    >
                      {beacon.battery !== undefined ? `${beacon.battery}%` : 'Okänt'}
                    </span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Senast sedd: </span>
                    <span>{formatLastSeen(beacon.last_seen)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
