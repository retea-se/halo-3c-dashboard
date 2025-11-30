"""
Log routes - Rådata från InfluxDB för logg-visning
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
import logging

from services.log import LogService
from api.middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Initiera Log Service
_log_service: Optional[LogService] = None

def get_log_service() -> LogService:
    """Get or create Log Service instance"""
    global _log_service
    if _log_service is None:
        _log_service = LogService()
    return _log_service


@router.get("")
async def get_log_data(
    measurement: Optional[str] = Query(None, description="Measurement-typ (events, sensor, beacon_presence, heartbeat, all)"),
    hours: int = Query(24, ge=1, le=168, description="Antal timmar bakåt (1-168)"),
    limit: int = Query(1000, ge=1, le=10000, description="Max antal rader (1-10000)"),
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Hämta rådata från InfluxDB för logg-visning

    Requires authentication.

    Args:
        measurement: Measurement-typ att filtrera på
            - "all" eller None: Alla measurements
            - "events": Endast events
            - "sensor": Alla sensor_* measurements
            - "beacon_presence": Endast beacon-data
            - "heartbeat": Endast heartbeat
        hours: Antal timmar bakåt (default: 24, max: 168 = 7 dagar)
        limit: Max antal rader att returnera (default: 1000, max: 10000)

    Returns:
        Dictionary med log-data
    """
    try:
        service = get_log_service()
        result = service.get_log_data(
            measurement=measurement,
            hours=hours,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error(f"Failed to get log data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

