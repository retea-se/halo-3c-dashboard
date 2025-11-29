/**
 * BeaconList - Lista över alla beacons med filter/sortering
 */
import React, { useState, useEffect, useMemo } from 'react';
import { BeaconCard } from './BeaconCard';
import { BeaconHistoryChart } from './BeaconHistoryChart';
import { apiService } from '../../services/api';

interface Beacon {
  beacon_id: string;
  beacon_name?: string;
  name?: string;
  id?: string; // Backend kan returnera 'id' istället för 'beacon_id'
  rssi: number | null;
  battery: number | null;
  is_present?: boolean;
  timestamp?: string;
  last_seen?: string;
}

export const BeaconList: React.FC = () => {
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rssi' | 'battery'>('name');
  const [selectedBeacon, setSelectedBeacon] = useState<string | null>(null);

  // Ladda beacons
  useEffect(() => {
    const loadBeacons = async () => {
      try {
        setLoading(true);
        const data = await apiService.getBeacons();
        setBeacons(data || []);
      } catch (error) {
        console.error('Failed to load beacons:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBeacons();
    // Uppdatera varje 10 sekunder
    const interval = setInterval(loadBeacons, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredAndSortedBeacons = useMemo(() => {
    // Normalisera beacons (hantera både 'beacon_id' och 'id' från backend)
    const normalizedBeacons = beacons.map((b) => ({
      ...b,
      beacon_id: b.beacon_id || b.id || '',
    }));

    let filtered = normalizedBeacons;

    // Filtrera
    if (filter === 'present') {
      filtered = normalizedBeacons.filter((b) => b.is_present === true);
    } else if (filter === 'absent') {
      filtered = normalizedBeacons.filter((b) => b.is_present === false || !b.is_present);
    }

    // Sortera
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.beacon_name || a.name || a.beacon_id || '').localeCompare(
            b.beacon_name || b.name || b.beacon_id || ''
          );
        case 'rssi':
          return (b.rssi || -100) - (a.rssi || -100); // Högre RSSI först (närmare)
        case 'battery':
          return (b.battery || 0) - (a.battery || 0); // Högre batteri först
        default:
          return 0;
      }
    });

    return sorted;
  }, [beacons, filter, sortBy]);

  if (loading) {
    return <div>Laddar beacons...</div>;
  }

  return (
    <div className="beacon-list">
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Filter
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'present' | 'absent')}
            aria-label="Filter beacons"
            style={{
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="all">Alla</option>
            <option value="present">Närvarande</option>
            <option value="absent">Ej närvarande</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Sortera efter
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'rssi' | 'battery')}
            aria-label="Sortera beacons"
            style={{
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="name">Namn</option>
            <option value="rssi">Signalstyrka</option>
            <option value="battery">Batteri</option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--spacing-md)',
        }}
      >
        {filteredAndSortedBeacons.map((beacon) => {
          const beaconId = beacon.beacon_id || beacon.id || '';
          return (
            <BeaconCard
              key={beaconId}
              beacon={{
                ...beacon,
                beacon_id: beaconId,
              }}
              onClick={() => setSelectedBeacon(selectedBeacon === beaconId ? null : beaconId)}
            />
          );
        })}
      </div>

      {/* Visa historik för vald beacon */}
      {selectedBeacon && (
        <div style={{ marginTop: 'var(--spacing-xl)' }}>
          <BeaconHistoryChart
            beaconId={selectedBeacon}
            beaconName={
              filteredAndSortedBeacons.find((b) => (b.beacon_id || b.id) === selectedBeacon)?.beacon_name ||
              filteredAndSortedBeacons.find((b) => (b.beacon_id || b.id) === selectedBeacon)?.name ||
              selectedBeacon
            }
            limit={100}
          />
        </div>
      )}

      {filteredAndSortedBeacons.length === 0 && (
        <div
          style={{
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          Inga beacons hittades med valda filter.
        </div>
      )}
    </div>
  );
};
