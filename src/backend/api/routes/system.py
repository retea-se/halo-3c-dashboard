"""
System routes - health checks och systemstatus
"""
from fastapi import APIRouter
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status")
async def get_system_status():
    """
    Hämta systemstatus för alla komponenter

    Returns:
        Status för backend, InfluxDB, Collector, Halo sensor
    """
    status = {
        "backend": "healthy",
        "influxdb": {"status": "unknown"},
        "collector": {"status": "unknown"},
        "halo_sensor": {"status": "unknown"},
        "timestamp": None
    }

    # Test InfluxDB connection
    try:
        from services.influxdb import InfluxDBService
        influxdb = InfluxDBService()

        # Försök hämta buckets för att testa anslutning
        try:
            buckets_api = influxdb.client.buckets_api()
            # Lista buckets (enkel test av anslutning)
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
        from collector.halo_client import HaloClient
        halo_ip = os.getenv("HALO_IP", "REDACTED_HALO_IP")
        halo_user = os.getenv("HALO_USER", "admin")
        halo_pass = os.getenv("HALO_PASS", "")

        if halo_pass:
            halo_client = HaloClient(
                ip=halo_ip,
                username=halo_user,
                password=halo_pass
            )
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

    # Collector status (kanske kolla via Docker API eller log files)
    # För nu säger vi unknown
    status["collector"] = {
        "status": "unknown",
        "note": "Check collector logs for detailed status"
    }

    from datetime import datetime
    status["timestamp"] = datetime.utcnow().isoformat()

    return status
