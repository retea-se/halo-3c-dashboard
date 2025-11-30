"""
Event routes - Event/alarm endpoints
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime
import logging
import os

from models.events import Event, EventStatus, EventType, EventSeverity
from services.events import EventService
from api.middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Initiera Event Service
_event_service: Optional[EventService] = None

def get_event_service() -> EventService:
    """Get or create Event Service instance"""
    global _event_service
    if _event_service is None:
        _event_service = EventService(
            url=os.getenv("INFLUXDB_URL", "http://influxdb:8086"),
            token=os.getenv("INFLUXDB_TOKEN", ""),
            org=os.getenv("INFLUXDB_ORG", "halo-org"),
            bucket=os.getenv("INFLUXDB_BUCKET", "halo-sensors")
        )
    return _event_service


@router.get("/latest")
async def get_latest_events(
    limit: int = Query(50, ge=1, le=1000),
    current_user: dict = Depends(get_current_user)
) -> List[Event]:
    """
    Hämta de senaste händelserna

    Requires authentication.

    Args:
        limit: Max antal events att returnera (1-1000)

    Returns:
        Lista med senaste events
    """
    try:
        service = get_event_service()
        events = service.get_latest_events(limit=limit)
        return events
    except Exception as e:
        logger.error(f"Failed to get latest events: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def get_events(
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    event_type: Optional[EventType] = None,
    severity: Optional[EventSeverity] = None,
    status: Optional[EventStatus] = None,
    device_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_user)
) -> List[Event]:
    """
    Hämta events med filtrering

    Requires authentication.

    Args:
        from_time: Starttid för filtrering
        to_time: Sluttid för filtrering
        event_type: Filtrera på event-typ
        severity: Filtrera på severity
        status: Filtrera på status
        device_id: Filtrera på device_id
        limit: Max antal events (1-1000)

    Returns:
        Lista med filtrerade events
    """
    try:
        service = get_event_service()
        events = service.get_events(
            from_time=from_time,
            to_time=to_time,
            event_type=event_type,
            severity=severity,
            status=status,
            device_id=device_id,
            limit=limit
        )
        return events
    except Exception as e:
        logger.error(f"Failed to get events: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ack/{event_id}")
async def acknowledge_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Kvittera ett specifikt larm

    Requires authentication.

    Args:
        event_id: Event ID att kvittera

    Returns:
        Bekräftelse på kvittering
    """
    try:
        service = get_event_service()
        success = service.acknowledge_event(event_id)

        if success:
            return {"message": f"Event {event_id} acknowledged", "status": "success"}
        else:
            raise HTTPException(status_code=400, detail="Failed to acknowledge event")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to acknowledge event: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
