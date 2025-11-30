"""
Integrations routes - RTSP och BACnet konfiguration
"""
from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict
from datetime import datetime
import logging
import os
import socket

from api.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# Pydantic models för validering
class RTSPConfigUpdate(BaseModel):
    """RTSP konfigurationsuppdatering"""
    on: Optional[int] = Field(None, ge=0, le=1, description="Aktivera/inaktivera RTSP (0 eller 1)")
    port: Optional[int] = Field(None, ge=1, le=65535, description="RTSP port (1-65535)")
    auth: Optional[str] = Field(None, description="Autentiseringsmetoder (basic, digest, eller both)")
    user: Optional[str] = Field(None, description="Username för RTSP-autentisering")
    pswd: Optional[str] = Field(None, description="Password för RTSP-autentisering")
    img: Optional[str] = Field(None, description="Stream image path")
    scroll_time: Optional[int] = Field(None, ge=1, description="Scroll time i sekunder")

    @field_validator('auth')
    @classmethod
    def validate_auth(cls, v):
        if v is not None:
            valid_auths = ['basic', 'digest', 'both']
            if v not in valid_auths and ',' not in v:
                # Allow comma-separated like "basic,digest"
                parts = [p.strip() for p in v.split(',')]
                if not all(part in valid_auths for part in parts):
                    raise ValueError(f"Auth måste vara en av: {valid_auths} eller komma-separerad kombination")
        return v


class BACnetConfigUpdate(BaseModel):
    """BACnet konfigurationsuppdatering"""
    on: Optional[bool] = Field(None, description="Aktivera/inaktivera BACnet")
    deviceName: Optional[str] = Field(None, min_length=1, max_length=255, description="Device name")
    instanceNumber: Optional[int] = Field(None, ge=0, le=4194303, description="Instance number (0-4194303)")
    location: Optional[str] = Field(None, description="Location beskrivning")
    port: Optional[int] = Field(None, ge=1, le=65535, description="BACnet port (standard: 47808)")
    foreignDevice: Optional[bool] = Field(None, description="Foreign device mode")
    foreignBBMD: Optional[str] = Field(None, description="Foreign BBMD address")
    foreignTTL: Optional[int] = Field(None, ge=0, description="Foreign TTL")
    covIncrement: Optional[int] = Field(None, ge=0, description="COV increment threshold")

    @field_validator('deviceName', 'instanceNumber')
    @classmethod
    def validate_bacnet_required_fields(cls, v, info):
        """Om on=True, måste deviceName och instanceNumber vara satta"""
        data = info.data
        if info.field_name == 'deviceName' and data.get('on') is True:
            if not v or len(v.strip()) == 0:
                raise ValueError("deviceName måste anges när BACnet är aktiverad")
        if info.field_name == 'instanceNumber' and data.get('on') is True:
            if v is None or v == 0:
                raise ValueError("instanceNumber måste vara > 0 när BACnet är aktiverad")
        return v


def get_halo_client():
    """Skapa HaloClient instans"""
    from collector.halo_client import HaloClient

    halo_ip = os.getenv("HALO_IP", "REDACTED_HALO_IP")
    halo_user = os.getenv("HALO_USER", "admin")
    halo_pass = os.getenv("HALO_PASS", "")

    if not halo_pass:
        return None

    return HaloClient(
        ip=halo_ip,
        username=halo_user,
        password=halo_pass
    )


def test_port_open(ip: str, port: int, protocol: str = "TCP") -> bool:
    """
    Testa om en port är öppen

    Args:
        ip: IP-adress
        port: Portnummer
        protocol: TCP eller UDP

    Returns:
        True om porten är öppen, False annars
    """
    try:
        if protocol == "TCP":
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex((ip, port))
            sock.close()
            return result == 0
        else:  # UDP
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(2)
            try:
                sock.connect((ip, port))
                sock.close()
                return True
            except socket.error:
                return False
    except Exception as e:
        logger.debug(f"Port test failed for {ip}:{port}: {e}")
        return False


