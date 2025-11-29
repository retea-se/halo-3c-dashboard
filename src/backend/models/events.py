"""
Event Pydantic models
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class EventType(str, Enum):
    """Event-typer"""
    NOISE = "NOISE"
    KNOCK = "KNOCK"
    SENSOR_THRESHOLD = "SENSOR_THRESHOLD"
    SYSTEM = "SYSTEM"
    BEACON_PANIC_BUTTON = "BEACON_PANIC_BUTTON"
    BEACON_ARRIVED = "BEACON_ARRIVED"
    BEACON_DEPARTED = "BEACON_DEPARTED"
    BEACON_LOW_BATTERY = "BEACON_LOW_BATTERY"


class EventSeverity(str, Enum):
    """Event allvarlighetsgrad"""
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class EventStatus(str, Enum):
    """Event status"""
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class Event(BaseModel):
    """Event model"""
    id: Optional[str] = Field(None, description="Event ID (UUID)")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event timestamp")
    type: EventType = Field(..., description="Event type")
    severity: EventSeverity = Field(..., description="Event severity")
    source: str = Field(..., description="Event source (sensor-id, subsystem, beacon-id)")
    summary: str = Field(..., description="Short event summary")
    details: Dict[str, Any] = Field(default_factory=dict, description="Optional event details")
    status: EventStatus = Field(default=EventStatus.ACTIVE, description="Event status")
    device_id: str = Field(default="halo-device-1", description="Device ID")
    location: Optional[str] = Field(None, description="Optional location")
    sensor_metadata_id: Optional[str] = Field(None, description="Link to sensor metadata")
    threshold_value: Optional[float] = Field(None, description="Threshold value that triggered event")
    current_value: Optional[float] = Field(None, description="Current value when event was triggered")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "timestamp": "2025-01-27T12:00:00Z",
                "type": "SENSOR_THRESHOLD",
                "severity": "WARNING",
                "source": "co2sensor_co2",
                "summary": "CO2 level exceeded 1000 ppm",
                "details": {"sensor": "co2sensor_co2", "value": 1200},
                "status": "ACTIVE",
                "device_id": "halo-device-1",
                "sensor_metadata_id": "co2sensor_co2",
                "threshold_value": 1000,
                "current_value": 1200
            }
        }


class EventCreate(BaseModel):
    """Model for creating a new event"""
    type: EventType
    severity: EventSeverity
    source: str
    summary: str
    details: Dict[str, Any] = Field(default_factory=dict)
    device_id: str = "halo-device-1"
    location: Optional[str] = None
    sensor_metadata_id: Optional[str] = None
    threshold_value: Optional[float] = None
    current_value: Optional[float] = None

