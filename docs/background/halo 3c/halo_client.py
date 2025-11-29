#!/usr/bin/env python3
"""
Halo 3c Python Client
En enkel klient för att interagera med Halo 3c API:t
"""

import requests
from requests.auth import HTTPBasicAuth
import json
from typing import Dict, List, Any, Optional
import urllib3

# Inaktivera SSL-varningar
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class HaloClient:
    """
    Klient för Halo 3c Smart Sensor API

    Usage:
        client = HaloClient("REDACTED_HALO_IP", "admin", "password")
        temp = client.get_temperature()
        sensors = client.get_all_sensors()
    """

    def __init__(self, ip: str, username: str, password: str):
        """
        Initialisera Halo-klient

        Args:
            ip: Halo-enhetens IP-adress
            username: Användarnamn
            password: Lösenord
        """
        self.ip = ip
        self.base_url = f"http://{ip}"
        self.auth = HTTPBasicAuth(username, password)
        self.session = requests.Session()
        self.session.auth = self.auth
        self.session.verify = False

    def _get(self, endpoint: str) -> Any:
        """Intern metod för GET-requests"""
        response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
        response.raise_for_status()
        return response.json()

    def _post(self, endpoint: str, data: Dict) -> Any:
        """Intern metod för POST-requests"""
        response = self.session.post(
            f"{self.base_url}{endpoint}",
            json=data,
            timeout=10
        )
        response.raise_for_status()
        return response.json()

    # ===== Konfiguration =====

    def get_config(self) -> Dict:
        """Hämta komplett enhetskonfiguration"""
        return self._get("/api/config")

    def get_device_name(self) -> str:
        """Hämta enhetens namn"""
        config = self.get_config()
        return config.get("devicename", "Unknown")

    def set_device_name(self, name: str) -> Dict:
        """Ändra enhetens namn"""
        return self._post("/api/config", {"devicename": name})

    def get_volume(self) -> int:
        """Hämta högtalarvolym (0-255)"""
        config = self.get_config()
        return config.get("volume", 0)

    def set_volume(self, volume: int) -> Dict:
        """Sätt högtalarvolym (0-255)"""
        if not 0 <= volume <= 255:
            raise ValueError("Volume must be between 0 and 255")
        return self._post("/api/config", {"volume": volume})

    # ===== Sensordata =====

    def get_latest_data(self) -> Dict:
        """Hämta senaste sensoravläsningar"""
        return self._get("/api/config/gstate/latest")

    def get_sensor_list(self) -> List[Dict]:
        """Hämta lista över alla tillgängliga sensorer"""
        return self._get("/api/sensors/list")

    def get_all_sensors(self) -> Dict[str, float]:
        """Hämta alla sensorvärden som dictionary"""
        return self.get_latest_data()

    # ===== Miljösensorer =====

    def get_temperature(self, celsius: bool = True) -> float:
        """Hämta temperatur (Celsius eller Fahrenheit)"""
        data = self.get_latest_data()
        key = 'htsensor/ctemp' if celsius else 'htsensor/ftemp'
        return data.get(key, 0.0)

    def get_humidity(self) -> float:
        """Hämta relativ luftfuktighet (%)"""
        data = self.get_latest_data()
        return data.get('htsensor/humidity', 0.0)

    def get_pressure(self, unit: str = 'hPa') -> float:
        """
        Hämta lufttryck

        Args:
            unit: 'hPa' eller 'inHg'
        """
        data = self.get_latest_data()
        key = 'htsensor/millibar' if unit == 'hPa' else 'htsensor/press'
        return data.get(key, 0.0)

    def get_light(self) -> float:
        """Hämta ljusnivå (lux)"""
        data = self.get_latest_data()
        return data.get('luxsensor/aluxfilt', 0.0)

    # ===== Luftkvalitetssensorer =====

    def get_aqi(self) -> float:
        """Hämta Air Quality Index (0-500)"""
        data = self.get_latest_data()
        return data.get('AQI/value', 0.0)

    def get_co2(self) -> float:
        """Hämta CO2-nivå (ppm)"""
        data = self.get_latest_data()
        return data.get('co2sensor/co2', 0.0)

    def get_tvoc(self) -> float:
        """Hämta TVOC-nivå (ppb)"""
        data = self.get_latest_data()
        return data.get('co2sensor/tvoc', 0.0)

    def get_pm25(self) -> float:
        """Hämta PM2.5 partiklar (µg/m³)"""
        data = self.get_latest_data()
        return data.get('pmsensor/raw/1', 0.0)

    def get_pm10(self) -> float:
        """Hämta PM10 partiklar (µg/m³)"""
        data = self.get_latest_data()
        return data.get('pmsensor/raw/2', 0.0)

    def get_co(self) -> float:
        """Hämta CO-nivå (ppm)"""
        data = self.get_latest_data()
        return data.get('gassensor/co', 0.0)

    def get_no2(self) -> float:
        """Hämta NO2-nivå (ppb)"""
        data = self.get_latest_data()
        return data.get('gassensor/no2', 0.0)

    def get_nh3(self) -> float:
        """Hämta NH3 (ammoniak) nivå (ppm)"""
        data = self.get_latest_data()
        return data.get('gassensor/nh3', 0.0)

    # ===== Ljudsensorer =====

    def get_noise_level(self) -> float:
        """Hämta ljudnivå (dB)"""
        data = self.get_latest_data()
        return data.get('audsensor/sum', 0.0)

    def get_aggression_level(self) -> float:
        """Hämta aggression-nivå"""
        data = self.get_latest_data()
        return data.get('audsensor/rms0', 0.0)

    def get_gunshot_detection(self) -> float:
        """Hämta skottlossning-detektionsvärde"""
        data = self.get_latest_data()
        return data.get('audsensor/gs', 0.0)

    # ===== Rörelsesensorer =====

    def get_motion(self) -> float:
        """Hämta PIR-rörelse"""
        data = self.get_latest_data()
        return data.get('pir/max', 0.0)

    def get_movement(self) -> float:
        """Hämta accelerometer-rörelse"""
        data = self.get_latest_data()
        return data.get('accsensor/move', 0.0)

    def get_acceleration(self) -> Dict[str, float]:
        """Hämta acceleration i alla axlar (x, y, z)"""
        data = self.get_latest_data()
        return {
            'x': data.get('accsensor/x', 0.0),
            'y': data.get('accsensor/y', 0.0),
            'z': data.get('accsensor/z', 0.0)
        }

    # ===== Hälsoindex =====

    def get_health_index(self) -> float:
        """Hämta totalt hälsoindex (0-5)"""
        data = self.get_latest_data()
        return data.get('HealthIndex/val', 0.0)

    def get_health_indexes(self) -> Dict[str, float]:
        """Hämta alla hälsoindex"""
        data = self.get_latest_data()
        return {
            'total': data.get('HealthIndex/val', 0.0),
            'co2': data.get('HealthIndex/co2/val', 0.0),
            'humidity': data.get('HealthIndex/hum/val', 0.0),
            'pm1': data.get('HealthIndex/pm1/val', 0.0),
            'pm25': data.get('HealthIndex/pm2p5/val', 0.0),
            'pm10': data.get('HealthIndex/pm10/val', 0.0),
            'tvoc': data.get('HealthIndex/tvoc/val', 0.0),
            'no2': data.get('HealthIndex/no2/val', 0.0),
        }

    # ===== Händelser =====

    def get_event_state(self) -> Dict:
        """Hämta status för alla händelser"""
        return self._get("/api/config/gstate/event_state")

    def get_active_events(self) -> List[str]:
        """Hämta lista över aktiva händelser"""
        events = self.get_event_state()
        active = []
        for event_id, event_data in events.items():
            if event_id == '$info$':
                continue
            # event_data can be int or dict
            if isinstance(event_data, dict):
                if event_data.get('state') == 1:
                    active.append(event_id)
            elif isinstance(event_data, int) and event_data == 1:
                active.append(event_id)
        return active

    def is_event_active(self, event_id: str) -> bool:
        """Kontrollera om en specifik händelse är aktiv"""
        events = self.get_event_state()
        return events.get(event_id, {}).get('state') == 1

    # ===== Relay-kontroll =====

    def get_relay_status(self) -> Dict:
        """Hämta relay-status"""
        return self._get("/api/config/gstate/relay")

    def is_relay_active(self, relay: int) -> bool:
        """
        Kontrollera om ett relay är aktivt

        Args:
            relay: 1 eller 2
        """
        status = self.get_relay_status()
        key = f'k{relay}'
        return status.get(key, 0) == 1

    # ===== Ljud =====

    def get_audio_files(self) -> List[str]:
        """Hämta lista över tillgängliga ljudfiler"""
        return self._get("/api/wavefiles/list")

    # ===== Loggar =====

    def get_log_files(self) -> List[str]:
        """Hämta lista över tillgängliga loggfiler"""
        return self._get("/api/logs")

    def get_datalogs(self) -> Dict:
        """Hämta dataloggar"""
        return self._get("/api/datalogs")

    # ===== Nätverksinfo =====

    def get_network_info(self) -> Dict:
        """Hämta nätverksinformation"""
        return self._get("/api/device/netinfo")

    def get_wifi_status(self) -> Dict:
        """Hämta WiFi-status"""
        return self._get("/api/device/wifistat")

    # ===== Sammanfattning =====

    def get_summary(self) -> Dict[str, Any]:
        """
        Hämta en sammanfattning av viktig data
        """
        data = self.get_latest_data()
        events = self.get_active_events()
        relay = self.get_relay_status()

        return {
            'device_name': self.get_device_name(),
            'temperature': f"{data.get('htsensor/ctemp', 0):.1f}°C",
            'humidity': f"{data.get('htsensor/humidity', 0):.1f}%",
            'aqi': int(data.get('AQI/value', 0)),
            'co2': int(data.get('co2sensor/co2', 0)),
            'noise': f"{data.get('audsensor/sum', 0):.1f} dB",
            'motion': data.get('pir/max', 0),
            'health_index': data.get('HealthIndex/val', 0),
            'active_events': events,
            'relay1_active': relay.get('k1', 0) == 1,
            'relay2_active': relay.get('k2', 0) == 1,
        }

    def print_summary(self):
        """Skriv ut en lättläst sammanfattning"""
        summary = self.get_summary()

        print("="*60)
        print(f"HALO 3C SUMMARY - {summary['device_name']}")
        print("="*60)
        print(f"\nEnvironment:")
        print(f"  Temperature:    {summary['temperature']}")
        print(f"  Humidity:       {summary['humidity']}")
        print(f"  AQI:            {summary['aqi']}")
        print(f"  CO2:            {summary['co2']} ppm")
        print(f"  Noise:          {summary['noise']}")
        print(f"\nActivity:")
        print(f"  Motion:         {summary['motion']}")
        print(f"  Health Index:   {summary['health_index']}/5")
        print(f"\nRelays:")
        print(f"  Relay 1:        {'ON' if summary['relay1_active'] else 'OFF'}")
        print(f"  Relay 2:        {'ON' if summary['relay2_active'] else 'OFF'}")
        print(f"\nActive Events: {len(summary['active_events'])}")
        for event in summary['active_events']:
            print(f"  - {event}")
        print("="*60)


# ===== Exempel på användning =====

if __name__ == "__main__":
    # Skapa klient
    client = HaloClient("REDACTED_HALO_IP", "admin", "REDACTED_HALO_PASSWORD")

    # Skriv ut sammanfattning
    client.print_summary()

    # Exempel på individuella anrop
    print("\n\nDetaljerad information:")
    print(f"Temperatur: {client.get_temperature():.1f}°C")
    print(f"Luftfuktighet: {client.get_humidity():.1f}%")
    print(f"CO2: {client.get_co2():.0f} ppm")
    print(f"AQI: {client.get_aqi():.0f}")
    print(f"PM2.5: {client.get_pm25():.1f} µg/m³")
    print(f"Ljudnivå: {client.get_noise_level():.1f} dB")

    # Kontrollera händelser
    if client.is_event_active("Vape"):
        print("\nWARNING: Vape-detektion aktiv!")

    if client.is_event_active("Aggression"):
        print("\nWARNING: Aggression detekterad!")

    # Hämta alla hälsoindex
    print("\nHälsoindex:")
    health = client.get_health_indexes()
    for key, value in health.items():
        print(f"  {key}: {value}")
