"""
System routes - health checks, systemstatus och enhetsinformation
"""
from fastapi import APIRouter, HTTPException
import logging
import os
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()


# In-memory heartbeat storage (uppdateras av collector via API)
_heartbeat_data = {
    "last_contact": None,
    "status": "unknown",
    "error": None
}


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


@router.get("/heartbeat")
async def get_heartbeat():
    """
    Hämta Halo sensor heartbeat-status

    Returns:
        Heartbeat-status med senaste kontakttid
    """
    try:
        from collector.halo_client import get_heartbeat_status
        return get_heartbeat_status()
    except ImportError:
        # Fallback om collector inte är tillgänglig
        return _heartbeat_data


@router.post("/heartbeat")
async def update_heartbeat(status: str = "healthy", error: Optional[str] = None):
    """
    Uppdatera heartbeat-status (anropas av collector)

    Args:
        status: Status (healthy, degraded, offline)
        error: Eventuellt felmeddelande
    """
    global _heartbeat_data
    _heartbeat_data = {
        "last_contact": datetime.utcnow().isoformat(),
        "status": status,
        "error": error
    }
    return {"success": True}


@router.get("/status")
async def get_system_status():
    """
    Hamta systemstatus for alla komponenter

    Returns:
        Status for backend, InfluxDB, Collector, Halo sensor, Heartbeat
    """
    status = {
        "backend": "healthy",
        "influxdb": {"status": "unknown"},
        "collector": {"status": "unknown"},
        "halo_sensor": {"status": "unknown"},
        "heartbeat": {"status": "unknown"},
        "timestamp": None
    }

    # Hämta heartbeat-status
    try:
        from collector.halo_client import get_heartbeat_status
        status["heartbeat"] = get_heartbeat_status()
    except ImportError:
        status["heartbeat"] = _heartbeat_data

    # Test InfluxDB connection
    try:
        from services.influxdb import InfluxDBService
        influxdb = InfluxDBService()

        try:
            buckets_api = influxdb.client.buckets_api()
            buckets = buckets_api.find_buckets()
            status["influxdb"] = {
                "status": "connected",
                "url": os.getenv("INFLUXDB_URL", "http://influxdb:8086"),
                "org": os.getenv("INFLUXDB_ORG", "halo-org"),
                "bucket": os.getenv("INFLUXDB_BUCKET", "halo-sensors")
            }
        except Exception as e:
            logger.warning(f"InfluxDB connection test failed: {e}")
            status["influxdb"] = {
                "status": "error",
                "error": str(e)
            }
    except Exception as e:
        logger.error(f"Failed to initialize InfluxDB service: {e}")
        status["influxdb"] = {
            "status": "error",
            "error": str(e)
        }

    # Test Halo sensor connection
    try:
        halo_client = get_halo_client()
        halo_ip = os.getenv("HALO_IP", "REDACTED_HALO_IP")

        if halo_client:
            if halo_client.health_check():
                status["halo_sensor"] = {
                    "status": "connected",
                    "ip": halo_ip
                }
            else:
                status["halo_sensor"] = {
                    "status": "disconnected",
                    "ip": halo_ip
                }
        else:
            status["halo_sensor"] = {
                "status": "not_configured",
                "ip": halo_ip
            }
    except Exception as e:
        logger.warning(f"Halo sensor check failed: {e}")
        status["halo_sensor"] = {
            "status": "error",
            "error": str(e)
        }

    status["collector"] = {
        "status": "unknown",
        "note": "Check collector logs for detailed status"
    }

    status["timestamp"] = datetime.utcnow().isoformat()

    return status


@router.get("/device/info")
async def get_device_info():
    """
    Hamta detaljerad enhetsinformation fran Halo 3C

    Returns:
        Enhetsinformation inkl. drifttimmar, natverksinfo, etc.
    """
    try:
        halo_client = get_halo_client()

        if not halo_client:
            raise HTTPException(
                status_code=503,
                detail="Halo sensor not configured. Set HALO_PASS environment variable."
            )

        info = halo_client.get_device_info()

        if info is None:
            raise HTTPException(
                status_code=503,
                detail="Could not connect to Halo sensor"
            )

        # Formatera drifttid om tillgangligt
        if info.get("lifetime_hours"):
            hours = info["lifetime_hours"]
            days = hours // 24
            remaining_hours = hours % 24
            info["lifetime_formatted"] = f"{days} dagar, {remaining_hours} timmar"

        # Formatera starttid om tillgangligt
        if info.get("start_time"):
            try:
                start_ts = info["start_time"]
                if isinstance(start_ts, (int, float)):
                    start_dt = datetime.fromtimestamp(start_ts)
                    info["start_time_formatted"] = start_dt.strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                pass

        return info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get device info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/device/raw")
async def get_device_raw_state():
    """
    Hamta ra sensordata fran Halo 3C (JSON)

    Returns:
        Ra JSON-data fran Halo API
    """
    try:
        halo_client = get_halo_client()

        if not halo_client:
            raise HTTPException(
                status_code=503,
                detail="Halo sensor not configured. Set HALO_PASS environment variable."
            )

        raw_state = halo_client.get_raw_state()

        if raw_state is None:
            raise HTTPException(
                status_code=503,
                detail="Could not connect to Halo sensor"
            )

        return {
            "state": raw_state,
            "fetched_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get raw state: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/device/network")
async def get_device_network_info():
    """
    Hamta natverksinformation fran Halo 3C

    Returns:
        Natverksinfo (IP, MAC, etc.)
    """
    try:
        halo_client = get_halo_client()

        if not halo_client:
            raise HTTPException(
                status_code=503,
                detail="Halo sensor not configured"
            )

        info = halo_client.get_device_info()

        if info is None:
            raise HTTPException(
                status_code=503,
                detail="Could not connect to Halo sensor"
            )

        return {
            "ip": info.get("ip"),
            "network": info.get("network", {}),
            "fetched_at": info.get("fetched_at")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get network info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_system_stats():
    """
    Hämta systemstatistik och metadata för dashboard

    Returns:
        Statistik om sensorer, versioner, deployment info
    """
    import sys
    import socket
    import json
    from pathlib import Path

    stats = {
        "sensors": {
            "total_count": 0,
            "categories": {},
        },
        "software": {
            "python_version": sys.version.split()[0],
            "fastapi_version": "0.104.1",
            "pydantic_version": "2.5.2",
            "influxdb_client_version": "1.38.0",
        },
        "deployment": {
            "docker": os.path.exists("/.dockerenv"),
            "hostname": socket.gethostname(),
            "environment": os.getenv("ENVIRONMENT", "production"),
        },
        "configuration": {
            "halo_ip": os.getenv("HALO_IP", "not_configured"),
            "influxdb_url": os.getenv("INFLUXDB_URL", "http://influxdb:8086"),
            "poll_interval": int(os.getenv("POLL_INTERVAL", "30")),
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Läs sensormetadata för statistik
    try:
        metadata_path = Path(__file__).parent.parent.parent / "data" / "sensor_metadata.json"
        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
                sensors = metadata.get("sensors", {})
                stats["sensors"]["total_count"] = len(sensors)

                # Räkna per kategori
                categories = {}
                for sensor_id, sensor_info in sensors.items():
                    category = sensor_info.get("category", "unknown")
                    categories[category] = categories.get(category, 0) + 1
                stats["sensors"]["categories"] = categories
    except Exception as e:
        logger.warning(f"Could not load sensor metadata: {e}")

    return stats
