/**
 * Sparkline - Mini-graf för att visa trend över tid
 */
import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export interface SparklineDataPoint {
  timestamp: number;
  value: number;
}

interface SparklineProps {
  data: SparklineDataPoint[];
  trend?: 'up' | 'down' | 'stable';
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  trend = 'stable',
  width = 80,
  height = 20,
}) => {
  const { colors } = useTheme();

  if (!data || data.length < 2) {
    // Visa tom sparkline om inte tillräckligt med data
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={colors.text.secondary}
          strokeWidth="1"
          opacity={0.3}
        />
      </svg>
    );
  }

  // Beräkna min/max för normalisering
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1; // Undvik division med noll

  // Padding för att undvika att linjen går till kanten
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Skapa SVG path
  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const normalizedValue = (point.value - minValue) / valueRange;
    // Invertera y-axel (SVG har y=0 överst)
    const y = padding + chartHeight - normalizedValue * chartHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  // Färg baserat på trend
  const getColor = () => {
    switch (trend) {
      case 'up':
        return colors.error || '#ef4444';
      case 'down':
        return colors.success || '#22c55e';
      default:
        return colors.text.secondary || '#6b7280';
    }
  };

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path
        d={pathData}
        fill="none"
        stroke={getColor()}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
};

