"""
BLE Beacon Handler - Hanterar BLE Beacon-data från Halo 3C sensor
"""
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Tröskelvärden
RSSI_PRESENCE_THRESHOLD = -80  # dBm - beacon anses närvarande om RSSI > threshold
BATTERY_WARNING_THRESHOLD = 20  # %
BATTERY_CRITICAL_THRESHOLD = 10  # %


class BeaconState:
    """Håller koll på beacon-state för att detektera förändringar"""
    def __init__(self):
        self.last_seen: Dict[str, float] = {}  # beacon_id -> RSSI
        self.last_status: Dict[str, int] = {}  # beacon_id -> status (0/1)
        self.last_battery: Dict[str, int] = {}  # beacon_id -> battery %

    def is_new_beacon(self, beacon_id: str, rssi: float) -> bool:
        """Kontrollera om detta är första gången vi ser detta beacon"""
        return beacon_id not in self.last_seen

    def has_departed(self, beacon_id: str, current_rssi: float) -> bool:
        """Kontrollera om beacon har försvunnit (RSSI under threshold)"""
        if beacon_id not in self.last_seen:
            return False

        was_present = self.last_seen[beacon_id] > RSSI_PRESENCE_THRESHOLD
        is_present = current_rssi > RSSI_PRESENCE_THRESHOLD

        return was_present and not is_present

    def has_arrived(self, beacon_id: str, current_rssi: float) -> bool:
        """Kontrollera om beacon har anslutit (RSSI över threshold för första gången)"""
        if beacon_id not in self.last_seen:
            return current_rssi > RSSI_PRESENCE_THRESHOLD

        was_present = self.last_seen.get(beacon_id, -100) > RSSI_PRESENCE_THRESHOLD
        is_present = current_rssi > RSSI_PRESENCE_THRESHOLD

        return not was_present and is_present

    def status_changed(self, beacon_id: str, current_status: int) -> bool:
        """Kontrollera om panikknapp-status har ändrats"""
        if beacon_id not in self.last_status:
            self.last_status[beacon_id] = 0
            return current_status == 1

        last = self.last_status.get(beacon_id, 0)
        return last != current_status and current_status == 1  # Endast 0->1 är intressant

    def battery_low(self, beacon_id: str, current_battery: int) -> Tuple[bool, str]:
        """
        Kontrollera om batteri är lågt

        Returns:
            (is_low, level) där level är 'warning' eller 'critical'
        """
        if current_battery < BATTERY_CRITICAL_THRESHOLD:
            return (True, 'critical')
        elif current_battery < BATTERY_WARNING_THRESHOLD:
            return (True, 'warning')
        return (False, 'normal')

    def update(self, beacon_id: str, rssi: float, status: int, battery: int):
        """Uppdatera state för en beacon"""
        self.last_seen[beacon_id] = rssi
        self.last_status[beacon_id] = status
        self.last_battery[beacon_id] = battery


