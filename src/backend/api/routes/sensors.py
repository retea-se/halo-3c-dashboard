"""
Sensor routes - inkluderar sensor metadata och sensor-data endpoints
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime
import json
import logging
from pathlib import Path

from services.sensors import SensorService
from api.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# Initiera Sensor Service
_sensor_service: Optional[SensorService] = None

def get_sensor_service() -> SensorService:
    """Get or create Sensor Service instance"""
    global _sensor_service
    if _sensor_service is None:
        _sensor_service = SensorService()
    return _sensor_service

# Ladda sensor metadata
def load_sensor_metadata():
    """Ladda sensor metadata från JSON-fil"""
    # Path: src/backend/api/routes/sensors.py -> src/backend/data/sensor_metadata.json
    metadata_path = Path(__file__).parent.parent.parent / "data" / "sensor_metadata.json"

    if not metadata_path.exists():
        raise FileNotFoundError(f"Sensor metadata file not found: {metadata_path}")

    with open(metadata_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data.get("sensors", [])


@router.get("/meta")
async def get_all_sensor_metadata(
    current_user: dict = Depends(get_current_user)
) -> List[dict]:
    """
    Hämta metadata för alla sensorer

    Requires authentication.

    Returns:
        Lista med sensor-metadata
    """
    try:
        sensors = load_sensor_metadata()
        return sensors
    except Exception as e:
        logger.error(f"Error loading sensor metadata: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error loading sensor metadata: {str(e)}")


@router.get("/meta/{sensor_id:path}")
async def get_sensor_metadata(
    sensor_id: str,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Hamta metadata for en specifik sensor

    Requires authentication.

    Args:
        sensor_id: Sensor-ID (t.ex. "co2sensor_co2" eller "htsensor/ctemp")

    Returns:
        Sensor-metadata
    """
    try:
        sensors = load_sensor_metadata()

        # Normalisera sensor_id: konvertera / till _ for matchning
        normalized_id = sensor_id.replace("/", "_")

        # Sok forst pa exakt matchning, sedan pa normaliserad
        sensor = next(
            (s for s in sensors if s.get("id") == sensor_id or s.get("id") == normalized_id),
            None
        )

        # Sok ocksa pa technical_name
        if not sensor:
            sensor = next(
                (s for s in sensors if s.get("technical_name") == sensor_id),
                None
            )

        if not sensor:
            raise HTTPException(status_code=404, detail=f"Sensor {sensor_id} not found")

        return sensor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading sensor metadata: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error loading sensor metadata: {str(e)}")


@router.get("/latest")
async def get_latest_sensor_values(
    device_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Hämta senaste sensorvärden från InfluxDB

    Requires authentication.

    Args:
        device_id: Device ID (optional)

    Returns:
        Dictionary med senaste sensorvärden
    """
    try:
        service = get_sensor_service()
        result = service.get_latest_sensor_values(device_id=device_id)
        return result
    except Exception as e:
        logger.error(f"Failed to get latest sensor values: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_sensor_history(
    sensor_id: str = Query(..., description="Sensor ID (e.g., htsensor/ctemp)"),
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    limit: int = Query(1000, ge=1, le=10000),
    device_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Hämta historik för en specifik sensor

    Requires authentication.

    Args:
        sensor_id: Sensor ID (e.g., htsensor/ctemp)
        from_time: Starttid (ISO8601, optional)
        to_time: Sluttid (ISO8601, optional)
        limit: Max antal datapoints (1-10000)
        device_id: Device ID (optional)

    Returns:
        Lista med historiska värden
    """
    try:
        service = get_sensor_service()

        # Specialhantering för heartbeat
        if sensor_id == "heartbeat/status" or sensor_id == "heartbeat":
            history = service.get_heartbeat_history(
                from_time=from_time,
                to_time=to_time,
                limit=limit,
                device_id=device_id
            )
            return history

        history = service.get_sensor_history(
            sensor_id=sensor_id,
            from_time=from_time,
            to_time=to_time,
            limit=limit,
            device_id=device_id
        )
        return history
    except Exception as e:
        logger.error(f"Failed to get sensor history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/heartbeat/history")
async def get_heartbeat_history(
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    limit: int = Query(1000, ge=1, le=10000),
    device_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Hämta heartbeat-historik för att se när Halo varit nåbar/onåbar

    Requires authentication.

    Args:
        from_time: Starttid (ISO8601, optional)
        to_time: Sluttid (ISO8601, optional)
        limit: Max antal datapoints (1-10000)
        device_id: Device ID (optional)

    Returns:
        Lista med heartbeat-historik
    """
    try:
        service = get_sensor_service()
        history = service.get_heartbeat_history(
            from_time=from_time,
            to_time=to_time,
            limit=limit,
            device_id=device_id
        )
        return history
    except Exception as e:
        logger.error(f"Failed to get heartbeat history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
