"""
Event Generator - Genererar events från sensor-data och beacon-data
"""
from typing import List, Dict
import logging
from .beacon_handler import BeaconHandler

logger = logging.getLogger(__name__)


class EventGenerator:
    """Genererar events baserat på sensor-data och tröskelvärden"""

    def __init__(self):
        self.beacon_handler = BeaconHandler()

    def generate_events_from_sensor_data(
        self,
        sensor_data: Dict,
        device_id: str = "halo-device-1"
    ) -> List[Dict]:
        """
        Generera events från sensor-data

        Args:
            sensor_data: Sensor-data från Halo 3C
            device_id: Device-ID

        Returns:
            Lista med events
        """
        events = []

        # Processa BLE Beacon-data
        try:
            beacons = self.beacon_handler.extract_beacon_data(sensor_data)
            if beacons:
                _, beacon_events = self.beacon_handler.process_beacons(beacons, device_id)
                events.extend(beacon_events)
        except Exception as e:
            logger.error(f"Error generating beacon events: {e}", exc_info=True)

        # TODO: Processa andra sensor-data för tröskelvärdes-events
        # Exempel: CO2 över tröskel, temperatur över tröskel, etc.

        return events

