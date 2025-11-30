/**
 * Utilization - Utrymmesutnyttjande-statistik
 *
 * Visar hur rummet används över tid baserat på närvarodata.
 */
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { apiService, OccupancyHistory } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useTheme } from '../theme/ThemeProvider';

interface HourlyStats {
  hour: number;
  occupiedMinutes: number;
  percentage: number;
}

interface DailyStats {
  date: string;
  occupiedHours: number;
  percentage: number;
}

const TIME_RANGES = [
  { label: '24 timmar', hours: 24 },
  { label: '7 dagar', hours: 168 },
  { label: '30 dagar', hours: 720 },
];

export const Utilization: React.FC = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(168); // Default 7 dagar
  const [occupancyHistory, setOccupancyHistory] = useState<OccupancyHistory | null>(null);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [weekdayStats, setWeekdayStats] = useState<{ day: string; percentage: number }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const history = await apiService.getOccupancyHistory(undefined, timeRange);
        setOccupancyHistory(history);

        // Beräkna timbaserad statistik
        const hourlyData: Record<number, { occupied: number; total: number }> = {};
        for (let h = 0; h < 24; h++) {
          hourlyData[h] = { occupied: 0, total: 0 };
        }

        // Beräkna veckodagsstatistik
        const weekdayData: Record<number, { occupied: number; total: number }> = {};
        for (let d = 0; d < 7; d++) {
          weekdayData[d] = { occupied: 0, total: 0 };
        }

        history.history.forEach((entry) => {
          const date = new Date(entry.timestamp);
          const hour = date.getHours();
          const day = date.getDay();

          hourlyData[hour].total++;
          weekdayData[day].total++;

          if (entry.state === 'occupied') {
            hourlyData[hour].occupied++;
            weekdayData[day].occupied++;
          }
        });

        // Konvertera till arrays
        const hourlyArray: HourlyStats[] = Object.entries(hourlyData).map(([hour, data]) => ({
          hour: parseInt(hour),
          occupiedMinutes: data.occupied,
          percentage: data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0,
        }));
        setHourlyStats(hourlyArray);

        const weekdays = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
        const weekdayArray = Object.entries(weekdayData).map(([day, data]) => ({
          day: weekdays[parseInt(day)],
          percentage: data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0,
        }));
        setWeekdayStats(weekdayArray);

      } catch (error) {
        console.error('Failed to load occupancy data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  // Beräkna sammanfattande statistik
  const stats = occupancyHistory?.statistics || {
    occupied_percentage: 0,
    sample_count: 0,
    last_change: null,
  };

  // Uppskatta peak-timmar
  const peakHours = [...hourlyStats]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)
    .map(h => `${h.hour.toString().padStart(2, '0')}:00`);

  // Mest/minst använda dagar
  const sortedWeekdays = [...weekdayStats].sort((a, b) => b.percentage - a.percentage);
  const busiestDay = sortedWeekdays[0]?.day || '-';
  const quietestDay = sortedWeekdays[sortedWeekdays.length - 1]?.day || '-';

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>
          Utrymmesutnyttjande
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Analysera hur rummet används över tid baserat på närvaro- och aktivitetsdata.
        </p>
      </div>

      {/* Tidsintervallväljare */}
      <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-sm)' }}>
        {TIME_RANGES.map(range => (
          <button
            key={range.hours}
            onClick={() => setTimeRange(range.hours)}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              backgroundColor: timeRange === range.hours ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
              color: timeRange === range.hours ? 'white' : 'var(--color-text-primary)',
              border: `1px solid ${timeRange === range.hours ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {range.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
          Laddar data...
        </div>
      ) : (
        <>
          {/* Sammanfattning */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
            <Card padding="md" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--spacing-xs)' }}>
                {Math.round(stats.occupied_percentage)}%
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Genomsnittligt utnyttjande
              </div>
            </Card>

            <Card padding="md" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 700, color: '#22c55e', marginBottom: 'var(--spacing-xs)' }}>
                {stats.sample_count}
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Mätpunkter
              </div>
            </Card>

            <Card padding="md" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b', marginBottom: 'var(--spacing-xs)' }}>
                {peakHours.join(', ') || '-'}
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Peak-timmar
              </div>
            </Card>

            <Card padding="md" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6', marginBottom: 'var(--spacing-xs)' }}>
                {busiestDay} / {quietestDay}
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Mest / Minst aktiv dag
              </div>
            </Card>
          </div>

          {/* Grafer */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-lg)' }}>
            {/* Timbaserad statistik */}
            <Card padding="md">
              <h3 style={{ margin: 0, marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-md)' }}>
                Utnyttjande per timme
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis
                      dataKey="hour"
                      stroke={colors.text.secondary}
                      tickFormatter={(h) => `${h.toString().padStart(2, '0')}:00`}
                    />
                    <YAxis
                      stroke={colors.text.secondary}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Utnyttjande']}
                      labelFormatter={(h) => `${h.toString().padStart(2, '0')}:00`}
                    />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke={colors.primary}
                      fill={`${colors.primary}40`}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Veckodagsstatistik */}
            <Card padding="md">
              <h3 style={{ margin: 0, marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-md)' }}>
                Utnyttjande per veckodag
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis dataKey="day" stroke={colors.text.secondary} />
                    <YAxis
                      stroke={colors.text.secondary}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Utnyttjande']}
                    />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {weekdayStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.percentage > 50 ? colors.primary : `${colors.primary}80`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Historik-graf */}
          {occupancyHistory && occupancyHistory.history.length > 0 && (
            <Card padding="md" style={{ marginTop: 'var(--spacing-lg)' }}>
              <h3 style={{ margin: 0, marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-md)' }}>
                Närvarohistorik
              </h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={occupancyHistory.history.map(h => ({
                      time: new Date(h.timestamp).getTime(),
                      score: h.score,
                      occupied: h.state === 'occupied' ? 1 : 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      stroke={colors.text.secondary}
                      tickFormatter={(t) => new Date(t).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke={colors.text.secondary}
                      domain={[0, 1]}
                      ticks={[0, 0.5, 1]}
                      tickFormatter={(v) => v === 1 ? 'Belagt' : v === 0 ? 'Ledigt' : ''}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                      }}
                      labelFormatter={(t) => new Date(t).toLocaleString('sv-SE')}
                      formatter={(value: number, name: string) => [
                        name === 'occupied' ? (value === 1 ? 'Belagt' : 'Ledigt') : value.toFixed(2),
                        name === 'occupied' ? 'Status' : 'Score'
                      ]}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="occupied"
                      stroke={colors.success}
                      fill={`${colors.success}40`}
                      strokeWidth={1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Insikter */}
          <div style={{ marginTop: 'var(--spacing-xl)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-lg)' }}>
              Insikter
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
              <Card padding="md" style={{ borderLeft: '4px solid #22c55e' }}>
                <h4 style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>
                  Optimeringsmöjlighet
                </h4>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {stats.occupied_percentage < 30
                    ? 'Lågt utnyttjande kan indikera möjlighet att dela utrymmet med andra eller minska lokalytan.'
                    : stats.occupied_percentage > 80
                      ? 'Högt utnyttjande - överväg att utöka kapaciteten eller förbättra bokningssystemet.'
                      : 'Utnyttjandegraden är balanserad. Fokusera på att optimera peak-tider.'
                  }
                </p>
              </Card>

              <Card padding="md" style={{ borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>
                  Energioptimering
                </h4>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  Baserat på användningsmönster kan ventilation och belysning optimeras för tiderna
                  med lägst aktivitet, särskilt mellan kl. 22:00-06:00.
                </p>
              </Card>

              <Card padding="md" style={{ borderLeft: '4px solid #f59e0b' }}>
                <h4 style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>
                  Kapacitetsplanering
                </h4>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  Peak-timmarna ({peakHours.join(', ') || 'inte identifierade'}) kan användas för att
                  planera underhåll och städning under lågtrafik.
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
