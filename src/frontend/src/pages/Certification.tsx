/**
 * Certification - WELL/RESET Certifieringsöversikt
 *
 * Visar hur inomhusmiljön matchar WELL Building Standard och RESET-krav.
 */
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { apiService } from '../services/api';

interface CertificationMetric {
  id: string;
  name: string;
  description: string;
  currentValue: number | null;
  unit: string;
  wellRequirement: { min?: number; max?: number; target?: number };
  resetRequirement: { min?: number; max?: number; target?: number };
  status: 'compliant' | 'warning' | 'non-compliant' | 'unknown';
}

// WELL och RESET-krav baserat på officiella standarder
const CERTIFICATION_METRICS: CertificationMetric[] = [
  {
    id: 'co2',
    name: 'Koldioxid (CO₂)',
    description: 'CO₂-nivåer påverkar kognitiv funktion och produktivitet',
    currentValue: null,
    unit: 'ppm',
    wellRequirement: { max: 800 },  // WELL v2 Air A03
    resetRequirement: { max: 1000 },
    status: 'unknown'
  },
  {
    id: 'pm25',
    name: 'Partiklar PM2.5',
    description: 'Fina partiklar som kan tränga djupt in i lungorna',
    currentValue: null,
    unit: 'µg/m³',
    wellRequirement: { max: 15 },   // WELL v2 Air A01
    resetRequirement: { max: 35 },  // RESET Grade A
    status: 'unknown'
  },
  {
    id: 'pm10',
    name: 'Partiklar PM10',
    description: 'Grövre partiklar som påverkar andningsorganen',
    currentValue: null,
    unit: 'µg/m³',
    wellRequirement: { max: 50 },
    resetRequirement: { max: 50 },
    status: 'unknown'
  },
  {
    id: 'tvoc',
    name: 'TVOC',
    description: 'Flyktiga organiska föreningar från material och produkter',
    currentValue: null,
    unit: 'ppb',
    wellRequirement: { max: 500 },
    resetRequirement: { max: 400 },
    status: 'unknown'
  },
  {
    id: 'temperature',
    name: 'Temperatur',
    description: 'Termisk komfort för produktivitet och välbefinnande',
    currentValue: null,
    unit: '°C',
    wellRequirement: { min: 20, max: 26 },  // WELL v2 Thermal Comfort
    resetRequirement: { min: 18, max: 28 },
    status: 'unknown'
  },
  {
    id: 'humidity',
    name: 'Relativ luftfuktighet',
    description: 'Påverkar komfort och mikrobiell tillväxt',
    currentValue: null,
    unit: '%',
    wellRequirement: { min: 30, max: 60 },  // WELL v2 Humidity
    resetRequirement: { min: 25, max: 65 },
    status: 'unknown'
  },
  {
    id: 'light',
    name: 'Ljusnivå',
    description: 'Tillräckligt ljus för visuella uppgifter',
    currentValue: null,
    unit: 'lux',
    wellRequirement: { min: 300 },  // WELL v2 Light L01 (för kontorsarbete)
    resetRequirement: { min: 200 },
    status: 'unknown'
  },
  {
    id: 'sound',
    name: 'Ljudnivå',
    description: 'Akustisk komfort för koncentration',
    currentValue: null,
    unit: 'dB',
    wellRequirement: { max: 50 },  // WELL v2 Sound S01 (kontor öppen planlösning)
    resetRequirement: { max: 55 },
    status: 'unknown'
  },
];

// Mappning av sensor-ID till certification metric
const SENSOR_MAPPING: Record<string, string> = {
  'co2sensor/co2': 'co2',
  'co2sensor/co2fo': 'co2',
  'pmsensor/pm2p5conc': 'pm25',
  'pmsensor/raw/1': 'pm25',
  'pmsensor/pm10conc': 'pm10',
  'pmsensor/raw/2': 'pm10',
  'co2sensor/tvoc': 'tvoc',
  'htsensor/ctemp': 'temperature',
  'htsensor/humidity': 'humidity',
  'luxsensor/aluxfilt': 'light',
  'luxsensor/alux': 'light',
  'audsensor/sum': 'sound',
};

const getStatus = (
  value: number | null,
  requirement: { min?: number; max?: number; target?: number }
): 'compliant' | 'warning' | 'non-compliant' | 'unknown' => {
  if (value === null) return 'unknown';

  const { min, max } = requirement;
  const margin = 0.1; // 10% marginal för varning

  if (min !== undefined && max !== undefined) {
    if (value >= min && value <= max) return 'compliant';
    const range = max - min;
    if (value >= min - range * margin && value <= max + range * margin) return 'warning';
    return 'non-compliant';
  } else if (max !== undefined) {
    if (value <= max) return 'compliant';
    if (value <= max * (1 + margin)) return 'warning';
    return 'non-compliant';
  } else if (min !== undefined) {
    if (value >= min) return 'compliant';
    if (value >= min * (1 - margin)) return 'warning';
    return 'non-compliant';
  }

  return 'unknown';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'compliant':
      return '#22c55e';
    case 'warning':
      return '#f59e0b';
    case 'non-compliant':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'compliant':
      return 'Uppfyllt';
    case 'warning':
      return 'Varning';
    case 'non-compliant':
      return 'Ej uppfyllt';
    default:
      return 'Ingen data';
  }
};

