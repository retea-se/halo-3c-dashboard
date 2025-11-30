/**
 * Events Page - Visar alla events med sortering, filtrering och acknowledge
 */
import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';

interface Event {
  id: string;
  timestamp: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  source: string;
  summary: string;
  details: any;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  device_id: string;
  sensor_metadata_id?: string;
}

type SortField = 'timestamp' | 'severity' | 'type' | 'status';
type SortDirection = 'asc' | 'desc';

export const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState({
    severity: '' as string,
    status: '' as string,
    type: '' as string,
  });
  const { toasts, showToast, removeToast } = useToast();

  // WebSocket connection för real-time events
  // Dynamisk URL-konstruktion baserat på window.location
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.hostname;

  // Hämta JWT-token från sessionStorage för WebSocket-autentisering
  const wsToken = sessionStorage.getItem('tekniklokaler_auth_token');

  // Om vi är i produktion (inte localhost), använd relativa URL
  // så att nginx kan proxya WebSocket till backend
  // Annars använd samma port som frontend (för utveckling)
  let wsUrl: string;
  if (wsHost !== 'localhost' && wsHost !== '127.0.0.1') {
    // Produktion med nginx proxy: använd relativa URL
    // Nginx proxar /api/events/stream till backend:8000
    wsUrl = `${wsProtocol}//${wsHost}${window.location.port ? `:${window.location.port}` : ''}/api/events/stream`;
  } else {
    // Utveckling: använd samma host och port
    const defaultPort = window.location.protocol === 'https:' ? '443' : '80';
    const wsPort = window.location.port || defaultPort;
    const portSuffix = wsPort && wsPort !== '80' && wsPort !== '443' ? `:${wsPort}` : '';
    wsUrl = `${wsProtocol}//${wsHost}${portSuffix}/api/events/stream`;
  }
  // Lägg till token som query parameter för autentisering
  const wsUrlWithAuth = wsToken ? `${wsUrl}?token=${wsToken}` : wsUrl;
  const { lastMessage } = useWebSocket(wsUrlWithAuth);

  // Ladda events
  const loadEvents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;

      const data = await apiService.getEvents(params);
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
      showToast('Kunde inte ladda events', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // Uppdatera varje 30 sekunder
    const interval = setInterval(loadEvents, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  // Hantera WebSocket events
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'new_event') {
          const event = data.event;
          // Lägg till nytt event i listan
          setEvents((prev) => [event, ...prev]);
          // Visa toast för kritiska events
          if (event.severity === 'CRITICAL' || event.severity === 'WARNING') {
            const severity: 'error' | 'warning' = event.severity === 'CRITICAL' ? 'error' : 'warning';
            showToast(event.summary, severity);
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage, showToast]);

  // Sortera events
  const sortedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'severity':
          const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
          aValue = severityOrder[a.severity] ?? 3;
          bValue = severityOrder[b.severity] ?? 3;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [events, sortField, sortDirection]);

  // Filtrera events
  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((event) => {
      if (filters.severity && event.severity !== filters.severity) return false;
      if (filters.status && event.status !== filters.status) return false;
      if (filters.type && event.type !== filters.type) return false;
      return true;
    });
  }, [sortedEvents, filters]);

  // Acknowledge event
  const handleAcknowledge = async (eventId: string) => {
    try {
      await apiService.acknowledgeEvent(eventId);
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: 'ACKNOWLEDGED' as const } : e))
      );
      showToast('Event kvitterat', 'success');
    } catch (error) {
      console.error('Failed to acknowledge event:', error);
      showToast('Kunde inte kvittera event', 'error');
    }
  };

  // Severity färger
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'var(--color-error)';
      case 'WARNING':
        return 'var(--color-warning)';
      case 'INFO':
        return 'var(--color-info)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };


  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1400px', margin: '0 auto' }}>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <h1>Events & Larm</h1>
        <Button onClick={loadEvents} variant="outline" size="sm">
          Uppdatera
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">Alla</option>
              <option value="CRITICAL">Kritisk</option>
              <option value="WARNING">Varning</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">Alla</option>
              <option value="ACTIVE">Aktiv</option>
              <option value="ACKNOWLEDGED">Kvitterad</option>
              <option value="RESOLVED">Löst</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Typ
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">Alla</option>
              <option value="NOISE">Ljud</option>
              <option value="KNOCK">Knock</option>
              <option value="SENSOR_THRESHOLD">Sensor tröskel</option>
              <option value="BEACON_PANIC_BUTTON">Panikknapp</option>
              <option value="BEACON_LOW_BATTERY">Lågt batteri</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Events Table */}
      {loading ? (
        <div>Laddar events...</div>
      ) : (
        <Card padding="none">
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-elevated)',
                  }}
                >
                  <th
                    style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('timestamp')}
                  >
                    Tid{' '}
                    {sortField === 'timestamp' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('severity')}
                  >
                    Severity{' '}
                    {sortField === 'severity' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('type')}
                  >
                    Typ{' '}
                    {sortField === 'type' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    Beskrivning
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('status')}
                  >
                    Status{' '}
                    {sortField === 'status' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'right',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      {new Date(event.timestamp).toLocaleString('sv-SE')}
                    </td>
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      <span
                        style={{
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: getSeverityColor(event.severity),
                          color: 'var(--color-text-inverse)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                        }}
                      >
                        {event.severity}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                      {event.type}
                    </td>
                    <td style={{ padding: 'var(--spacing-md)' }}>{event.summary}</td>
                    <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                      {event.status}
                    </td>
                    <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                      {event.status === 'ACTIVE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledge(event.id)}
                        >
                          Kvittera
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEvents.length === 0 && (
            <div
              style={{
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              Inga events hittades med valda filter.
            </div>
          )}
        </Card>
      )}
    </div>
  );
};


