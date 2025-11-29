"""
Sensor Service - Hämtar sensor-data från InfluxDB
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from influxdb_client import Point
from influxdb_client.client.query_api import QueryApi

from .influxdb import InfluxDBService

logger = logging.getLogger(__name__)


class SensorService:
    """Service för att hämta sensor-data från InfluxDB"""

    def __init__(self):
        self.influxdb = InfluxDBService()
        self.bucket = self.influxdb.get_bucket()
        self.device_id = "halo-device-1"  # TODO: Lägg till som parameter

    def get_latest_sensor_values(self, device_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Hämta senaste värden för alla sensorer

        Args:
            device_id: Device ID (optional, default från service)

        Returns:
            Dictionary med senaste sensorvärden
        """
        device_id = device_id or self.device_id

        try:
            # Query för att hämta senaste värden per sensor
            # Flux query: Hämta senaste datapoint per sensor_id
            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: -1h)
              |> filter(fn: (r) => r["_measurement"] =~ /^sensor_/)
              |> filter(fn: (r) => r["device_id"] == "{device_id}")
              |> group(columns: ["sensor_id"])
              |> last()
            '''

            result = self.influxdb.query_api.query(query=query)

            # Organisera data per sensor
            sensor_values = {}

            for table in result:
                for record in table.records:
                    sensor_id = record.values.get('sensor_id', 'unknown')
                    field = record.get_field()
                    value = record.get_value()
                    timestamp = record.get_time()

                    if sensor_id not in sensor_values:
                        sensor_values[sensor_id] = {
                            'sensor_id': sensor_id,
                            'timestamp': timestamp.isoformat(),
                            'values': {}
                        }

                    sensor_values[sensor_id]['values'][field] = value

            return {
                'device_id': device_id,
                'timestamp': datetime.utcnow().isoformat(),
                'sensors': list(sensor_values.values())
            }

        except Exception as e:
            logger.error(f"Failed to get latest sensor values: {e}", exc_info=True)
            return {
                'device_id': device_id,
                'timestamp': datetime.utcnow().isoformat(),
                'sensors': []
            }

    def get_sensor_history(
        self,
        sensor_id: str,
        from_time: Optional[datetime] = None,
        to_time: Optional[datetime] = None,
        limit: int = 1000,
        device_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Hämta historik för en specifik sensor

        Args:
            sensor_id: Sensor ID (t.ex. "co2sensor_co2")
            from_time: Starttid
            to_time: Sluttid
            limit: Max antal datapoints
            device_id: Device ID

        Returns:
            Lista med historiska värden
        """
        device_id = device_id or self.device_id

        if from_time is None:
            from_time = datetime.utcnow() - timedelta(hours=24)
        if to_time is None:
            to_time = datetime.utcnow()

        try:
            # Flux query för sensor-historik
            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: {self._datetime_to_flux_time(from_time)}, stop: {self._datetime_to_flux_time(to_time)})
              |> filter(fn: (r) => r["_measurement"] =~ /^sensor_/)
              |> filter(fn: (r) => r["sensor_id"] == "{sensor_id}")
              |> filter(fn: (r) => r["device_id"] == "{device_id}")
              |> limit(n: {limit})
              |> sort(columns: ["_time"])
            '''

            result = self.influxdb.query_api.query(query=query)

            history = []

            for table in result:
                for record in table.records:
                    history.append({
                        'timestamp': record.get_time().isoformat(),
                        'field': record.get_field(),
                        'value': record.get_value(),
                        'sensor_id': sensor_id,
                        'device_id': device_id
                    })

            return history

        except Exception as e:
            logger.error(f"Failed to get sensor history: {e}", exc_info=True)
            return []

    def _datetime_to_flux_time(self, dt: datetime) -> str:
        """Konvertera datetime till Flux-time format"""
        return dt.strftime('%Y-%m-%dT%H:%M:%SZ')

    def get_heartbeat_history(
        self,
        from_time: Optional[datetime] = None,
        to_time: Optional[datetime] = None,
        limit: int = 1000,
        device_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Hämta heartbeat-historik från InfluxDB

        Args:
            from_time: Starttid
            to_time: Sluttid
            limit: Max antal datapoints
            device_id: Device ID

        Returns:
            Lista med heartbeat-historik (connected status över tid)
        """
        device_id = device_id or self.device_id

        if from_time is None:
            from_time = datetime.utcnow() - timedelta(hours=24)
        if to_time is None:
            to_time = datetime.utcnow()

        try:
            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: {self._datetime_to_flux_time(from_time)}, stop: {self._datetime_to_flux_time(to_time)})
              |> filter(fn: (r) => r["_measurement"] == "halo_heartbeat")
              |> filter(fn: (r) => r["device_id"] == "{device_id}")
              |> limit(n: {limit})
              |> sort(columns: ["_time"])
            '''

            result = self.influxdb.query_api.query(query=query)

            history = []

            for table in result:
                for record in table.records:
                    entry = {
                        'timestamp': record.get_time().isoformat(),
                        'field': record.get_field(),
                        'value': record.get_value(),
                        'sensor_id': 'heartbeat/status',
                        'device_id': device_id
                    }
                    # Inkludera error-tag om den finns
                    if 'error' in record.values:
                        entry['error'] = record.values.get('error')
                    history.append(entry)

            return history

        except Exception as e:
            logger.error(f"Failed to get heartbeat history: {e}", exc_info=True)
            return []

    def get_latest_heartbeat(self, device_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Hämta senaste heartbeat-status

        Returns:
            Senaste heartbeat eller None
        """
        device_id = device_id or self.device_id

        try:
            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: -1h)
              |> filter(fn: (r) => r["_measurement"] == "halo_heartbeat")
              |> filter(fn: (r) => r["device_id"] == "{device_id}")
              |> last()
            '''

            result = self.influxdb.query_api.query(query=query)

            for table in result:
                for record in table.records:
                    return {
                        'timestamp': record.get_time().isoformat(),
                        'connected': record.get_value() == 1.0 if record.get_field() == 'connected' else None,
                        'response_time_ms': record.get_value() if record.get_field() == 'response_time_ms' else None,
                        'device_id': device_id
                    }

            return None

        except Exception as e:
            logger.error(f"Failed to get latest heartbeat: {e}", exc_info=True)
            return None