# RTSP Endpoints
@router.get("/rtsp/config")
async def get_rtsp_config(
    current_user: dict = Depends(get_current_user)
):
    """
    Hämta RTSP-konfiguration från Halo 3C

    Requires authentication.

    Returns:
        RTSP-konfiguration
    """
    try:
        halo_client = get_halo_client()

        if not halo_client:
            raise HTTPException(
                status_code=503,
                detail="Halo sensor not configured. Set HALO_PASS environment variable."
            )

        rtsp_config = halo_client.get_rtsp_config()

        if rtsp_config is None:
            raise HTTPException(
                status_code=503,
                detail="Could not fetch RTSP configuration from Halo sensor"
            )

        return {
            "rtsp": rtsp_config,
            "fetched_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get RTSP config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/rtsp/config")
async def update_rtsp_config(
    config: RTSPConfigUpdate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Uppdatera RTSP-konfiguration på Halo 3C

    Requires authentication.

    Args:
        config: RTSP-konfigurationsinställningar

    Returns:
        Uppdaterad RTSP-konfiguration
    """
    try:
        halo_client = get_halo_client()

        if not halo_client:
            raise HTTPException(
                status_code=503,
                detail="Halo sensor not configured"
            )

        # Hämta nuvarande config
        current_config = halo_client.get_rtsp_config()
        if current_config is None:
            raise HTTPException(
                status_code=503,
                detail="Could not fetch current RTSP configuration"
            )

        # Merge nya inställningar med nuvarande
        updated_config = current_config.copy()
        update_dict = config.dict(exclude_unset=True, exclude_none=True)
        updated_config.update(update_dict)

        # Uppdatera på Halo
        success = halo_client.update_rtsp_config(updated_config)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to update RTSP configuration on Halo sensor"
            )

        # Hämta uppdaterad config för att verifiera
        updated = halo_client.get_rtsp_config()
        if updated is None:
            raise HTTPException(
                status_code=500,
                detail="Configuration updated but could not verify"
            )

        return {
            "rtsp": updated,
            "updated_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update RTSP config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rtsp/status")
async def get_rtsp_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Hämta RTSP-status (port, stream URL, etc.)

    Requires authentication.

    Returns:
        RTSP-statusinformation
    """
    try:
        halo_client = get_halo_client()

        if not halo_client:
            raise HTTPException(
                status_code=503,
                detail="Halo sensor not configured"
            )

        rtsp_config = halo_client.get_rtsp_config()

        if rtsp_config is None:
            raise HTTPException(
                status_code=503,
                detail="Could not fetch RTSP configuration"
            )

        halo_ip = os.getenv("HALO_IP", "REDACTED_HALO_IP")
        port = rtsp_config.get("port", 8554)
        enabled = rtsp_config.get("on", 0) == 1

        # Testa om porten är öppen
        port_open = False
        if enabled:
            port_open = test_port_open(halo_ip, port, "TCP")

        # Bygg stream URL
        protocol = "rtsp"
        auth_part = ""
        if rtsp_config.get("user") and rtsp_config.get("pswd"):
            auth_part = f"{rtsp_config.get('user')}:{rtsp_config.get('pswd')}@"
        stream_url = f"{protocol}://{auth_part}{halo_ip}:{port}/stream"

        # MJPEG stream URL (alternativ)
        mjpeg_url = f"http://{halo_ip}:{halo_client.protocol == 'https' and 443 or 80}/api/gfx/stream.jpg"

        return {
            "enabled": enabled,
            "port": port,
            "port_open": port_open,
            "stream_url": stream_url if enabled else None,
            "mjpeg_url": mjpeg_url,
            "auth": rtsp_config.get("auth", ""),
            "config": rtsp_config
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get RTSP status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# BACnet Endpoints
@router.get("/bacnet/config")
async def get_bacnet_config(
    current_user: dict = Depends(get_current_user)
):
    """
    Hämta BACnet-konfiguration från Halo 3C

    Requires authentication.

    Returns:
        BACnet-konfiguration
    """
    try:
        halo_client = get_halo_client()

        if not halo_client:
            raise HTTPException(
                status_code=503,
                detail="Halo sensor not configured. Set HALO_PASS environment variable."
            )

        bacnet_config = halo_client.get_bacnet_config()

        if bacnet_config is None:
            raise HTTPException(
                status_code=503,
                detail="Could not fetch BACnet configuration from Halo sensor"
            )

        return {
            "bacnet": bacnet_config,
            "fetched_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get BACnet config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/bacnet/config")
async def update_bacnet_config(
    config: BACnetConfigUpdate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Uppdatera BACnet-konfiguration på Halo 3C

    Requires authentication.

    Args:
        config: BACnet-konfigurationsinställningar

    Returns:
        Uppdaterad BACnet-konfiguration
    """
    try:
        halo_client = get_halo_client()

        if not halo_client:
            raise HTTPException(
                status_code=503,
                detail="Halo sensor not configured"
            )

        # Hämta nuvarande config
        current_config = halo_client.get_bacnet_config()
        if current_config is None:
            raise HTTPException(
                status_code=503,
                detail="Could not fetch current BACnet configuration"
            )

        # Validera att required fields är satta om on=True
        update_dict = config.dict(exclude_unset=True, exclude_none=True)

        # Om aktivering, kontrollera att deviceName och instanceNumber finns
        if update_dict.get("on") is True:
            final_config = current_config.copy()
            final_config.update(update_dict)

            if not final_config.get("deviceName") or not final_config.get("deviceName").strip():
                raise HTTPException(
                    status_code=400,
                    detail="deviceName måste anges när BACnet aktiveras"
                )
            if not final_config.get("instanceNumber") or final_config.get("instanceNumber") == 0:
                raise HTTPException(
                    status_code=400,
                    detail="instanceNumber måste vara > 0 när BACnet aktiveras"
                )

        # Merge nya inställningar med nuvarande
        updated_config = current_config.copy()
        updated_config.update(update_dict)

        # Uppdatera på Halo
        success = halo_client.update_bacnet_config(updated_config)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to update BACnet configuration on Halo sensor"
            )

        # Hämta uppdaterad config för att verifiera
        updated = halo_client.get_bacnet_config()
        if updated is None:
            raise HTTPException(
                status_code=500,
                detail="Configuration updated but could not verify"
            )

        return {
            "bacnet": updated,
            "updated_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update BACnet config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bacnet/status")
async def get_bacnet_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Hämta BACnet-status (port, connection info, etc.)

    Requires authentication.

    Returns:
        BACnet-statusinformation
    """
    try:
        halo_client = get_halo_client()

        if not halo_client:
            raise HTTPException(
                status_code=503,
                detail="Halo sensor not configured"
            )

        bacnet_config = halo_client.get_bacnet_config()

        if bacnet_config is None:
            raise HTTPException(
                status_code=503,
                detail="Could not fetch BACnet configuration"
            )

        halo_ip = os.getenv("HALO_IP", "REDACTED_HALO_IP")
        port = bacnet_config.get("port", 47808)
        enabled = bacnet_config.get("on", False)

        # Testa om porten är öppen (UDP)
        port_open = False
        if enabled:
            port_open = test_port_open(halo_ip, port, "UDP")

        return {
            "enabled": enabled,
            "port": port,
            "port_open": port_open,
            "device_name": bacnet_config.get("deviceName", ""),
            "instance_number": bacnet_config.get("instanceNumber", 0),
            "location": bacnet_config.get("location", ""),
            "foreign_device": bacnet_config.get("foreignDevice", False),
            "cov_increment": bacnet_config.get("covIncrement", 5),
            "config": bacnet_config
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get BACnet status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

