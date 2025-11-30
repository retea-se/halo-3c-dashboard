"""
Beacon routes - BLE Beacon endpoints
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime
import logging

from services.beacons import BeaconService
from api.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# Initiera Beacon Service
_beacon_service: Optional[BeaconService] = None

def get_beacon_service() -> BeaconService:
    """Get or create Beacon Service instance"""
    global _beacon_service
    if _beacon_service is None:
        _beacon_service = BeaconService()
    return _beacon_service


@router.get("")
async def get_all_beacons(
    device_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> List[dict]:
    """
    Lista alla kända beacons med senaste status

    Requires authentication.

    Args:
        device_id: Device ID (optional)

    Returns:
        Lista med beacon-status
    """
    try:
        service = get_beacon_service()
        beacons = service.get_all_beacons(device_id=device_id)
        return beacons
    except Exception as e:
        logger.error(f"Failed to get all beacons: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{beacon_id}")
async def get_beacon_details(
    beacon_id: str,
    device_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Detaljerad info om specifik beacon

    Requires authentication.

    Args:
        beacon_id: Beacon-ID
        device_id: Device ID (optional)

    Returns:
        Detaljerad beacon-information
    """
    try:
        service = get_beacon_service()
        beacon = service.get_beacon_details(beacon_id, device_id=device_id)

        if beacon is None:
            raise HTTPException(status_code=404, detail=f"Beacon {beacon_id} not found")

        return beacon
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get beacon details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{beacon_id}/history")
async def get_beacon_history(
    beacon_id: str,
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    limit: int = Query(100, ge=1, le=10000),
    device_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> List[dict]:
    """
    Närvarohistorik för specifik beacon

    Requires authentication.

    Args:
        beacon_id: Beacon-ID
        from_time: Starttid (ISO8601, optional)
        to_time: Sluttid (ISO8601, optional)
        limit: Max antal datapoints (1-10000)
        device_id: Device ID (optional)

    Returns:
        Historik med RSSI, batteri, närvaro över tid
    """
    try:
        service = get_beacon_service()
        history = service.get_beacon_history(
            beacon_id=beacon_id,
            from_time=from_time,
            to_time=to_time,
            limit=limit,
            device_id=device_id
        )
        return history
    except Exception as e:
        logger.error(f"Failed to get beacon history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{beacon_id}/alerts")
async def get_beacon_alerts(
    beacon_id: str,
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=1000),
    device_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> List[dict]:
    """
    Panikknapp-events för specifik beacon

    Requires authentication.

    Args:
        beacon_id: Beacon-ID
        from_time: Starttid (ISO8601, optional)
        to_time: Sluttid (ISO8601, optional)
        limit: Max antal alerts (1-1000)
        device_id: Device ID (optional)

    Returns:
        Lista med panikknapp-events
    """
    try:
        service = get_beacon_service()
        alerts = service.get_beacon_alerts(
            beacon_id=beacon_id,
            from_time=from_time,
            to_time=to_time,
            limit=limit,
            device_id=device_id
        )
        return alerts
    except Exception as e:
        logger.error(f"Failed to get beacon alerts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/presence/current")
async def get_current_presence(
    device_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> List[dict]:
    """
    Alla närvarande beacons just nu

    Requires authentication.

    Args:
        device_id: Device ID (optional)

    Returns:
        Lista med beacons där is_present == true
    """
    try:
        service = get_beacon_service()
        beacons = service.get_current_presence(device_id=device_id)
        return beacons
    except Exception as e:
        logger.error(f"Failed to get current presence: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
