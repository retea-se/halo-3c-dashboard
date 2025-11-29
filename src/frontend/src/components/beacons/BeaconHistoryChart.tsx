/**
 * BeaconHistoryChart - Graf över beacon närvarohistorik (RSSI över tid)
 */
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { apiService } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../ui/Card';

interface BeaconHistoryChartProps {
  beaconId: string;
  beaconName?: string;
  fromTime?: string;
  toTime?: string;
  limit?: number;
}

export const BeaconHistoryChart: React.FC<BeaconHistoryChartProps> = ({
  beaconId,
  beaconName,
  fromTime,
  toTime,
  limit = 100,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const history = await apiService.getBeaconHistory(beaconId, fromTime, toTime, limit);
        setData(history || []);
      } catch (error) {
        console.error('Failed to load beacon history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [beaconId, fromTime, toTime, limit]);

  // Formatera data för Recharts
  const chartData = data.map((point) => ({
    time: new Date(point.timestamp || point.time || point._time).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    rssi: point.rssi || point._value,
    battery: point.battery,
    fullTime: point.timestamp || point.time || point._time,
  }));

  // RSSI-tröskelvärden för närvaro
  const PRESENCE_THRESHOLD = -80; // dBm

  // Beräkna min/max för Y-axis
  const rssiValues = chartData.map((d) => d.rssi).filter((v) => v != null);
  const minRssi = rssiValues.length > 0 ? Math.min(...rssiValues) - 10 : -100;
  const maxRssi = rssiValues.length > 0 ? Math.max(...rssiValues) + 10 : -30;

  if (loading) {
    return (
      <Card padding="md">
        <div>Laddar historik...</div>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card padding="md">
        <div style={{ color: 'var(--color-text-secondary)' }}>Ingen historik tillgänglig</div>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
        Närvarohistorik {beaconName ? `- ${beaconName}` : ''}
      </h3>
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis
              dataKey="time"
              stroke={colors.text.secondary}
              style={{ fontSize: '12px' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke={colors.text.secondary}
              style={{ fontSize: '12px' }}
              domain={[minRssi, maxRssi]}
              label={{ value: 'RSSI (dBm)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 'var(--radius-md)',
              }}
              formatter={(value: any, name: string) => {
                if (name === 'rssi') return [`${value} dBm`, 'Signalstyrka'];
                if (name === 'battery') return [`${value}%`, 'Batteri'];
                return [value, name];
              }}
              labelFormatter={(label) => `Tid: ${label}`}
            />
            {/* Referenslinje för närvaro-tröskel */}
            <ReferenceLine
              y={PRESENCE_THRESHOLD}
              stroke={colors.warning}
              strokeDasharray="5 5"
              label={{ value: 'Närvaro-tröskel', position: 'right', style: { fontSize: '10px' } }}
            />
            <Line
              type="monotone"
              dataKey="rssi"
              stroke={colors.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="rssi"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend och förklaring */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          marginTop: 'var(--spacing-md)',
          flexWrap: 'wrap',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <div
            style={{
              width: '12px',
              height: '2px',
              backgroundColor: colors.primary,
            }}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>RSSI (Signalstyrka)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <div
            style={{
              width: '12px',
              height: '2px',
              backgroundColor: colors.warning,
              borderStyle: 'dashed',
            }}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>
            Närvaro-tröskel (-80 dBm)
          </span>
        </div>
        <div style={{ color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
          RSSI &gt; -80 dBm = Närvarande | RSSI &lt; -80 dBm = Ej närvarande
        </div>
      </div>
    </Card>
  );
};
