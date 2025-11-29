"""
Event Pydantic models
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class EventType(str, Enum):
    """Event-typer - Alla Halo 3C event types plus system events"""
    # System events
    NOISE = "NOISE"
    KNOCK = "KNOCK"
    SENSOR_THRESHOLD = "SENSOR_THRESHOLD"
    SYSTEM = "SYSTEM"

    # Beacon events
    BEACON_PANIC_BUTTON = "BEACON_PANIC_BUTTON"
    BEACON_ARRIVED = "BEACON_ARRIVED"
    BEACON_DEPARTED = "BEACON_DEPARTED"
    BEACON_LOW_BATTERY = "BEACON_LOW_BATTERY"

    # Grupp 1: Vaping/Smoking
    VAPE = "Vape"
    THC = "THC"
    MASKING = "Masking"
    SMOKING = "Smoking"

    # Grupp 4: Säkerhet
    GUNSHOT = "Gunshot"
    AGGRESSION = "Aggression"
    TAMPER = "Tamper"
    HELP = "Help"
    MOTION = "Motion"

    # Grupp 8: Luftkvalitet
    HEALTH_INDEX = "Health_Index"
    AQI = "AQI"
    TVOC = "TVOC"
    CO2CAL = "CO2cal"
    PM2_5 = "PM2.5"

    # Grupp 16: Miljövarningar
    PM1 = "PM1"
    PM10 = "PM10"
    HUMIDITY = "Humidity"
    HUMIDITY_LOW = "Humidity_Low"
    TEMP_C = "Temp_C"
    TEMP_C_LOW = "Temp_C_Low"
    NO2 = "NO2"
    CO = "CO"
    NH3 = "NH3"
    PRESSURE = "Pressure"
    LIGHT = "Light"
    SOUND = "Sound"


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

