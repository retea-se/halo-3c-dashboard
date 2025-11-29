"""
Event Generator - Genererar events från sensor-data och beacon-data
"""
from typing import List, Dict, Optional
import logging
import math
from .beacon_handler import BeaconHandler

logger = logging.getLogger(__name__)


class EventGenerator:
    """Genererar events baserat på sensor-data och tröskelvärden"""

    def __init__(self, halo_client=None):
        self.beacon_handler = BeaconHandler()
        self.halo_client = halo_client
        self._last_event_states = {}  # Track last known event states to detect changes
        self._last_vibration_magnitude = 0.0  # Track last vibration magnitude

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

        # Processa Halo event_state för Vape/THC och andra events
        try:
            halo_events = self._process_halo_event_state(device_id)
            events.extend(halo_events)
        except Exception as e:
            logger.error(f"Error processing Halo event state: {e}", exc_info=True)

        # Processa accelerometer för skakningsdetektion
        try:
            vibration_events = self._process_accelerometer_vibration(sensor_data, device_id)
            events.extend(vibration_events)
        except Exception as e:
            logger.error(f"Error processing accelerometer: {e}", exc_info=True)

        return events

    def _process_halo_event_state(self, device_id: str) -> List[Dict]:
        """
        Processa Halo event_state för att detektera aktiva events (Vape, THC, etc.)

        Args:
            device_id: Device-ID

        Returns:
            Lista med events
        """
        events = []

        if not self.halo_client:
            return events

        try:
            event_state = self.halo_client.get_event_state()
            if not event_state:
                return events

            # Event types att övervaka - ALLA 26 event-identifierare från Halo
            # Mappning: Halo event_id -> (EventType, severity, summary_template)
            monitored_events = {
                # Säkerhet
                'Aggression': {'type': 'Aggression', 'severity': 'WARNING', 'summary_template': 'Aggression detekterad'},
                'Gunshot': {'type': 'Gunshot', 'severity': 'CRITICAL', 'summary_template': 'Skottlossning detekterad'},
                'Tamper': {'type': 'Tamper', 'severity': 'CRITICAL', 'summary_template': 'Tamper/sabotage detekterad'},
                'Help': {'type': 'Help', 'severity': 'CRITICAL', 'summary_template': 'Nödrop detekterad'},
                'Motion': {'type': 'Motion', 'severity': 'INFO', 'summary_template': 'Rörelse detekterad'},

                # Vaping/Smoking
                'Vape': {'type': 'Vape', 'severity': 'WARNING', 'summary_template': 'Vape-detektion aktiv'},
                'THC': {'type': 'THC', 'severity': 'WARNING', 'summary_template': 'THC-detektion aktiv'},
                'Masking': {'type': 'Masking', 'severity': 'WARNING', 'summary_template': 'Maskeringsförsök detekterat'},
                'Smoking': {'type': 'Smoking', 'severity': 'WARNING', 'summary_template': 'Rökning detekterad'},

                # Luftkvalitet
                'AQI': {'type': 'AQI', 'severity': 'WARNING', 'summary_template': 'AQI-varning'},
                'Health_Index': {'type': 'Health_Index', 'severity': 'WARNING', 'summary_template': 'Hälsoindex-varning'},
                'TVOC': {'type': 'TVOC', 'severity': 'WARNING', 'summary_template': 'TVOC-nivå överskriden'},
                'CO2cal': {'type': 'CO2cal', 'severity': 'WARNING', 'summary_template': 'CO₂-nivå överskriden'},
                'PM2.5': {'type': 'PM2.5', 'severity': 'WARNING', 'summary_template': 'PM2.5-nivå överskriden'},
                'PM1': {'type': 'PM1', 'severity': 'WARNING', 'summary_template': 'PM1-nivå överskriden'},
                'PM10': {'type': 'PM10', 'severity': 'WARNING', 'summary_template': 'PM10-nivå överskriden'},
                'CO': {'type': 'CO', 'severity': 'CRITICAL', 'summary_template': 'Kolmonoxid (CO) detekterad'},
                'NO2': {'type': 'NO2', 'severity': 'WARNING', 'summary_template': 'Kvävedioxid (NO₂) nivå överskriden'},
                'NH3': {'type': 'NH3', 'severity': 'WARNING', 'summary_template': 'Ammoniak (NH₃) nivå överskriden'},

                # Miljö
                'Humidity': {'type': 'Humidity', 'severity': 'WARNING', 'summary_template': 'Luftfuktighet för hög'},
                'Humidity_Low': {'type': 'Humidity_Low', 'severity': 'INFO', 'summary_template': 'Luftfuktighet för låg'},
                'Temp_C': {'type': 'Temp_C', 'severity': 'WARNING', 'summary_template': 'Temperatur för hög'},
                'Temp_C_Low': {'type': 'Temp_C_Low', 'severity': 'WARNING', 'summary_template': 'Temperatur för låg'},
                'Pressure': {'type': 'Pressure', 'severity': 'INFO', 'summary_template': 'Lufttrycksvarning'},
                'Light': {'type': 'Light', 'severity': 'INFO', 'summary_template': 'Ljusnivå-varning'},
                'Sound': {'type': 'Sound', 'severity': 'INFO', 'summary_template': 'Ljudnivå-varning'},
            }

            for event_id, event_data in event_state.items():
                if not isinstance(event_data, dict):
                    continue

                # Kolla om event är aktivt (state == 1 eller rawval > 0)
                state = event_data.get('state', 0)
                rawval = event_data.get('rawval', 0)
                is_active = state == 1 or rawval > 0

                # Kolla om event var aktivt tidigare
                last_state = self._last_event_states.get(event_id, False)

                # Om event blev aktivt (nytt event)
                if is_active and not last_state:
                    if event_id in monitored_events:
                        config = monitored_events[event_id]
                        # Förbättra summary med rawval om tillgängligt
                        summary = config['summary_template']
                        if rawval > 0:
                            summary = f"{summary} (värde: {rawval})"

                        events.append({
                            'type': config['type'],
                            'severity': config['severity'],
                            'source': f'halo-event-{event_id}',
                            'summary': summary,
                            'details': {
                                'event_id': event_id,
                                'rawval': rawval,
                                'state': state,
                                'halo_event_data': event_data
                            },
                            'device_id': device_id,
                            'current_value': rawval if rawval > 0 else None
                        })
                        logger.info(f"Detected new Halo event: {event_id} (state={state}, rawval={rawval})")

                # Uppdatera last state
                self._last_event_states[event_id] = is_active

        except Exception as e:
            logger.error(f"Error processing Halo event state: {e}", exc_info=True)

        return events

    def _process_accelerometer_vibration(
        self,
        sensor_data: Dict,
        device_id: str
    ) -> List[Dict]:
        """
        Processa accelerometer-data för att detektera skakningar

        Beräknar magnitud från x, y, z värden och loggar skakningar när magnitud > tröskel.

        Args:
            sensor_data: Sensor-data från Halo 3C
            device_id: Device-ID

        Returns:
            Lista med events
        """
        events = []
        vibration_threshold = 1500.0  # milli g - tröskel för skakningsdetektion

        try:
            # Extrahera accelerometer-data
            acc_data = sensor_data.get('accsensor', {})
            if isinstance(acc_data, dict):
                data = acc_data.get('data', {})
                if isinstance(data, dict):
                    x = data.get('x', 0)
                    y = data.get('y', 0)
                    z = data.get('z', 0)
                    move = data.get('move', 0)

                    # Beräkna magnitud: sqrt(x² + y² + z²)
                    magnitude = math.sqrt(x*x + y*y + z*z)

                    # Logga skakning om magnitud > tröskel OCH move == 1
                    if move == 1 and magnitude > vibration_threshold:
                        # Kolla om det är en ny skakning (magnitud ökade signifikant)
                        if magnitude > self._last_vibration_magnitude * 1.2:  # 20% ökning
                            events.append({
                                'type': 'TAMPER',
                                'severity': 'WARNING',
                                'source': 'accsensor/vibration',
                                'summary': f'Skakning detekterad (magnitud: {magnitude:.1f} milli g)',
                                'details': {
                                    'magnitude': magnitude,
                                    'x': x,
                                    'y': y,
                                    'z': z,
                                    'move': move,
                                    'threshold': vibration_threshold
                                },
                                'device_id': device_id,
                                'current_value': magnitude,
                                'threshold_value': vibration_threshold
                            })
                            logger.info(f"Vibration detected: magnitude={magnitude:.1f} milli g")

                    # Uppdatera last vibration magnitude
                    self._last_vibration_magnitude = magnitude

        except Exception as e:
            logger.error(f"Error processing accelerometer vibration: {e}", exc_info=True)

        return events

