"""
Halo Client - Hämtar data från Halo 3C sensor
"""
import requests
from requests.auth import HTTPBasicAuth
from typing import Dict, List, Optional
import logging
from datetime import datetime
import urllib3

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

# Global heartbeat tracking
_last_successful_contact: Optional[datetime] = None
_last_contact_error: Optional[str] = None


def get_heartbeat_status() -> Dict:
    """Hämta heartbeat-status för Halo-sensorn"""
    global _last_successful_contact, _last_contact_error

    now = datetime.utcnow()

    if _last_successful_contact is None:
        return {
            "status": "unknown",
            "last_contact": None,
            "seconds_since_contact": None,
            "error": _last_contact_error
        }

    seconds_since = (now - _last_successful_contact).total_seconds()

    # Status baserat på tid sedan senaste kontakt
    if seconds_since < 30:
        status = "healthy"
    elif seconds_since < 120:
        status = "degraded"
    else:
        status = "offline"

    return {
        "status": status,
        "last_contact": _last_successful_contact.isoformat(),
        "seconds_since_contact": int(seconds_since),
        "error": _last_contact_error if status != "healthy" else None
    }


class HaloClient:
    """Client för att kommunicera med Halo 3C sensor"""

    def __init__(
        self,
        ip: str,
        username: str,
        password: str,
        use_https: bool = False,
        timeout: int = 10
    ):
        """
        Initiera Halo Client

        Args:
            ip: Halo sensor IP-adress (t.ex. "REDACTED_HALO_IP")
            username: HTTP Basic Auth username
            password: HTTP Basic Auth password
            use_https: Använd HTTPS istället för HTTP
            timeout: Request timeout i sekunder
        """
        self.ip = ip
        self.username = username
        self.password = password
        self.protocol = "https" if use_https else "http"
        self.timeout = timeout
        self.auth = HTTPBasicAuth(username, password)
        self.base_url = f"{self.protocol}://{ip}/api/config/gstate"

    def get_latest_state(self) -> Optional[Dict]:
        """
        Hämta senaste sensor-state från Halo 3C

        Returns:
            Dictionary med alla sensorvärden, eller None vid fel
        """
        global _last_successful_contact, _last_contact_error

        try:
            url = f"{self.base_url}/latest"
            response = requests.get(
                url,
                auth=self.auth,
                timeout=self.timeout,
                verify=False
            )
            response.raise_for_status()
            data = response.json()

            # Uppdatera heartbeat
            _last_successful_contact = datetime.utcnow()
            _last_contact_error = None

            logger.debug(f"Successfully fetched Halo state from {url}")
            return data

        except requests.exceptions.RequestException as e:
            _last_contact_error = str(e)
            logger.error(f"Failed to fetch Halo state: {e}")
            return None
        except Exception as e:
            _last_contact_error = str(e)
            logger.error(f"Unexpected error fetching Halo state: {e}", exc_info=True)
            return None

    def extract_sensor_value(self, state: Dict, sensor_path: str) -> Optional[float]:
        """
        Extrahera ett specifikt sensorvärde från state

        Args:
            state: State-dictionary från get_latest_state()
            sensor_path: Sensor-path (t.ex. "htsensor/ctemp")

        Returns:
            Sensorvärde eller None om inte hittat
        """
        try:
            parts = sensor_path.split("/")
            current = state

            for part in parts:
                if isinstance(current, dict):
                    current = current.get(part)
                elif isinstance(current, list):
                    # Försök hitta via 'key' eller index
                    current = next((item for item in current if item.get('key') == part), None)
                else:
                    return None

                if current is None:
                    return None

            # Om current är en dict med 'data', försök hämta värde
            if isinstance(current, dict):
                data = current.get('data')
                if isinstance(data, dict):
                    # Försök hitta ett numeriskt värde
                    for key in ['value', 'val', 'v', parts[-1]]:
                        if key in data and isinstance(data[key], (int, float)):
                            return float(data[key])

                # Om data är ett direkt numeriskt värde
                if isinstance(data, (int, float)):
                    return float(data)

            # Om current är ett direkt numeriskt värde
            if isinstance(current, (int, float)):
                return float(current)

            return None

        except Exception as e:
            logger.warning(f"Failed to extract sensor value for {sensor_path}: {e}")
            return None

    def health_check(self) -> bool:
        """
        Kontrollera om Halo sensorn ar tillganglig

        Returns:
            True om sensorn svarar
        """
        try:
            state = self.get_latest_state()
            return state is not None
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False

    def get_device_info(self) -> Optional[Dict]:
        """
        Hamta enhetsinformation fran Halo 3C

        Returns:
            Dictionary med enhetsinformation eller None vid fel
        """
        try:
            info = {}

            # Hamta workers info (drifttimmar, starttid)
            workers_url = f"{self.protocol}://{self.ip}/api/config/gstate/workers"
            try:
                response = requests.get(
                    workers_url,
                    auth=self.auth,
                    timeout=self.timeout,
                    verify=False
                )
                if response.ok:
                    workers = response.json()
                    info["workers"] = workers
                    # Extrahera specifika varden
                    info["lifetime_hours"] = workers.get("lifetimehrs")
                    info["start_time"] = workers.get("starttime")
            except Exception as e:
                logger.warning(f"Failed to fetch workers info: {e}")

            # Hamta natverksinfo
            netinfo_url = f"{self.protocol}://{self.ip}/api/device/netinfo"
            try:
                response = requests.get(
                    netinfo_url,
                    auth=self.auth,
                    timeout=self.timeout,
                    verify=False
                )
                if response.ok:
                    info["network"] = response.json()
            except Exception as e:
                logger.warning(f"Failed to fetch network info: {e}")

            # Hamta tidsinfo
            timeinfo_url = f"{self.protocol}://{self.ip}/api/device/gettimeinfo"
            try:
                response = requests.get(
                    timeinfo_url,
                    auth=self.auth,
                    timeout=self.timeout,
                    verify=False
                )
                if response.ok:
                    info["time_info"] = response.json()
            except Exception as e:
                logger.warning(f"Failed to fetch time info: {e}")

            # Hamta cloud status
            cloud_url = f"{self.protocol}://{self.ip}/api/config/gstate/cloud"
            try:
                response = requests.get(
                    cloud_url,
                    auth=self.auth,
                    timeout=self.timeout,
                    verify=False
                )
                if response.ok:
                    info["cloud"] = response.json()
            except Exception as e:
                logger.warning(f"Failed to fetch cloud status: {e}")

            # Hamta hidden/about (sensorkalibrering, serienummer)
            about_url = f"{self.protocol}://{self.ip}/api/config/gstate/hidden/about"
            try:
                response = requests.get(
                    about_url,
                    auth=self.auth,
                    timeout=self.timeout,
                    verify=False
                )
                if response.ok:
                    info["about"] = response.json()
            except Exception as e:
                logger.warning(f"Failed to fetch about info: {e}")

            info["ip"] = self.ip
            info["fetched_at"] = datetime.utcnow().isoformat()

            return info

        except Exception as e:
            logger.error(f"Failed to get device info: {e}", exc_info=True)
            return None

    def get_raw_state(self) -> Optional[Dict]:
        """
        Hamta radata fran Halo (senaste state utan bearbetning)

        Returns:
            Ra JSON-data fran API
        """
        return self.get_latest_state()

    def get_ble_devices(self) -> Optional[List[Dict]]:
        """
        Försök hämta alla BLE-enheter i närheten från Halo 3C.

        Halo 3C har en BLE-scanner som kan detektera enheter i närheten.
        Denna endpoint försöker hämta scan-data om tillgängligt.

        Returns:
            Lista med BLE-enheter eller None om ej tillgängligt
        """
        global _last_successful_contact, _last_contact_error

        # Försök flera möjliga endpoints för BLE-scanning
        ble_endpoints = [
            "/api/config/gstate/blebcn",
            "/api/device/blescan",
            "/api/config/blebcn/scan",
        ]

        devices = []

        for endpoint in ble_endpoints:
            try:
                url = f"{self.protocol}://{self.ip}{endpoint}"
                response = requests.get(
                    url,
                    auth=self.auth,
                    timeout=self.timeout,
                    verify=False
                )

                if response.ok:
                    data = response.json()
                    _last_successful_contact = datetime.utcnow()
                    _last_contact_error = None

                    # Extrahera enheter beroende på response-format
                    if isinstance(data, list):
                        devices.extend(data)
                    elif isinstance(data, dict):
                        # Kolla efter vanliga nyckelnamn
                        for key in ['devices', 'beacons', 'scan', 'data', 'results']:
                            if key in data and isinstance(data[key], list):
                                devices.extend(data[key])
                                break
                        else:
                            # Om det är en enkel beacon-struktur
                            if 'id' in data or 'mac' in data or 'address' in data:
                                devices.append(data)

                    logger.debug(f"Found {len(devices)} BLE devices from {endpoint}")

            except requests.exceptions.RequestException as e:
                logger.debug(f"BLE endpoint {endpoint} not available: {e}")
            except Exception as e:
                logger.debug(f"Error accessing BLE endpoint {endpoint}: {e}")

        # Extrahera också beacons från huvudstate
        try:
            state = self.get_latest_state()
            if state:
                blebcn = state.get('blebcn', {})
                if isinstance(blebcn, dict):
                    # Kolla data/alert-strukturen
                    alert_data = blebcn.get('data', {}).get('alert', {})
                    if alert_data and alert_data.get('id'):
                        # Lägg till som beacon om inte redan finns
                        beacon_id = alert_data.get('id')
                        if not any(d.get('id') == beacon_id or d.get('beacon_id') == beacon_id for d in devices):
                            devices.append({
                                'id': beacon_id,
                                'name': alert_data.get('name', ''),
                                'type': 'registered_beacon',
                                'rssi': alert_data.get('rssi', 0),
                                'battery': alert_data.get('battery', 0),
                                'status': alert_data.get('status', 0),
                                'filter_rssi': alert_data.get('filter_rssi', 0),
                            })
        except Exception as e:
            logger.debug(f"Could not extract beacon from state: {e}")

        return devices if devices else None

    def get_event_state(self) -> Optional[Dict]:
        """
        Hämta status för alla händelser från Halo 3C

        Returns:
            Dictionary med event states eller None vid fel
        """
        global _last_successful_contact, _last_contact_error

        try:
            url = f"{self.protocol}://{self.ip}/api/config/gstate/event_state"
            response = requests.get(
                url,
                auth=self.auth,
                timeout=self.timeout,
                verify=False
            )
            response.raise_for_status()
            data = response.json()

            # Uppdatera heartbeat
            _last_successful_contact = datetime.utcnow()
            _last_contact_error = None

            logger.debug(f"Successfully fetched event state from {url}")
            return data

        except requests.exceptions.RequestException as e:
            _last_contact_error = str(e)
            logger.error(f"Failed to fetch event state: {e}")
            return None
        except Exception as e:
            _last_contact_error = str(e)
            logger.error(f"Unexpected error fetching event state: {e}", exc_info=True)
            return None

    def get_full_config(self) -> Optional[Dict]:
        """
        Hämta fullständig konfiguration från Halo 3C

        Returns:
            Dictionary med hela konfigurationen, eller None vid fel
        """
        global _last_successful_contact, _last_contact_error

        try:
            url = f"{self.protocol}://{self.ip}/api/config"
            response = requests.get(
                url,
                auth=self.auth,
                timeout=self.timeout,
                verify=False
            )
            response.raise_for_status()
            data = response.json()

            # Uppdatera heartbeat
            _last_successful_contact = datetime.utcnow()
            _last_contact_error = None

            logger.debug(f"Successfully fetched full config from {url}")
            return data

        except requests.exceptions.RequestException as e:
            _last_contact_error = str(e)
            logger.error(f"Failed to fetch full config: {e}")
            return None
        except Exception as e:
            _last_contact_error = str(e)
            logger.error(f"Unexpected error fetching full config: {e}", exc_info=True)
            return None

    def update_config(self, config: Dict) -> bool:
        """
        Uppdatera konfiguration på Halo 3C

        Args:
            config: Dictionary med konfiguration att uppdatera

        Returns:
            True om uppdateringen lyckades, False annars
        """
        global _last_successful_contact, _last_contact_error

        try:
            url = f"{self.protocol}://{self.ip}/api/config"
            response = requests.post(
                url,
                auth=self.auth,
                json=config,
                timeout=self.timeout,
                verify=False
            )
            response.raise_for_status()

            # Uppdatera heartbeat
            _last_successful_contact = datetime.utcnow()
            _last_contact_error = None

            logger.info(f"Successfully updated Halo config")
            return True

        except requests.exceptions.RequestException as e:
            _last_contact_error = str(e)
            logger.error(f"Failed to update config: {e}")
            return False
        except Exception as e:
            _last_contact_error = str(e)
            logger.error(f"Unexpected error updating config: {e}", exc_info=True)
            return False

    def get_rtsp_config(self) -> Optional[Dict]:
        """
        Hämta RTSP-konfiguration från Halo 3C

        Returns:
            Dictionary med RTSP-konfiguration, eller None vid fel
        """
        try:
            config = self.get_full_config()
            if config:
                return config.get("rtsp", {})
            return None
        except Exception as e:
            logger.error(f"Failed to get RTSP config: {e}", exc_info=True)
            return None

    def update_rtsp_config(self, rtsp_config: Dict) -> bool:
        """
        Uppdatera RTSP-konfiguration på Halo 3C

        Args:
            rtsp_config: Dictionary med RTSP-inställningar att uppdatera

        Returns:
            True om uppdateringen lyckades, False annars
        """
        try:
            # Hämta nuvarande config
            config = self.get_full_config()
            if not config:
                logger.error("Could not fetch current config for RTSP update")
                return False

            # Uppdatera RTSP-sektionen
            config["rtsp"] = rtsp_config

            # Skicka uppdaterad config
            return self.update_config(config)

        except Exception as e:
            logger.error(f"Failed to update RTSP config: {e}", exc_info=True)
            return False

    def get_bacnet_config(self) -> Optional[Dict]:
        """
        Hämta BACnet-konfiguration från Halo 3C

        Returns:
            Dictionary med BACnet-konfiguration, eller None vid fel
        """
        try:
            config = self.get_full_config()
            if config:
                return config.get("bacnet", {})
            return None
        except Exception as e:
            logger.error(f"Failed to get BACnet config: {e}", exc_info=True)
            return None

    def update_bacnet_config(self, bacnet_config: Dict) -> bool:
        """
        Uppdatera BACnet-konfiguration på Halo 3C

        Args:
            bacnet_config: Dictionary med BACnet-inställningar att uppdatera

        Returns:
            True om uppdateringen lyckades, False annars
        """
        try:
            # Hämta nuvarande config
            config = self.get_full_config()
            if not config:
                logger.error("Could not fetch current config for BACnet update")
                return False

            # Uppdatera BACnet-sektionen
            config["bacnet"] = bacnet_config

            # Skicka uppdaterad config
            return self.update_config(config)

        except Exception as e:
            logger.error(f"Failed to update BACnet config: {e}", exc_info=True)
            return False

