/**
 * API Service - Anrop till backend API
 * Anvander runtime-konfiguration via window.location for produktion
 */

const TOKEN_KEY = 'tekniklokaler_auth_token';

const getApiBaseUrl = (): string => {
  // Anvand alltid relativa URL:er - bade i utveckling (Vite proxy) och produktion (nginx proxy)
  // Vite proxy: /api -> http://REDACTED_SERVER_IP:8000
  // Nginx proxy: /api -> http://backend:8000
  return '';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private getAuthHeader(): Record<string, string> {
    // Use sessionStorage for better security (tokens cleared on browser close)
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options?.headers,
      },
    });

    // Hantera 401 Unauthorized - logga ut anvandaren
    if (response.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem('tekniklokaler_auth_user');
      window.location.reload();
      throw new Error('Session expired');
    }

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

  // Log endpoints
  async getLogData(
    measurement?: string,
    hours?: number,
    limit?: number
  ): Promise<{
    data: Array<{
      timestamp: string;
      measurement: string;
      id: string;
      value: any;
      tags: Record<string, any>;
      fields: Record<string, any>;
    }>;
    total: number;
    measurement: string;
    hours: number;
  }> {
    const params = new URLSearchParams();
    if (measurement) params.append('measurement', measurement);
    if (hours) params.append('hours', hours.toString());
    if (limit) params.append('limit', limit.toString());

    return this.fetchJson(`/api/log?${params.toString()}`);
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

  // Occupancy endpoints
  async getOccupancyStatus(deviceId?: string): Promise<OccupancyStatus> {
    const params = new URLSearchParams();
    if (deviceId) params.append('device_id', deviceId);
    params.append('include_details', 'true');
    return this.fetchJson(`/api/occupancy/status?${params.toString()}`);
  }

  async getOccupancyHistory(deviceId?: string, hours: number = 24): Promise<OccupancyHistory> {
    const params = new URLSearchParams();
    if (deviceId) params.append('device_id', deviceId);
    params.append('hours', hours.toString());
    return this.fetchJson(`/api/occupancy/history?${params.toString()}`);
  }

  async getOccupancyConfig(): Promise<OccupancyConfig> {
    return this.fetchJson('/api/occupancy/config');
  }
}

// Types for Occupancy
export interface OccupancyStatus {
  state: 'occupied' | 'vacant' | 'uncertain';
  occupied: boolean;
  score: number;
  threshold: number;
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
  device_id: string;
  details?: {
    co2: {
      value: number | null;
      unit: string;
      contribution: number;
      thresholds: { high: number; medium: number; baseline: number };
    };
    audio: {
      value: number | null;
      unit: string;
      contribution: number;
      thresholds: { high: number; medium: number; baseline: number };
    };
    pir?: {
      value: number | null;
      unit: string;
      motion_detected: boolean;
      contribution: number;
      thresholds: { high: number; medium: number; baseline: number };
    };
    light?: {
      value: number | null;
      unit: string;
      contribution: number;
      thresholds: { high: number; medium: number; baseline: number };
    };
    beacon: {
      present: boolean;
      count: number;
      contribution: number;
    };
  };
  score_breakdown?: {
    co2: number;
    audio: number;
    pir: number;
    light: number;
    beacon: number;
  };
  error?: string;
}

export interface OccupancyHistory {
  device_id: string;
  period_hours: number;
  history: Array<{
    timestamp: string;
    state: string;
    score: number;
  }>;
  statistics: {
    occupied_percentage: number;
    sample_count: number;
    last_change: string | null;
  };
}

export interface OccupancyConfig {
  thresholds: {
    co2: { high: number; medium: number; baseline: number; unit: string };
    audio: { high: number; medium: number; baseline: number; unit: string };
  };
  scoring: {
    co2_high: number;
    co2_medium: number;
    audio_high: number;
    audio_medium: number;
    beacon_present: number;
  };
  state_thresholds: {
    occupied: number;
    vacant: number;
  };
}

export const apiService = new ApiService();
