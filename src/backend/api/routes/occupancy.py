"""
Occupancy routes - API endpoints för rumsnärvaro-detektering
"""
from fastapi import APIRouter, HTTPException, Query, Depends
import logging
from typing import Optional

from api.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status")
async def get_occupancy_status(
    device_id: Optional[str] = Query(default="halo-device-1", description="Enhets-ID"),
    include_details: bool = Query(default=True, description="Inkludera detaljerad poängberäkning"),
    current_user: dict = Depends(get_current_user)
):
    """
    Hämta aktuell närvaro-status baserat på sensordata.

    Requires authentication.

    Använder en poängbaserad approach med CO2, ljud och BLE-beacons.

    Returns:
        OccupancyStatus med state (occupied/vacant/uncertain), score och detaljer
    """
    try:
        from services.occupancy import get_occupancy_service

        service = get_occupancy_service()
        status = service.get_occupancy_status(
            device_id=device_id,
            include_details=include_details
        )
        return status

    except Exception as e:
        logger.error(f"Failed to get occupancy status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_occupancy_history(
    device_id: Optional[str] = Query(default="halo-device-1", description="Enhets-ID"),
    hours: int = Query(default=24, ge=1, le=168, description="Antal timmar bakåt (max 7 dagar)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Hämta occupancy-historik för trendanalys.

    Requires authentication.

    Returns:
        Historik med statistik över angiven period
    """
    try:
        from services.occupancy import get_occupancy_service

        service = get_occupancy_service()
        history = service.get_occupancy_history(
            device_id=device_id,
            hours=hours
        )
        return history

    except Exception as e:
        logger.error(f"Failed to get occupancy history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_occupancy_config(
    current_user: dict = Depends(get_current_user)
):
    """
    Hämta konfiguration för occupancy-detektering.

    Requires authentication.

    Returns:
        Tröskelvärden och poängsystem
    """
    from services.occupancy import OccupancyService

    return {
        "thresholds": {
            "co2": {
                "high": OccupancyService.CO2_HIGH_THRESHOLD,
                "medium": OccupancyService.CO2_MEDIUM_THRESHOLD,
                "baseline": OccupancyService.CO2_BASELINE,
                "unit": "ppm"
            },
            "audio": {
                "high": OccupancyService.AUDIO_HIGH_THRESHOLD,
                "medium": OccupancyService.AUDIO_MEDIUM_THRESHOLD,
                "baseline": OccupancyService.AUDIO_BASELINE,
                "unit": "dB"
            }
        },
        "scoring": {
            "co2_high": 3,
            "co2_medium": 1,
            "audio_high": 2,
            "audio_medium": 1,
            "beacon_present": 5
        },
        "state_thresholds": {
            "occupied": OccupancyService.OCCUPIED_THRESHOLD,
            "vacant": OccupancyService.VACANT_THRESHOLD
        },
        "description": {
            "occupied": "Rummet är bemannat (score >= occupied_threshold)",
            "vacant": "Rummet är tomt (score <= vacant_threshold)",
            "uncertain": "Osäker status (score mellan vacant och occupied)"
        }
    }
