"""
Occupancy Service - Detekterar om rummet är bemannat
Använder CO2, ljud och BLE-beacons för att avgöra närvaro
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from enum import Enum

logger = logging.getLogger(__name__)


class OccupancyState(str, Enum):
    OCCUPIED = "occupied"
    VACANT = "vacant"
    UNCERTAIN = "uncertain"


class OccupancyService:
    """
    Service för att detektera rumsnärvaro baserat på sensordata.

    Använder en poängbaserad approach:
    - CO2-nivå > 800 ppm: +3 poäng
    - CO2-nivå > 600 ppm: +1 poäng
    - Ljudnivå > 55 dB: +2 poäng
    - Ljudnivå > 45 dB: +1 poäng
    - BLE Beacon närvarande: +5 poäng (mest pålitlig)

    Tröskel för "occupied": >= 3 poäng
    Tröskel för "vacant": <= 1 poäng
    Mellanläge: "uncertain"
    """

    # CO2-trösklar
    CO2_HIGH_THRESHOLD = 800      # ppm - stark indikation på närvaro
    CO2_MEDIUM_THRESHOLD = 600    # ppm - möjlig närvaro
    CO2_BASELINE = 420            # ppm - utomhusnivå

    # Ljudtrösklar
    AUDIO_HIGH_THRESHOLD = 55     # dB - aktivitet
    AUDIO_MEDIUM_THRESHOLD = 45   # dB - möjlig närvaro
    AUDIO_BASELINE = 35           # dB - tyst rum

    # Poängtrösklar
    OCCUPIED_THRESHOLD = 3
    VACANT_THRESHOLD = 1

    def __init__(self):
        self._last_state: Optional[OccupancyState] = None
        self._last_change: Optional[datetime] = None
        self._state_history: List[Dict] = []

    def get_occupancy_status(
        self,
        device_id: str = "halo-device-1",
        include_details: bool = True
    ) -> Dict[str, Any]:
        """
        Hämta aktuell närvaro-status baserat på sensordata.

        Args:
            device_id: Enhets-ID för sensorn
            include_details: Inkludera detaljerad poängberäkning

        Returns:
            Dictionary med occupancy-status och metadata
        """
        try:
            from services.sensors import SensorService
            from services.beacons import BeaconService
        except ImportError:
            # Fallback om services inte finns
            logger.warning("Could not import sensor services, returning uncertain state")
            return self._create_uncertain_response("Services not available")

        sensor_service = SensorService()
        beacon_service = BeaconService()

        # Hämta senaste sensorvärden
        try:
            latest_values = sensor_service.get_latest_sensor_values(device_id)
        except Exception as e:
            logger.warning(f"Failed to get sensor values: {e}")
            latest_values = {}

        # Extrahera relevanta värden
        co2_value = self._extract_sensor_value(latest_values, ["co2sensor/co2", "co2sensor/co2fo"])
        audio_value = self._extract_sensor_value(latest_values, ["audsensor/sum"])

        # Kolla BLE-beacons
        try:
            beacons = beacon_service.get_beacons()
            beacon_present = any(
                b.get("present", False) or b.get("rssi", -100) > -80
                for b in beacons
            )
        except Exception as e:
            logger.warning(f"Failed to get beacon data: {e}")
            beacon_present = False
            beacons = []

        # Beräkna poäng
        score, score_breakdown = self._calculate_occupancy_score(
            co2_value=co2_value,
            audio_value=audio_value,
            beacon_present=beacon_present
        )

        # Bestäm status
        if score >= self.OCCUPIED_THRESHOLD:
            state = OccupancyState.OCCUPIED
        elif score <= self.VACANT_THRESHOLD:
            state = OccupancyState.VACANT
        else:
            state = OccupancyState.UNCERTAIN

        # Skapa respons
        response = {
            "state": state.value,
            "occupied": state == OccupancyState.OCCUPIED,
            "score": score,
            "threshold": self.OCCUPIED_THRESHOLD,
            "confidence": self._calculate_confidence(score),
            "timestamp": datetime.utcnow().isoformat(),
            "device_id": device_id,
        }

        if include_details:
            response["details"] = {
                "co2": {
                    "value": co2_value,
                    "unit": "ppm",
                    "contribution": score_breakdown.get("co2", 0),
                    "thresholds": {
                        "high": self.CO2_HIGH_THRESHOLD,
                        "medium": self.CO2_MEDIUM_THRESHOLD,
                        "baseline": self.CO2_BASELINE,
                    }
                },
                "audio": {
                    "value": audio_value,
                    "unit": "dB",
                    "contribution": score_breakdown.get("audio", 0),
                    "thresholds": {
                        "high": self.AUDIO_HIGH_THRESHOLD,
                        "medium": self.AUDIO_MEDIUM_THRESHOLD,
                        "baseline": self.AUDIO_BASELINE,
                    }
                },
                "beacon": {
                    "present": beacon_present,
                    "count": len([b for b in beacons if b.get("present", False)]),
                    "contribution": score_breakdown.get("beacon", 0),
                }
            }
            response["score_breakdown"] = score_breakdown

        # Uppdatera state-historik
        self._update_state_history(state, score)

        return response

    def _extract_sensor_value(
        self,
        sensor_data: Dict,
        possible_paths: List[str]
    ) -> Optional[float]:
        """Extrahera sensorvärde från olika möjliga paths."""
        if not sensor_data:
            return None

        sensors = sensor_data.get("sensors", [])

        for sensor in sensors:
            sensor_id = sensor.get("sensor_id", "")
            # Normalisera sensor_id (ersätt _ med /)
            normalized_id = sensor_id.replace("_", "/")

            for path in possible_paths:
                if normalized_id == path or sensor_id == path.replace("/", "_"):
                    values = sensor.get("values", {})
                    # Försök hitta värde i values dict
                    for key in ["value", "val", path.split("/")[-1]]:
                        if key in values:
                            try:
                                return float(values[key])
                            except (ValueError, TypeError):
                                pass
                    # Om values är direkt ett nummer
                    if isinstance(values, (int, float)):
                        return float(values)

        return None

    def _calculate_occupancy_score(
        self,
        co2_value: Optional[float],
        audio_value: Optional[float],
        beacon_present: bool
    ) -> tuple[int, Dict[str, int]]:
        """
        Beräkna occupancy-poäng baserat på sensorvärden.

        Returns:
            Tuple med (total_score, breakdown_dict)
        """
        score = 0
        breakdown = {"co2": 0, "audio": 0, "beacon": 0}

        # CO2-poäng
        if co2_value is not None:
            if co2_value >= self.CO2_HIGH_THRESHOLD:
                breakdown["co2"] = 3
            elif co2_value >= self.CO2_MEDIUM_THRESHOLD:
                breakdown["co2"] = 1

        # Ljud-poäng
        if audio_value is not None:
            if audio_value >= self.AUDIO_HIGH_THRESHOLD:
                breakdown["audio"] = 2
            elif audio_value >= self.AUDIO_MEDIUM_THRESHOLD:
                breakdown["audio"] = 1

        # Beacon-poäng (högst prioritet)
        if beacon_present:
            breakdown["beacon"] = 5

        score = sum(breakdown.values())
        return score, breakdown

    def _calculate_confidence(self, score: int) -> str:
        """Beräkna konfidens baserat på poäng."""
        if score >= 5:
            return "high"
        elif score >= 3:
            return "medium"
        else:
            return "low"

    def _create_uncertain_response(self, reason: str) -> Dict[str, Any]:
        """Skapa ett "uncertain" response."""
        return {
            "state": OccupancyState.UNCERTAIN.value,
            "occupied": False,
            "score": 0,
            "threshold": self.OCCUPIED_THRESHOLD,
            "confidence": "low",
            "timestamp": datetime.utcnow().isoformat(),
            "error": reason,
        }

    def _update_state_history(self, state: OccupancyState, score: int) -> None:
        """Uppdatera state-historik för trend-analys."""
        now = datetime.utcnow()

        # Kolla om state har ändrats
        if self._last_state != state:
            self._last_state = state
            self._last_change = now

        # Lägg till i historik (max 100 poster)
        self._state_history.append({
            "timestamp": now.isoformat(),
            "state": state.value,
            "score": score,
        })

        # Begränsa historikstorlek
        if len(self._state_history) > 100:
            self._state_history = self._state_history[-100:]

    def get_occupancy_history(
        self,
        device_id: str = "halo-device-1",
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Hämta occupancy-historik för trendanalys.

        Args:
            device_id: Enhets-ID
            hours: Antal timmar bakåt att hämta

        Returns:
            Dictionary med historik och statistik
        """
        # För nu returnera in-memory historik
        # I framtiden: hämta från InfluxDB

        cutoff = datetime.utcnow() - timedelta(hours=hours)
        recent_history = [
            h for h in self._state_history
            if datetime.fromisoformat(h["timestamp"]) > cutoff
        ]

        # Beräkna statistik
        occupied_count = sum(1 for h in recent_history if h["state"] == "occupied")
        total_count = len(recent_history) or 1

        return {
            "device_id": device_id,
            "period_hours": hours,
            "history": recent_history,
            "statistics": {
                "occupied_percentage": round(occupied_count / total_count * 100, 1),
                "sample_count": total_count,
                "last_change": self._last_change.isoformat() if self._last_change else None,
            }
        }


# Singleton instance
_occupancy_service: Optional[OccupancyService] = None


def get_occupancy_service() -> OccupancyService:
    """Hämta global OccupancyService instans."""
    global _occupancy_service
    if _occupancy_service is None:
        _occupancy_service = OccupancyService()
    return _occupancy_service
