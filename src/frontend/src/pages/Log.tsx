/**
 * Log Page - Visar rådata från InfluxDB
 */
import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiService } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';

interface LogEntry {
  timestamp: string;
  measurement: string;
  id: string;
  value: any;
  tags: Record<string, any>;
  fields: Record<string, any>;
}

interface LogDataResponse {
  data: LogEntry[];
  total: number;
  measurement: string;
  hours: number;
}

type SortField = 'timestamp' | 'measurement' | 'id' | 'value';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZES = [25, 50, 75, 100, 250, 'Alla'] as const;
type PageSize = typeof PAGE_SIZES[number];

export const Log: React.FC = () => {
  const { colors } = useTheme();
  const [logData, setLogData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>('all');
  const [hours, setHours] = useState(24);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Hantera skärmstorlek
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ladda log-data
  const loadLogData = async () => {
    try {
      setLoading(true);
      const limit = pageSize === 'Alla' ? 10000 : pageSize;
      const response: LogDataResponse = await apiService.getLogData(
        selectedMeasurement === 'all' ? undefined : selectedMeasurement,
        hours,
        limit
      );
      setLogData(response.data || []);
      setCurrentPage(1); // Reset till första sidan vid ny data
    } catch (error) {
      console.error('Failed to load log data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMeasurement, hours, pageSize]);

  // Sortera data
  const sortedData = useMemo(() => {
    const sorted = [...logData].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'timestamp':
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        case 'measurement':
          aVal = a.measurement.toLowerCase();
          bVal = b.measurement.toLowerCase();
          break;
        case 'id':
          aVal = a.id.toLowerCase();
          bVal = b.id.toLowerCase();
          break;
        case 'value':
          aVal = a.value;
          bVal = b.value;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [logData, sortField, sortDirection]);

  // Paginering
  const paginatedData = useMemo(() => {
    if (pageSize === 'Alla') {
      return sortedData;
    }
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = pageSize === 'Alla' ? 1 : Math.ceil(sortedData.length / pageSize);
  const startIndex = pageSize === 'Alla' ? 1 : (currentPage - 1) * pageSize + 1;
  const endIndex = pageSize === 'Alla' ? sortedData.length : Math.min(currentPage * pageSize, sortedData.length);

  // Sortering
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle expanderad rad
  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Export till JSON
  const exportToJSON = () => {
    const dataStr = JSON.stringify(paginatedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export till CSV
  const exportToCSV = () => {
    const headers = ['Timestamp', 'Measurement', 'ID', 'Value', 'Tags', 'Fields'];
    const rows = paginatedData.map(entry => [
      entry.timestamp,
      entry.measurement,
      entry.id,
      entry.value?.toString() || '',
      JSON.stringify(entry.tags),
      JSON.stringify(entry.fields)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell?.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Formatera värde
  const formatValue = (entry: LogEntry): string => {
    if (entry.measurement === 'events' && entry.fields.summary) {
      return entry.fields.summary;
    }
    if (entry.value !== null && entry.value !== undefined) {
      if (typeof entry.value === 'number') {
        return entry.value.toFixed(2);
      }
      return entry.value.toString();
    }
    return '-';
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1600px', margin: '0 auto' }}>
        <div>Laddar log-data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Logg</h1>

      {/* Kontroller */}
      <Card padding="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--spacing-md)',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {/* Measurement filter */}
          <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)'
            }}>
              Measurement
            </label>
            <select
              value={selectedMeasurement}
              onChange={(e) => setSelectedMeasurement(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <option value="all">Alla</option>
              <option value="events">Events</option>
              <option value="sensor">Sensor-data</option>
              <option value="beacon_presence">Beacon-data</option>
              <option value="heartbeat">Heartbeat</option>
            </select>
          </div>

          {/* Tidsperiod */}
          <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)'
            }}>
              Tidsperiod
            </label>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <option value={1}>Senaste timmen</option>
              <option value={6}>Senaste 6 timmarna</option>
              <option value={24}>Senaste 24 timmarna</option>
              <option value={168}>Senaste 7 dagarna</option>
            </select>
          </div>

          {/* Paginering - sidstorlek */}
          <div style={{ flex: '1 1 150px', minWidth: '120px' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)'
            }}>
              Per sida
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value as PageSize);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              {PAGE_SIZES.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          {/* Export-knappar */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            flex: '1 1 auto',
            justifyContent: isMobile ? 'stretch' : 'flex-end',
            marginTop: isMobile ? 'var(--spacing-sm)' : 0,
            width: isMobile ? '100%' : 'auto'
          }}>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToJSON}
              style={{ flex: isMobile ? '1' : 'none', minWidth: isMobile ? '0' : 'auto' }}
            >
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              style={{ flex: isMobile ? '1' : 'none', minWidth: isMobile ? '0' : 'auto' }}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Info */}
      <div style={{
        marginBottom: 'var(--spacing-md)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)'
      }}>
        Visar {startIndex}-{endIndex} av {sortedData.length} rader
      </div>

      {/* Tabell */}
      <Card padding="none" style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch' // Smooth scroll på iOS
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: isMobile ? '600px' : '800px' // Mindre minimum på mobil
        }}>
          <thead>
            <tr style={{
              borderBottom: '2px solid var(--color-border)',
              backgroundColor: 'var(--color-background-secondary)'
            }}>
              <th
                style={{
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('timestamp')}
              >
                Timestamp{' '}
                {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                style={{
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('measurement')}
              >
                Measurement{' '}
                {sortField === 'measurement' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                style={{
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('id')}
              >
                ID{' '}
                {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                style={{
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleSort('value')}
              >
                Value{' '}
                {sortField === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{
                padding: isMobile ? 'var(--spacing-sm)' : 'var(--spacing-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                width: isMobile ? '40px' : '60px'
              }}>
                {isMobile ? '▼' : 'Detaljer'}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{
                  padding: 'var(--spacing-xl)',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)'
                }}>
                  Ingen data hittades
                </td>
              </tr>
            ) : (
              paginatedData.map((entry, index) => {
                const globalIndex = pageSize === 'Alla' ? index : (currentPage - 1) * pageSize + index;
                const isExpanded = expandedRows.has(globalIndex);
                return (
                  <React.Fragment key={`${entry.timestamp}-${entry.measurement}-${entry.id}-${index}`}>
                    <tr style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? 'var(--color-background-secondary)' : 'transparent'
                    }}
                    onClick={() => toggleRow(globalIndex)}
                    >
                      <td style={{
                        padding: isMobile ? 'var(--spacing-sm)' : 'var(--spacing-md)',
                        fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                        whiteSpace: 'nowrap'
                      }}>
                        {isMobile
                          ? new Date(entry.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
                          : new Date(entry.timestamp).toLocaleString('sv-SE')
                        }
                      </td>
                      <td style={{
                        padding: isMobile ? 'var(--spacing-sm)' : 'var(--spacing-md)',
                        fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)'
                      }}>
                        {isMobile ? entry.measurement.replace('sensor_', '') : entry.measurement}
                      </td>
                      <td style={{
                        padding: isMobile ? 'var(--spacing-sm)' : 'var(--spacing-md)',
                        fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                        wordBreak: 'break-word',
                        maxWidth: isMobile ? '120px' : '200px'
                      }}>
                        {isMobile && entry.id.length > 15
                          ? `${entry.id.substring(0, 12)}...`
                          : entry.id
                        }
                      </td>
                      <td style={{
                        padding: isMobile ? 'var(--spacing-sm)' : 'var(--spacing-md)',
                        fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                        wordBreak: 'break-word',
                        maxWidth: isMobile ? '100px' : '200px'
                      }}>
                        {isMobile && formatValue(entry).length > 15
                          ? `${formatValue(entry).substring(0, 12)}...`
                          : formatValue(entry)
                        }
                      </td>
                      <td style={{
                        padding: isMobile ? 'var(--spacing-sm)' : 'var(--spacing-md)',
                        textAlign: 'center',
                        fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)'
                      }}>
                        {isExpanded ? '▼' : '▶'}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} style={{
                          padding: 'var(--spacing-md)',
                          backgroundColor: 'var(--color-background-secondary)',
                          fontSize: 'var(--font-size-xs)'
                        }}>
                          <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <strong>Tags:</strong>
                            <pre style={{
                              marginTop: 'var(--spacing-xs)',
                              padding: 'var(--spacing-sm)',
                              backgroundColor: 'var(--color-background)',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'auto',
                              fontSize: 'var(--font-size-xs)'
                            }}>
                              {JSON.stringify(entry.tags, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <strong>Fields:</strong>
                            <pre style={{
                              marginTop: 'var(--spacing-xs)',
                              padding: 'var(--spacing-sm)',
                              backgroundColor: 'var(--color-background)',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'auto',
                              fontSize: 'var(--font-size-xs)'
                            }}>
                              {JSON.stringify(entry.fields, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Paginering */}
      {pageSize !== 'Alla' && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginTop: 'var(--spacing-lg)',
          flexWrap: 'wrap'
        }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            Första
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Föregående
          </Button>
          <span style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            padding: '0 var(--spacing-sm)'
          }}>
            Sida {currentPage} av {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Nästa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Sista
          </Button>
        </div>
      )}
    </div>
  );
};

