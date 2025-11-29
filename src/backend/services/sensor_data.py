"""
Sensor Data Service - Skriver sensor-data till InfluxDB
"""
from typing import Dict, List, Optional
from datetime import datetime
from influxdb_client import Point
import logging
import os

from .influxdb import InfluxDBService

logger = logging.getLogger(__name__)


class SensorDataService:
    """Service för att skriva sensor-data till InfluxDB"""

    def __init__(self):
        self.influxdb = InfluxDBService()
        self.bucket = os.getenv("INFLUXDB_BUCKET", "halo-sensors")
        self.device_id = os.getenv("DEVICE_ID", "halo-device-1")

    def write_sensor_data(
        self,
        sensor_data: Dict,
        timestamp: Optional[datetime] = None
    ) -> bool:
        """
        Skriv sensor-data till InfluxDB

        Args:
            sensor_data: Dictionary med sensor-data från Halo 3C
            timestamp: Timestamp för data (default: nu)

        Returns:
            True om framgångsrikt
        """
        if timestamp is None:
            timestamp = datetime.utcnow()

        try:
            points = []

            # Extrahera alla sensorvärden från state
            for key, value in sensor_data.items():
                if isinstance(value, dict):
                    # Hantera sensor-struktur
                    sensor_key = value.get('key', key)
                    data = value.get('data', {})

                    # Skapa measurement baserat på sensor-typ
                    measurement = f"sensor_{sensor_key}"

                    # Extrahera alla numeriska värden från data
                    if isinstance(data, dict):
                        for field_name, field_value in data.items():
                            # Skippa reserverade fältnamn i InfluxDB
                            if field_name in ('time', '_time', 'timestamp'):
                                continue
                            if isinstance(field_value, (int, float)):
                                point = Point(measurement) \
                                    .tag("sensor_id", f"{sensor_key}/{field_name}") \
                                    .tag("device_id", self.device_id) \
                                    .field(field_name, float(field_value)) \
                                    .time(timestamp)
                                points.append(point)

                    # Om data är direkt ett numeriskt värde
                    elif isinstance(data, (int, float)):
                        point = Point(measurement) \
                            .tag("sensor_id", sensor_key) \
                            .tag("device_id", self.device_id) \
                            .field("value", float(data)) \
                            .time(timestamp)
                        points.append(point)

            # Skriv alla points till InfluxDB
            if points:
                self.influxdb.write_api.write(bucket=self.bucket, record=points)
                logger.debug(f"Wrote {len(points)} sensor data points to InfluxDB")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to write sensor data: {e}", exc_info=True)
            return False

    def write_beacon_data(self, presence_data: List[Dict]) -> bool:
        """
        Skriv beacon presence-data till InfluxDB

        Args:
            presence_data: Lista med beacon presence-data från BeaconHandler

        Returns:
            True om framgångsrikt
        """
        try:
            points = []

            for data in presence_data:
                measurement = data.get('measurement', 'beacon_presence')
                tags = data.get('tags', {})
                fields = data.get('fields', {})
                time_str = data.get('time')

                point = Point(measurement)

                # Lägg till tags
                for tag_key, tag_value in tags.items():
                    point = point.tag(tag_key, str(tag_value))

                # Lägg till fields
                for field_key, field_value in fields.items():
                    if isinstance(field_value, bool):
                        point = point.field(field_key, field_value)
                    elif isinstance(field_value, (int, float)):
                        point = point.field(field_key, float(field_value))
                    elif isinstance(field_value, str):
                        # Försök konvertera sträng till float om möjligt
                        try:
                            point = point.field(field_key, float(field_value))
                        except:
                            point = point.field(field_key, field_value)

                # Lägg till timestamp
                if time_str:
                    if isinstance(time_str, str):
                        try:
                            time_dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
                            point = point.time(time_dt)
                        except:
                            point = point.time(datetime.utcnow())
                    elif isinstance(time_str, datetime):
                        point = point.time(time_str)
                    else:
                        point = point.time(datetime.utcnow())
                else:
                    point = point.time(datetime.utcnow())

                points.append(point)

            # Skriv alla points till InfluxDB
            if points:
                self.influxdb.write_api.write(bucket=self.bucket, record=points)
                logger.debug(f"Wrote {len(points)} beacon data points to InfluxDB")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to write beacon data: {e}", exc_info=True)
            return False

