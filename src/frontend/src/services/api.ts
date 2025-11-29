/**
 * API Service - Anrop till backend API
 * Använder runtime-konfiguration via window.location för produktion
 */
const getApiBaseUrl = (): string => {
  // Runtime-konfiguration: bestäm API-URL baserat på aktuell host
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;

    // Om vi är i produktion (inte localhost), använd relativa URL:er
    // så att nginx kan proxya till backend
    if (host !== 'localhost' && host !== '127.0.0.1') {
      // Produktion med nginx proxy: använd relativa URL:er
      // Nginx proxar /api/ till backend:8000
      return '';
    }

    // Utveckling på localhost: använd port 8000 för backend
    return 'http://localhost:8000';
  }

  // Fallback för server-side rendering (används inte i SPA)
  return '';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Sensor metadata
  async getSensorMetadata(): Promise<any[]> {
    return this.fetchJson('/api/sensors/meta');
  }

  async getSensorMetadataById(sensorId: string): Promise<any> {
    return this.fetchJson(`/api/sensors/meta/${sensorId}`);
  }

  // Beacon endpoints
  async getBeacons(): Promise<any[]> {
    return this.fetchJson('/api/beacons');
  }

  async getBeaconDetails(beaconId: string): Promise<any> {
    return this.fetchJson(`/api/beacons/${beaconId}`);
  }

  async getBeaconHistory(
    beaconId: string,
    fromTime?: string,
    toTime?: string,
    limit: number = 100
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (fromTime) params.append('from_time', fromTime);
    if (toTime) params.append('to_time', toTime);
    params.append('limit', limit.toString());

    return this.fetchJson(`/api/beacons/${beaconId}/history?${params.toString()}`);
  }

  async getBeaconAlerts(
    beaconId: string,
    fromTime?: string,
    toTime?: string,
    limit: number = 50
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (fromTime) params.append('from_time', fromTime);
    if (toTime) params.append('to_time', toTime);
    params.append('limit', limit.toString());

    return this.fetchJson(`/api/beacons/${beaconId}/alerts?${params.toString()}`);
  }

  async getCurrentPresence(): Promise<any[]> {
    return this.fetchJson('/api/beacons/presence/current');
  }

  // Events
  async getEvents(params?: {
    from?: string;
    to?: string;
    type?: string;
    severity?: string;
    status?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from_time', params.from);
    if (params?.to) queryParams.append('to_time', params.to);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return this.fetchJson(`/api/events${queryString ? `?${queryString}` : ''}`);
  }

  async acknowledgeEvent(eventId: string): Promise<void> {
    return this.fetchJson(`/api/events/ack/${eventId}`, {
      method: 'POST',
    });
  }

  // Latest sensor values
  async getLatestSensors(): Promise<any> {
    return this.fetchJson('/api/sensors/latest');
  }

  async getSensorHistory(
    sensorId: string,
    fromTime?: string,
    toTime?: string,
    limit: number = 1000
  ): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('sensor_id', sensorId);
    if (fromTime) params.append('from_time', fromTime);
    if (toTime) params.append('to_time', toTime);
    params.append('limit', limit.toString());

    return this.fetchJson(`/api/sensors/history?${params.toString()}`);
  }
}

export const apiService = new ApiService();
