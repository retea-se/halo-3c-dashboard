/**
 * BACnetInstances - Tabell över alla BACnet instance numbers
 */
import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';

interface BACnetInstance {
  name: string;
  instanceNumber: number;
  objectType: string;
  description: string;
}

const BACNET_INSTANCES: BACnetInstance[] = [
  { name: 'Gunshot', instanceNumber: 1, objectType: 'Binary Input', description: 'Skottdetektion' },
  { name: 'Help', instanceNumber: 2, objectType: 'Binary Input', description: 'Nödrop' },
  { name: 'Vape', instanceNumber: 3, objectType: 'Binary Input', description: 'Vape-detektion' },
  { name: 'THC', instanceNumber: 4, objectType: 'Binary Input', description: 'THC-detektion' },
  { name: 'Masking', instanceNumber: 5, objectType: 'Binary Input', description: 'Maskeringsdetektion' },
  { name: 'Aggression', instanceNumber: 6, objectType: 'Binary Input', description: 'Aggression' },
  { name: 'Tamper', instanceNumber: 7, objectType: 'Binary Input', description: 'Manipulation' },
  { name: 'TVOC', instanceNumber: 8, objectType: 'Analog Input', description: 'Total VOC (ppb)' },
  { name: 'CO', instanceNumber: 10, objectType: 'Analog Input', description: 'Kolmonoxid (ppm)' },
  { name: 'AQI', instanceNumber: 11, objectType: 'Multi-state Input', description: 'Air Quality Index' },
  { name: 'Temp_C', instanceNumber: 14, objectType: 'Analog Input', description: 'Temperatur (°C)' },
  { name: 'Light', instanceNumber: 15, objectType: 'Analog Input', description: 'Ljusnivå (lux)' },
  { name: 'PM1', instanceNumber: 16, objectType: 'Analog Input', description: 'PM1.0 (µg/m³)' },
  { name: 'PM2.5', instanceNumber: 17, objectType: 'Analog Input', description: 'PM2.5 (µg/m³)' },
  { name: 'PM10', instanceNumber: 18, objectType: 'Analog Input', description: 'PM10 (µg/m³)' },
  { name: 'NH3', instanceNumber: 19, objectType: 'Analog Input', description: 'Ammoniak (ppm)' },
  { name: 'NO2', instanceNumber: 20, objectType: 'Analog Input', description: 'Kvävedioxid (ppb)' },
  { name: 'Sound', instanceNumber: 21, objectType: 'Analog Input', description: 'Ljudnivå (dB)' },
  { name: 'Pressure', instanceNumber: 22, objectType: 'Analog Input', description: 'Lufttryck (hPa)' },
  { name: 'Humidity', instanceNumber: 23, objectType: 'Analog Input', description: 'Relativ fuktighet (%)' },
  { name: 'CO2cal', instanceNumber: 25, objectType: 'Analog Input', description: 'CO2 kalibrerad (ppm)' },
  { name: 'Health_Index', instanceNumber: 26, objectType: 'Multi-state Input', description: 'Hälsoindex (0-5)' },
  { name: 'Motion', instanceNumber: 27, objectType: 'Binary Input', description: 'Rörelsedetektion' },
  { name: 'Smoking', instanceNumber: 30, objectType: 'Binary Input', description: 'Rökning' },
  { name: 'Humidity_Low', instanceNumber: 31, objectType: 'Analog Input', description: 'Låg fuktighet' },
  { name: 'Temp_C_Low', instanceNumber: 33, objectType: 'Analog Input', description: 'Låg temperatur' },
];

type SortField = 'name' | 'instanceNumber' | 'objectType';

export const BACnetInstances: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('instanceNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredAndSorted = useMemo(() => {
    let filtered = BACNET_INSTANCES.filter((instance) => {
      const query = searchQuery.toLowerCase();
      return (
        instance.name.toLowerCase().includes(query) ||
        instance.description.toLowerCase().includes(query) ||
        instance.objectType.toLowerCase().includes(query) ||
        instance.instanceNumber.toString().includes(query)
      );
    });

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'instanceNumber':
          aValue = a.instanceNumber;
          bValue = b.instanceNumber;
          break;
        case 'objectType':
          aValue = a.objectType.toLowerCase();
          bValue = b.objectType.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIndicator: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return null;
    return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <Card padding="md">
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
          BACnet Instance Numbers
        </h3>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--spacing-xs)',
          }}
        >
          Alla sensorer och events exponeras via BACnet med specifika instance numbers.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <input
          type="text"
          placeholder="Sök efter sensor, beskrivning eller instance number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Table */}
      <div
        style={{
          overflowX: 'auto',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <th
                style={{
                  padding: 'var(--spacing-sm)',
                  textAlign: 'left',
                  fontWeight: 600,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => handleSort('instanceNumber')}
              >
                Instance # <SortIndicator field="instanceNumber" />
              </th>
              <th
                style={{
                  padding: 'var(--spacing-sm)',
                  textAlign: 'left',
                  fontWeight: 600,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => handleSort('name')}
              >
                Namn <SortIndicator field="name" />
              </th>
              <th
                style={{
                  padding: 'var(--spacing-sm)',
                  textAlign: 'left',
                  fontWeight: 600,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => handleSort('objectType')}
              >
                Objekttyp <SortIndicator field="objectType" />
              </th>
              <th
                style={{
                  padding: 'var(--spacing-sm)',
                  textAlign: 'left',
                  fontWeight: 600,
                }}
              >
                Beskrivning
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Inga resultat hittades
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((instance) => (
                <tr
                  key={instance.instanceNumber}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <td
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontFamily: 'monospace',
                      fontWeight: 500,
                    }}
                  >
                    {instance.instanceNumber}
                  </td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{instance.name}</td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{instance.objectType}</td>
                  <td style={{ padding: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
                    {instance.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 'var(--spacing-sm)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        Totalt {filteredAndSorted.length} av {BACNET_INSTANCES.length} instance numbers
      </div>
    </Card>
  );
};

