"""
Halo Client - Hämtar data från Halo 3C sensor
"""
import requests
from requests.auth import HTTPBasicAuth
from typing import Dict, Optional
import logging
from datetime import datetime
import urllib3

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)


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

            logger.debug(f"Successfully fetched Halo state from {url}")
            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch Halo state: {e}")
            return None
        except Exception as e:
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
        Kontrollera om Halo sensorn är tillgänglig

        Returns:
            True om sensorn svarar
        """
        try:
            state = self.get_latest_state()
            return state is not None
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False

