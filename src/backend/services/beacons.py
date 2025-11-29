"""
Beacon Service - Hämtar beacon-data från InfluxDB
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from .influxdb import InfluxDBService

logger = logging.getLogger(__name__)


class BeaconService:
    """Service för att hämta beacon-data från InfluxDB"""

    def __init__(self):
        self.influxdb = InfluxDBService()
        self.bucket = self.influxdb.get_bucket()
        self.device_id = "halo-device-1"  # TODO: Lägg till som parameter

    def get_all_beacons(self, device_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Lista alla kända beacons med senaste status

        Args:
            device_id: Device ID (optional)

        Returns:
            Lista med beacon-status
        """
        device_id = device_id or self.device_id

        try:
            # Query för att hämta senaste status för varje unik beacon_id
            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: -24h)
              |> filter(fn: (r) => r["_measurement"] == "beacon_presence")
              |> filter(fn: (r) => r["device_id"] == "{device_id}")
              |> group(columns: ["beacon_id"])
              |> last()
            '''

            result = self.influxdb.query_api.query(query=query)

            beacons = []
            beacon_dicts = {}

            for table in result:
                for record in table.records:
                    beacon_id = record.values.get('beacon_id')
                    if not beacon_id:
                        continue

                    if beacon_id not in beacon_dicts:
                        beacon_dicts[beacon_id] = {
                            'beacon_id': beacon_id,
                            'beacon_name': record.values.get('beacon_name', beacon_id),
                            'device_id': device_id,
                            'timestamp': record.get_time().isoformat(),
                            'rssi': None,
                            'battery': None,
                            'is_present': None
                        }

                    field = record.get_field()
                    value = record.get_value()

                    if field == 'rssi':
                        beacon_dicts[beacon_id]['rssi'] = float(value) if value is not None else None
                    elif field == 'battery':
                        beacon_dicts[beacon_id]['battery'] = int(value) if value is not None else None
                    elif field == 'is_present':
                        beacon_dicts[beacon_id]['is_present'] = bool(value) if value is not None else None

            beacons = list(beacon_dicts.values())
            return beacons

        except Exception as e:
            logger.error(f"Failed to get all beacons: {e}", exc_info=True)
            return []

    def get_beacon_details(self, beacon_id: str, device_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Detaljerad info om specifik beacon

        Args:
            beacon_id: Beacon ID
            device_id: Device ID (optional)

        Returns:
            Detaljerad beacon-information eller None
        """
        device_id = device_id or self.device_id

        try:
            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: -24h)
              |> filter(fn: (r) => r["_measurement"] == "beacon_presence")
              |> filter(fn: (r) => r["beacon_id"] == "{beacon_id}")
              |> filter(fn: (r) => r["device_id"] == "{device_id}")
              |> last()
            '''

            result = self.influxdb.query_api.query(query=query)

            beacon = {
                'beacon_id': beacon_id,
                'device_id': device_id,
                'beacon_name': None,
                'rssi': None,
                'filter_rssi': None,
                'battery': None,
                'signal_strength': None,
                'is_present': None,
                'timestamp': None
            }

            for table in result:
                for record in table.records:
                    beacon['beacon_name'] = record.values.get('beacon_name', beacon_id)
                    beacon['timestamp'] = record.get_time().isoformat()

                    field = record.get_field()
                    value = record.get_value()

                    if field == 'rssi':
                        beacon['rssi'] = float(value) if value is not None else None
                    elif field == 'filter_rssi':
                        beacon['filter_rssi'] = float(value) if value is not None else None
                    elif field == 'battery':
                        beacon['battery'] = int(value) if value is not None else None
                    elif field == 'signal_strength':
                        beacon['signal_strength'] = int(value) if value is not None else None
                    elif field == 'is_present':
                        beacon['is_present'] = bool(value) if value is not None else None

            if beacon['timestamp']:
                return beacon

            return None

        except Exception as e:
            logger.error(f"Failed to get beacon details: {e}", exc_info=True)
            return None

    def get_beacon_history(
        self,
        beacon_id: str,
        from_time: Optional[datetime] = None,
        to_time: Optional[datetime] = None,
        limit: int = 100,
        device_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Närvarohistorik för specifik beacon

        Args:
            beacon_id: Beacon ID
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
            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: {self._datetime_to_flux_time(from_time)}, stop: {self._datetime_to_flux_time(to_time)})
              |> filter(fn: (r) => r["_measurement"] == "beacon_presence")
              |> filter(fn: (r) => r["beacon_id"] == "{beacon_id}")
              |> filter(fn: (r) => r["device_id"] == "{device_id}")
              |> limit(n: {limit})
              |> sort(columns: ["_time"])
            '''

            result = self.influxdb.query_api.query(query=query)

            history = []
            history_dicts = {}

            for table in result:
                for record in table.records:
                    timestamp = record.get_time().isoformat()

                    if timestamp not in history_dicts:
                        history_dicts[timestamp] = {
                            'timestamp': timestamp,
                            'beacon_id': beacon_id,
                            'beacon_name': record.values.get('beacon_name', beacon_id),
                            'rssi': None,
                            'filter_rssi': None,
                            'battery': None,
                            'signal_strength': None,
                            'is_present': None
                        }

                    field = record.get_field()
                    value = record.get_value()

                    if field == 'rssi':
                        history_dicts[timestamp]['rssi'] = float(value) if value is not None else None
                    elif field == 'filter_rssi':
                        history_dicts[timestamp]['filter_rssi'] = float(value) if value is not None else None
                    elif field == 'battery':
                        history_dicts[timestamp]['battery'] = int(value) if value is not None else None
                    elif field == 'signal_strength':
                        history_dicts[timestamp]['signal_strength'] = int(value) if value is not None else None
                    elif field == 'is_present':
                        history_dicts[timestamp]['is_present'] = bool(value) if value is not None else None

            history = list(history_dicts.values())
            history.sort(key=lambda x: x['timestamp'])

            return history

        except Exception as e:
            logger.error(f"Failed to get beacon history: {e}", exc_info=True)
            return []

    def get_beacon_alerts(
        self,
        beacon_id: str,
        from_time: Optional[datetime] = None,
        to_time: Optional[datetime] = None,
        limit: int = 50,
        device_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Panikknapp-events för specifik beacon

        Args:
            beacon_id: Beacon ID
            from_time: Starttid
            to_time: Sluttid
            limit: Max antal alerts
            device_id: Device ID

        Returns:
            Lista med panikknapp-events
        """
        device_id = device_id or self.device_id

        if from_time is None:
            from_time = datetime.utcnow() - timedelta(days=7)
        if to_time is None:
            to_time = datetime.utcnow()

        try:
            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: {self._datetime_to_flux_time(from_time)}, stop: {self._datetime_to_flux_time(to_time)})
              |> filter(fn: (r) => r["_measurement"] == "beacon_alerts")
              |> filter(fn: (r) => r["beacon_id"] == "{beacon_id}")
              |> filter(fn: (r) => r["alert_type"] == "panic_button")
              |> filter(fn: (r) => r["device_id"] == "{device_id}")
              |> limit(n: {limit})
              |> sort(columns: ["_time"], desc: true)
            '''

            result = self.influxdb.query_api.query(query=query)

            alerts = []
            alert_dicts = {}

            for table in result:
                for record in table.records:
                    timestamp = record.get_time().isoformat()

                    if timestamp not in alert_dicts:
                        alert_dicts[timestamp] = {
                            'timestamp': timestamp,
                            'beacon_id': beacon_id,
                            'beacon_name': record.values.get('beacon_name', beacon_id),
                            'alert_type': record.values.get('alert_type', 'panic_button'),
                            'status': None,
                            'battery': None,
                            'rssi': None
                        }

                    field = record.get_field()
                    value = record.get_value()

                    if field == 'status':
                        alert_dicts[timestamp]['status'] = int(value) if value is not None else None
                    elif field == 'battery':
                        alert_dicts[timestamp]['battery'] = int(value) if value is not None else None
                    elif field == 'rssi':
                        alert_dicts[timestamp]['rssi'] = float(value) if value is not None else None

            alerts = list(alert_dicts.values())
            alerts.sort(key=lambda x: x['timestamp'], reverse=True)

            return alerts

        except Exception as e:
            logger.error(f"Failed to get beacon alerts: {e}", exc_info=True)
            return []

    def get_current_presence(self, device_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Alla närvarande beacons just nu

        Args:
            device_id: Device ID (optional)

        Returns:
            Lista med beacons där is_present == true
        """
        device_id = device_id or self.device_id

        try:
            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: -1h)
              |> filter(fn: (r) => r["_measurement"] == "beacon_presence")
              |> filter(fn: (r) => r["device_id"] == "{device_id}")
              |> filter(fn: (r) => r["is_present"] == true)
              |> group(columns: ["beacon_id"])
              |> last()
            '''

            result = self.influxdb.query_api.query(query=query)

            beacons = []
            beacon_dicts = {}

            for table in result:
                for record in table.records:
                    beacon_id = record.values.get('beacon_id')
                    if not beacon_id:
                        continue

                    if beacon_id not in beacon_dicts:
                        beacon_dicts[beacon_id] = {
                            'beacon_id': beacon_id,
                            'beacon_name': record.values.get('beacon_name', beacon_id),
                            'device_id': device_id,
                            'timestamp': record.get_time().isoformat(),
                            'rssi': None,
                            'battery': None,
                            'is_present': True
                        }

                    field = record.get_field()
                    value = record.get_value()

                    if field == 'rssi':
                        beacon_dicts[beacon_id]['rssi'] = float(value) if value is not None else None
                    elif field == 'battery':
                        beacon_dicts[beacon_id]['battery'] = int(value) if value is not None else None

            beacons = list(beacon_dicts.values())
            return beacons

        except Exception as e:
            logger.error(f"Failed to get current presence: {e}", exc_info=True)
            return []

    def _datetime_to_flux_time(self, dt: datetime) -> str:
        """Konvertera datetime till Flux-time format"""
        return dt.strftime('%Y-%m-%dT%H:%M:%SZ')

