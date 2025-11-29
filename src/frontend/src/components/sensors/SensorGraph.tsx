/**
 * SensorGraph - Historisk graf med pedagogiska nivåmarkörer
 */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { useTheme } from '../../theme/ThemeProvider';

interface GraphLevel {
  min: number;
  max?: number;
  label: string;
  color: string;
}

interface SensorGraphProps {
  sensorId: string;
  data: Array<{ timestamp: string; value: number }>;
  metadata?: any;
  unit: string;
  graphLevels?: GraphLevel[];
}

export const SensorGraph: React.FC<SensorGraphProps> = ({
  data,
  metadata,
  unit,
  graphLevels,
}) => {
  const { colors } = useTheme();

  // Formatera data för Recharts
  const chartData = data.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    value: point.value,
    fullTime: point.timestamp,
  }));

  // Om inga graphLevels finns, använd normal_range från metadata
  let levels: GraphLevel[] = graphLevels || [];
  if (!levels.length && metadata?.normal_range) {
    levels = [
      {
        min: metadata.normal_range.min - 10,
        max: metadata.normal_range.min,
        label: 'Lågt',
        color: colors.warning,
      },
      {
        min: metadata.normal_range.min,
        max: metadata.normal_range.max,
        label: 'Normal',
        color: colors.success,
      },
      {
        min: metadata.normal_range.max,
        max: metadata.normal_range.max + 10,
        label: 'Högt',
        color: colors.warning,
      },
    ];
  }

  // Beräkna min/max för Y-axis
  const values = chartData.map((d) => d.value);
  const minValue = values.length > 0 ? Math.min(...values, 0) * 0.9 : 0;
  const maxValue = values.length > 0 ? Math.max(...values) * 1.1 : 100;

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          {/* Pedagogiska nivåmarkörer som bakgrund */}
          {levels.map((level, idx) => (
            <ReferenceArea
              key={idx}
              y1={level.min}
              y2={level.max || maxValue}
              fill={level.color}
              fillOpacity={0.1}
            />
          ))}
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
            domain={[minValue, maxValue]}
            label={{ value: unit, angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 'var(--radius-md)',
            }}
            formatter={(value: any) => [`${value} ${unit}`, 'Värde']}
            labelFormatter={(label) => `Tid: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={colors.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend för nivåmarkörer */}
      {levels.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            marginTop: 'var(--spacing-md)',
            flexWrap: 'wrap',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          {levels.map((level, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: level.color,
                  opacity: 0.3,
                  borderRadius: '2px',
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {level.label}: {level.min}
                {level.max !== undefined ? `–${level.max}` : '+'} {unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