class BeaconHandler:
    """Hanterar BLE Beacon-data från Halo 3C sensor"""

    def __init__(self):
        self.state = BeaconState()

    def extract_beacon_data(self, halo_data: Dict) -> List[Dict]:
        """
        Extrahera BLE Beacon-data från Halo sensor response

        Args:
            halo_data: Fullständig response från /api/config/gstate/latest

        Returns:
            Lista med beacon-data dictionaries
        """
        beacons = []

        try:
            blebcn_data = halo_data.get('blebcn', {}).get('data', {})
            alert_data = blebcn_data.get('alert', {})

            # Kontrollera om det finns aktiv beacon-data
            if alert_data.get('id') and alert_data.get('id') != '':
                beacon = {
                    'beacon_id': alert_data.get('id', ''),
                    'name': alert_data.get('name', ''),
                    'status': alert_data.get('status', 0),  # Panikknapp-status (0/1)
                    'battery': alert_data.get('battery', 0),
                    'rssi': alert_data.get('rssi', 0),
                    'filter_rssi': alert_data.get('filter_rssi', 0),
                    'sig_str': alert_data.get('sig_str', 0),
                    'time': alert_data.get('time', 0),  # Timestamp för senaste alert
                    'timestamp': datetime.utcnow().isoformat()
                }
                beacons.append(beacon)

            # TODO: Om Halo stödjer flera beacons, iterera över listan här

        except Exception as e:
            logger.error(f"Error extracting beacon data: {e}", exc_info=True)

        return beacons

    def process_beacons(self, beacons: List[Dict], device_id: str = "halo-device-1") -> Tuple[List[Dict], List[Dict]]:
        """
        Processa beacons och generera events

        Args:
            beacons: Lista med beacon-data
            device_id: Device-ID för Halo sensor

        Returns:
            (presence_data, events) där:
            - presence_data: Lista med beacon presence-data för InfluxDB
            - events: Lista med events att generera
        """
        presence_data = []
        events = []

        for beacon in beacons:
            beacon_id = beacon.get('beacon_id')
            rssi = beacon.get('rssi', -100)
            status = beacon.get('status', 0)
            battery = beacon.get('battery', 0)
            name = beacon.get('name', beacon_id)

            # Bestäm om beacon är närvarande baserat på RSSI
            is_present = rssi > RSSI_PRESENCE_THRESHOLD

            # Skapa presence-data för InfluxDB
            presence_point = {
                'measurement': 'beacon_presence',
                'tags': {
                    'beacon_id': beacon_id,
                    'beacon_name': name,
                    'device_id': device_id
                },
                'fields': {
                    'rssi': float(rssi),
                    'filter_rssi': float(beacon.get('filter_rssi', rssi)),
                    'battery': int(battery),
                    'signal_strength': int(beacon.get('sig_str', 0)),
                    'is_present': is_present
                },
                'time': beacon.get('timestamp', datetime.utcnow().isoformat())
            }
            presence_data.append(presence_point)

            # Detektera events

            # 1. Panikknapp-event
            if self.state.status_changed(beacon_id, status) and status == 1:
                events.append({
                    'type': 'BEACON_PANIC_BUTTON',
                    'severity': 'CRITICAL',
                    'source': f'beacon-{beacon_id}',
                    'summary': f'Panikknapp aktiverad på {name}',
                    'details': {
                        'beacon_id': beacon_id,
                        'beacon_name': name,
                        'battery': battery,
                        'rssi': rssi,
                        'timestamp': beacon.get('timestamp')
                    },
                    'device_id': device_id
                })

            # 2. Beacon arrived
            if self.state.has_arrived(beacon_id, rssi):
                events.append({
                    'type': 'BEACON_ARRIVED',
                    'severity': 'INFO',
                    'source': f'beacon-{beacon_id}',
                    'summary': f'Beacon {name} har anslutit',
                    'details': {
                        'beacon_id': beacon_id,
                        'beacon_name': name,
                        'rssi': rssi,
                        'battery': battery
                    },
                    'device_id': device_id
                })

            # 3. Beacon departed
            if self.state.has_departed(beacon_id, rssi):
                events.append({
                    'type': 'BEACON_DEPARTED',
                    'severity': 'INFO',
                    'source': f'beacon-{beacon_id}',
                    'summary': f'Beacon {name} har försvunnit',
                    'details': {
                        'beacon_id': beacon_id,
                        'beacon_name': name,
                        'last_rssi': self.state.last_seen.get(beacon_id, rssi),
                        'current_rssi': rssi
                    },
                    'device_id': device_id
                })

            # 4. Low battery
            is_low, level = self.state.battery_low(beacon_id, battery)
            if is_low and battery != self.state.last_battery.get(beacon_id, battery):
                events.append({
                    'type': 'BEACON_LOW_BATTERY',
                    'severity': 'WARNING' if level == 'warning' else 'CRITICAL',
                    'source': f'beacon-{beacon_id}',
                    'summary': f'Lågt batteri på {name}: {battery}%',
                    'details': {
                        'beacon_id': beacon_id,
                        'beacon_name': name,
                        'battery': battery,
                        'level': level
                    },
                    'device_id': device_id
                })

            # 5. Panikknapp-alert data (om status == 1)
            if status == 1:
                alert_point = {
                    'measurement': 'beacon_alerts',
                    'tags': {
                        'beacon_id': beacon_id,
                        'beacon_name': name,
                        'alert_type': 'panic_button',
                        'device_id': device_id
                    },
                    'fields': {
                        'status': int(status),
                        'battery': int(battery),
                        'rssi': float(rssi)
                    },
                    'time': beacon.get('timestamp', datetime.utcnow().isoformat())
                }
                presence_data.append(alert_point)

            # Uppdatera state
            self.state.update(beacon_id, rssi, status, battery)

        return presence_data, events

    def get_signal_strength_level(self, rssi: float) -> str:
        """
        Klassificera signalstyrka baserat på RSSI

        Returns:
            'very_close', 'near', 'far', 'very_far'
        """
        if rssi > -60:
            return 'very_close'
        elif rssi > -80:
            return 'near'
        elif rssi > -90:
            return 'far'
        else:
            return 'very_far'

