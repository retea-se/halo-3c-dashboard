"""
WebSocket endpoint för real-time event stream
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set, Optional
import json
import logging
import asyncio
from datetime import datetime

from models.events import Event

logger = logging.getLogger(__name__)

router = APIRouter()

# Håll koll på aktiva WebSocket-anslutningar
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.event_service: Optional[EventService] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message to WebSocket: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        """Broadcast message till alla anslutna klienter"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to WebSocket: {e}")
                disconnected.append(connection)

        # Ta bort disconnectade anslutningar
        for connection in disconnected:
            self.disconnect(connection)



manager = ConnectionManager()


@router.websocket("/api/events/stream")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint för real-time event stream

    Klienter kan ansluta för att få real-time uppdateringar när nya events skapas.
    """
    await manager.connect(websocket)

    try:
        # Skicka välkomstmeddelande
        await manager.send_personal_message(
            json.dumps({
                "type": "connected",
                "message": "Connected to event stream",
                "timestamp": datetime.utcnow().isoformat()
            }),
            websocket
        )

        # Håll anslutningen öppen och vänta på meddelanden
        while True:
            # Ta emot meddelanden från klienten (heartbeat, etc.)
            try:
                data = await websocket.receive_text()
                # Hantera heartbeat eller andra meddelanden från klienten
                try:
                    message = json.loads(data)
                    if message.get("type") == "ping":
                        await manager.send_personal_message(
                            json.dumps({
                                "type": "pong",
                                "timestamp": datetime.utcnow().isoformat()
                            }),
                            websocket
                        )
                except json.JSONDecodeError:
                    pass
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error receiving WebSocket message: {e}")
                break

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        manager.disconnect(websocket)


async def broadcast_new_event(event: Event):
    """
    Broadcast ett nytt event till alla anslutna WebSocket-klienter

    Args:
        event: Event att broadcasta
    """
    try:
        message = json.dumps({
            "type": "new_event",
            "event": {
                "id": event.id,
                "timestamp": event.timestamp.isoformat(),
                "type": event.type.value,
                "severity": event.severity.value,
                "source": event.source,
                "summary": event.summary,
                "details": event.details,
                "status": event.status.value,
                "device_id": event.device_id,
                "location": event.location,
                "sensor_metadata_id": event.sensor_metadata_id,
                "threshold_value": event.threshold_value,
                "current_value": event.current_value
            }
        })
        await manager.broadcast(message)
        logger.debug(f"Broadcasted new event: {event.id}")
    except Exception as e:
        logger.error(f"Failed to broadcast event: {e}", exc_info=True)