export const Certification: React.FC = () => {
  const [metrics, setMetrics] = useState<CertificationMetric[]>(CERTIFICATION_METRICS);
  const [loading, setLoading] = useState(true);
  const [selectedStandard, setSelectedStandard] = useState<'well' | 'reset'>('well');

  useEffect(() => {
    const loadSensorData = async () => {
      try {
        setLoading(true);
        const response = await apiService.getLatestSensors();
        const sensors = response.sensors || [];

        // Uppdatera metrics med aktuella sensorvärden
        const updatedMetrics = metrics.map(metric => {
          const matchingSensor = sensors.find((s: any) =>
            SENSOR_MAPPING[s.sensor_id] === metric.id
          );

          if (matchingSensor) {
            const value = Object.values(matchingSensor.values)[0] as number;
            const requirement = selectedStandard === 'well'
              ? metric.wellRequirement
              : metric.resetRequirement;

            return {
              ...metric,
              currentValue: value,
              status: getStatus(value, requirement)
            };
          }
          return metric;
        });

        setMetrics(updatedMetrics);
      } catch (error) {
        console.error('Failed to load sensor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSensorData();
    const interval = setInterval(loadSensorData, 30000);
    return () => clearInterval(interval);
  }, [selectedStandard]);

  // Beräkna compliance-statistik
  const complianceStats = {
    total: metrics.length,
    compliant: metrics.filter(m => m.status === 'compliant').length,
    warning: metrics.filter(m => m.status === 'warning').length,
    nonCompliant: metrics.filter(m => m.status === 'non-compliant').length,
    unknown: metrics.filter(m => m.status === 'unknown').length,
  };

  const compliancePercentage = complianceStats.total > 0
    ? Math.round((complianceStats.compliant / (complianceStats.total - complianceStats.unknown)) * 100) || 0
    : 0;

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>
          Inomhusmiljöcertifiering
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Övervakning av WELL Building Standard och RESET Air-krav i realtid.
        </p>
      </div>

      {/* Standard-väljare */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            onClick={() => setSelectedStandard('well')}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              backgroundColor: selectedStandard === 'well' ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
              color: selectedStandard === 'well' ? 'white' : 'var(--color-text-primary)',
              border: `1px solid ${selectedStandard === 'well' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            WELL Building Standard v2
          </button>
          <button
            onClick={() => setSelectedStandard('reset')}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              backgroundColor: selectedStandard === 'reset' ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
              color: selectedStandard === 'reset' ? 'white' : 'var(--color-text-primary)',
              border: `1px solid ${selectedStandard === 'reset' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            RESET Air Standard
          </button>
        </div>
      </div>

      {/* Compliance-översikt */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <Card padding="md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--spacing-xs)' }}>
            {loading ? '...' : `${compliancePercentage}%`}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Total efterlevnad
          </div>
        </Card>

        <Card padding="md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 700, color: '#22c55e', marginBottom: 'var(--spacing-xs)' }}>
            {complianceStats.compliant}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Uppfyllda krav
          </div>
        </Card>

        <Card padding="md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 700, color: '#f59e0b', marginBottom: 'var(--spacing-xs)' }}>
            {complianceStats.warning}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Varningar
          </div>
        </Card>

        <Card padding="md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 700, color: '#ef4444', marginBottom: 'var(--spacing-xs)' }}>
            {complianceStats.nonCompliant}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Ej uppfyllda
          </div>
        </Card>
      </div>

      {/* Detaljerade metrics */}
      <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-lg)' }}>
        Detaljerad översikt - {selectedStandard === 'well' ? 'WELL v2' : 'RESET Air'}
      </h2>

      <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
        {metrics.map(metric => {
          const requirement = selectedStandard === 'well'
            ? metric.wellRequirement
            : metric.resetRequirement;

          return (
            <Card key={metric.id} padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)' }}>{metric.name}</h3>
                    <span
                      style={{
                        padding: '2px 8px',
                        backgroundColor: `${getStatusColor(metric.status)}20`,
                        color: getStatusColor(metric.status),
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 500,
                      }}
                    >
                      {getStatusLabel(metric.status)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {metric.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-xl)', alignItems: 'center' }}>
                  {/* Aktuellt värde */}
                  <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>
                      Aktuellt
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: getStatusColor(metric.status) }}>
                      {metric.currentValue !== null ? metric.currentValue.toFixed(1) : '—'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                      {metric.unit}
                    </div>
                  </div>

                  {/* Krav */}
                  <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>
                      Krav
                    </div>
                    <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                      {requirement.min !== undefined && requirement.max !== undefined
                        ? `${requirement.min}–${requirement.max}`
                        : requirement.max !== undefined
                          ? `≤ ${requirement.max}`
                          : requirement.min !== undefined
                            ? `≥ ${requirement.min}`
                            : '—'
                      }
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                      {metric.unit}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Information om standarder */}
      <div style={{ marginTop: 'var(--spacing-2xl)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
        <Card padding="md" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h4 style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>
            WELL Building Standard v2
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            WELL är en prestationsbaserad standard för att mäta, certifiera och övervaka
            funktioner i den byggda miljön som påverkar mänsklig hälsa och välbefinnande.
          </p>
          <a
            href="https://www.wellcertified.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}
          >
            Läs mer om WELL →
          </a>
        </Card>

        <Card padding="md" style={{ borderLeft: '4px solid #22c55e' }}>
          <h4 style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>
            RESET Air Standard
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            RESET är en datadrivent certifieringsstandard för inomhusmiljö som fokuserar
            på kontinuerlig övervakning av luftkvalitet i realtid.
          </p>
          <a
            href="https://www.reset.build/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}
          >
            Läs mer om RESET →
          </a>
        </Card>
      </div>
    </div>
  );
};
