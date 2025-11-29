"""
Collector Main - Huvudprocess som pollar Halo 3C sensor och skriver till InfluxDB
"""
import os
import time
import logging
import signal
import sys
from datetime import datetime
from typing import Optional

from collector.halo_client import HaloClient
from collector.beacon_handler import BeaconHandler
from collector.event_generator import EventGenerator
from services.sensor_data import SensorDataService
from services.events import EventService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global shutdown flag
shutdown = False


def signal_handler(sig, frame):
    """Hantera shutdown-signaler"""
    global shutdown
    logger.info("Shutdown signal received, stopping collector...")
    shutdown = True


def main():
    """Huvudfunktion för collector service"""
    # Registrera signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Läs miljövariabler
    halo_ip = os.getenv("HALO_IP", "REDACTED_HALO_IP")
    halo_user = os.getenv("HALO_USER", "admin")
    halo_pass = os.getenv("HALO_PASS", "")
    device_id = os.getenv("DEVICE_ID", "halo-device-1")
    collection_interval = int(os.getenv("COLLECTION_INTERVAL", "10"))

    influxdb_url = os.getenv("INFLUXDB_URL", "http://influxdb:8086")
    influxdb_token = os.getenv("INFLUXDB_TOKEN", "")
    influxdb_org = os.getenv("INFLUXDB_ORG", "halo-org")
    influxdb_bucket = os.getenv("INFLUXDB_BUCKET", "halo-sensors")

    # Validera kritiska miljövariabler
    if not halo_pass:
        logger.error("HALO_PASS environment variable is required")
        sys.exit(1)

    if not influxdb_token:
        logger.error("INFLUXDB_TOKEN environment variable is required")
        sys.exit(1)

    logger.info(f"Starting Halo 3C Collector Service")
    logger.info(f"  Halo IP: {halo_ip}")
    logger.info(f"  Device ID: {device_id}")
    logger.info(f"  Collection Interval: {collection_interval}s")
    logger.info(f"  InfluxDB: {influxdb_url}")

    # Initiera klienter och services
    try:
        # Halo använder HTTPS med self-signed certifikat
        halo_client = HaloClient(
            ip=halo_ip,
            username=halo_user,
            password=halo_pass,
            use_https=True
        )
        logger.info("Halo client initialized (HTTPS mode)")

        beacon_handler = BeaconHandler()
        logger.info("Beacon handler initialized")

        event_generator = EventGenerator(halo_client=halo_client)
        logger.info("Event generator initialized")

        sensor_data_service = SensorDataService()
        logger.info("Sensor data service initialized")

        event_service = EventService(
            url=influxdb_url,
            token=influxdb_token,
            org=influxdb_org,
            bucket=influxdb_bucket
        )
        logger.info("Event service initialized")

    except Exception as e:
        logger.error(f"Failed to initialize services: {e}", exc_info=True)
        sys.exit(1)

    # Health check
    logger.info("Performing health check...")
    if not halo_client.health_check():
        logger.error("Health check failed - Halo sensor not accessible")
        sys.exit(1)
    logger.info("Health check passed")

    # Huvudloop
    logger.info(f"Starting collection loop (interval: {collection_interval}s)")
    last_collection_time = 0

    try:
        while not shutdown:
            current_time = time.time()

            # Vänta till nästa collection-intervall
            time_since_last = current_time - last_collection_time
            if time_since_last < collection_interval:
                sleep_time = collection_interval - time_since_last
                time.sleep(sleep_time)
                continue

            try:
                # Hämta sensor-data från Halo och mät responstid
                logger.debug(f"Fetching sensor data from Halo...")
                fetch_start = time.time()
                halo_state = halo_client.get_latest_state()
                fetch_time_ms = (time.time() - fetch_start) * 1000

                timestamp = datetime.utcnow()

                # Logga heartbeat till InfluxDB
                if halo_state is None:
                    # Halo ej nåbar
                    from collector.halo_client import _last_contact_error
                    sensor_data_service.write_heartbeat(
                        is_connected=False,
                        error=_last_contact_error,
                        timestamp=timestamp
                    )
                    logger.warning("Failed to fetch Halo state, retrying next cycle")
                    last_collection_time = time.time()
                    continue
                else:
                    # Halo nåbar - logga med responstid
                    sensor_data_service.write_heartbeat(
                        is_connected=True,
                        response_time_ms=fetch_time_ms,
                        timestamp=timestamp
                    )

                # Skriv sensor-data till InfluxDB
                logger.debug("Writing sensor data to InfluxDB...")
                sensor_data_service.write_sensor_data(halo_state, timestamp)

                # Processa BLE Beacon-data
                logger.debug("Processing beacon data...")
                beacons = beacon_handler.extract_beacon_data(halo_state)
                if beacons:
                    beacon_presence_data, beacon_events = beacon_handler.process_beacons(
                        beacons, device_id
                    )

                    # Skriv beacon presence-data till InfluxDB
                    if beacon_presence_data:
                        sensor_data_service.write_beacon_data(beacon_presence_data)

                    # Generera och lagra beacon-events
                    for event_dict in beacon_events:
                        try:
                            from models.events import Event
                            event = Event(**event_dict)
                            event_service.create_event(event)
                            logger.info(f"Created beacon event: {event.type.value} - {event.summary}")
                        except Exception as e:
                            logger.error(f"Failed to create beacon event: {e}", exc_info=True)

                # Generera events från sensor-data
                logger.debug("Generating events from sensor data...")
                events = event_generator.generate_events_from_sensor_data(halo_state, device_id)

                # Skriv events till InfluxDB och broadcast via WebSocket
                for event_dict in events:
                    try:
                        from models.events import Event
                        event = Event(**event_dict)
                        created_event = event_service.create_event(event)
                        logger.info(f"Created event: {created_event.type.value} - {created_event.summary}")

                        # Broadcast event via WebSocket
                        try:
                            from api.websocket import broadcast_new_event
                            import asyncio
                            # Skapa async task för broadcast
                            try:
                                loop = asyncio.get_running_loop()
                                asyncio.create_task(broadcast_new_event(created_event))
                            except RuntimeError:
                                # Ingen loop körs, skapa ny
                                loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(loop)
                                loop.run_until_complete(broadcast_new_event(created_event))
                                loop.close()
                        except Exception as ws_error:
                            logger.warning(f"Failed to broadcast event via WebSocket: {ws_error}")
                    except Exception as e:
                        logger.error(f"Failed to create event: {e}", exc_info=True)

                last_collection_time = time.time()
                logger.debug(f"Collection cycle completed at {timestamp.isoformat()}")

            except Exception as e:
                logger.error(f"Error in collection cycle: {e}", exc_info=True)
                last_collection_time = time.time()
                # Fortsätt trots fel
                continue

        logger.info("Collector service stopped")

    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error in collector: {e}", exc_info=True)
        sys.exit(1)
    finally:
        # Cleanup
        logger.info("Cleaning up...")
        try:
            event_service.close()
            sensor_data_service.influxdb.close()
        except:
            pass


if __name__ == "__main__":
    main()
