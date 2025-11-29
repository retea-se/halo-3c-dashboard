/**
 * Sensor Info Overview - Lista alla sensorer med kategori-filtrering
 */
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { apiService } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';

interface SensorMetadata {
  id: string;
  technical_name?: string;
  display_name: string;
  short_description: string;
  category: string;
  unit: string;
  icon: string;
  normal_range?: {
    min: number;
    max: number;
  };
}

export const SensorInfoOverview: React.FC = () => {
  const [sensors, setSensors] = useState<SensorMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { colors } = useTheme();

  useEffect(() => {
    const loadSensors = async () => {
      try {
        setLoading(true);
        const metadata = await apiService.getSensorMetadata();
        setSensors(metadata || []);
      } catch (error) {
        console.error('Failed to load sensor metadata:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSensors();
  }, []);

  // Extrahera unika kategorier
  const categories = useMemo(() => {
    const cats = new Set<string>();
    sensors.forEach((sensor) => {
      if (sensor.category) {
        cats.add(sensor.category);
      }
    });
    return Array.from(cats).sort();
  }, [sensors]);

  // Filtrera sensorer baserat på kategori
  const filteredSensors = useMemo(() => {
    if (selectedCategory === 'all') {
      return sensors;
    }
    return sensors.filter((sensor) => sensor.category === selectedCategory);
  }, [sensors, selectedCategory]);

  // Gruppera sensorer per kategori (för visning)
  const sensorsByCategory = useMemo(() => {
    const grouped: Record<string, SensorMetadata[]> = {};
    filteredSensors.forEach((sensor) => {
      const category = sensor.category || 'Övrigt';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(sensor);
    });
    return grouped;
  }, [filteredSensors]);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1400px', margin: '0 auto' }}>
        <div>Laddar sensorer...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Sensor Information</h1>
      <p
        style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        Här hittar du information om alla sensorer i Halo 3C, inklusive förklaringar, normalvärden och
        vanliga frågor.
      </p>

      {/* Kategori-filter */}
      <Card padding="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 600, marginRight: 'var(--spacing-xs)' }}>Filter:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: selectedCategory === 'all' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: selectedCategory === 'all' ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
              cursor: 'pointer',
              fontWeight: selectedCategory === 'all' ? 600 : 400,
            }}
          >
            Alla
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor:
                  selectedCategory === category ? 'var(--color-primary)' : 'var(--color-surface)',
                color:
                  selectedCategory === category ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
                cursor: 'pointer',
                fontWeight: selectedCategory === category ? 600 : 400,
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </Card>

      {/* Sensor-grid grupperat per kategori */}
      {Object.entries(sensorsByCategory).map(([category, categorySensors]) => (
        <div key={category} style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 600,
              marginBottom: 'var(--spacing-md)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {category}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--spacing-md)',
            }}
          >
            {categorySensors.map((sensor) => (
              <Link
                key={sensor.id}
                to={`/sensors/info/${encodeURIComponent(sensor.id || sensor.technical_name || '')}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Card padding="md" style={{ cursor: 'pointer', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
                    <Icon
                      name={sensor.icon || 'sensor-icon'}
                      size={32}
                      color={colors.text.secondary}
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontSize: 'var(--font-size-md)',
                          fontWeight: 600,
                          margin: 0,
                          marginBottom: 'var(--spacing-xs)',
                        }}
                      >
                        {sensor.display_name}
                      </h3>
                      <p
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-secondary)',
                          margin: 0,
                          marginBottom: 'var(--spacing-xs)',
                        }}
                      >
                        {sensor.short_description}
                      </p>
                      {sensor.normal_range && (
                        <div
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-secondary)',
                            marginTop: 'var(--spacing-xs)',
                          }}
                        >
                          Normal: {sensor.normal_range.min}–{sensor.normal_range.max} {sensor.unit}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {filteredSensors.length === 0 && (
        <Card padding="lg" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Inga sensorer hittades med vald kategori.
          </p>
        </Card>
      )}
    </div>
  );
};


