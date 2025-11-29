"""
Event Service - Hanterar event-lagring och querying i InfluxDB
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from influxdb_client.client.query_api import QueryApi
from influxdb_client.domain.query import Query
import json
import uuid

from models.events import Event, EventStatus, EventType, EventSeverity

logger = logging.getLogger(__name__)


class EventService:
    """Service för att hantera events i InfluxDB"""

    def __init__(
        self,
        url: str,
        token: str,
        org: str,
        bucket: str
    ):
        """
        Initiera Event Service

        Args:
            url: InfluxDB URL (t.ex. http://influxdb:8086)
            token: InfluxDB token
            org: InfluxDB organization
            bucket: InfluxDB bucket för events
        """
        self.url = url
        self.token = token
        self.org = org
        self.bucket = bucket
        self.client = None
        self.write_api = None
        self.query_api = None
        self._ensure_connection()

    def _ensure_connection(self):
        """Säkerställ att InfluxDB-anslutning finns"""
        try:
            self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org)
            self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
            self.query_api = self.client.query_api()
            logger.info(f"Connected to InfluxDB at {self.url}")
        except Exception as e:
            logger.error(f"Failed to connect to InfluxDB: {e}")
            raise

    def create_event(self, event: Event) -> Event:
        """
        Skapa och lagra ett event i InfluxDB

        Args:
            event: Event att skapa

        Returns:
            Event med genererat ID
        """
        if not event.id:
            event.id = str(uuid.uuid4())

        try:
            # Skapa InfluxDB Point
            point = Point("events") \
                .tag("type", event.type.value) \
                .tag("severity", event.severity.value) \
                .tag("status", event.status.value) \
                .tag("device_id", event.device_id) \
                .field("summary", event.summary) \
                .field("details", json.dumps(event.details)) \
                .time(event.timestamp)

            # Lägg till valfria tags
            if event.location:
                point = point.tag("location", event.location)
            if event.sensor_metadata_id:
                point = point.tag("sensor_metadata_id", event.sensor_metadata_id)
            if event.source:
                point = point.tag("source", event.source)

            # Lägg till valfria fields
            if event.threshold_value is not None:
                point = point.field("threshold_value", event.threshold_value)
            if event.current_value is not None:
                point = point.field("current_value", event.current_value)

            # Lägg till event ID som field för enkel querying
            point = point.field("event_id", event.id)

            # Skriv till InfluxDB
            self.write_api.write(bucket=self.bucket, record=point)

            logger.info(f"Event created: {event.id} ({event.type.value})")

            # Broadcast event via WebSocket (hanteras i websocket module)
            # WebSocket-broadcasting sker via en separat mekanism när events skapas
            # Se websocket.py för broadcast_new_event() som anropas från routes

            return event

        except Exception as e:
            logger.error(f"Failed to create event: {e}", exc_info=True)
            raise

    def get_events(
        self,
        from_time: Optional[datetime] = None,
        to_time: Optional[datetime] = None,
        event_type: Optional[EventType] = None,
        severity: Optional[EventSeverity] = None,
        status: Optional[EventStatus] = None,
        device_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Event]:
        """
        Hämta events med filtrering

        Args:
            from_time: Starttid för filtrering
            to_time: Sluttid för filtrering
            event_type: Filtrera på event-typ
            severity: Filtrera på severity
            status: Filtrera på status
            device_id: Filtrera på device_id
            limit: Max antal events att returnera

        Returns:
            Lista med events
        """
        try:
            # Bygg Flux query med pivot för att samla alla fields
            start_time = self._datetime_to_flux_time(from_time or (datetime.utcnow() - timedelta(hours=24)))
            stop_time = self._datetime_to_flux_time(to_time or datetime.utcnow())

            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: {start_time}, stop: {stop_time})
              |> filter(fn: (r) => r["_measurement"] == "events")
            '''

            # Lägg till filter
            if event_type:
                query += f'|> filter(fn: (r) => r["type"] == "{event_type.value}")'
            if severity:
                query += f'|> filter(fn: (r) => r["severity"] == "{severity.value}")'
            if status:
                query += f'|> filter(fn: (r) => r["status"] == "{status.value}")'
            if device_id:
                query += f'|> filter(fn: (r) => r["device_id"] == "{device_id}")'

            # Pivot för att samla alla fields till en rad per event
            query += '''
              |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
              |> sort(columns: ["_time"], desc: true)
            '''
            query += f'|> limit(n: {limit})'

            # Kör query
            result = self.query_api.query(query=query)

            # Konvertera till Event-objekt
            events = []

            for table in result:
                for record in table.records:
                    # Efter pivot har vi alla fields i samma record
                    event_id = record.values.get('event_id')
                    if not event_id:
                        continue

                    # Extrahera details och parsea JSON
                    details_str = record.values.get('details', '{}')
                    try:
                        details = json.loads(details_str) if isinstance(details_str, str) else (details_str or {})
                    except:
                        details = {}

                    event_dict = {
                        'id': event_id,
                        'timestamp': record.get_time(),
                        'type': record.values.get('type'),
                        'severity': record.values.get('severity'),
                        'status': record.values.get('status'),
                        'source': record.values.get('source', 'unknown'),
                        'device_id': record.values.get('device_id', 'halo-device-1'),
                        'location': record.values.get('location'),
                        'sensor_metadata_id': record.values.get('sensor_metadata_id'),
                        'details': details,
                        'summary': record.values.get('summary', ''),
                        'threshold_value': record.values.get('threshold_value'),
                        'current_value': record.values.get('current_value')
                    }

                    try:
                        event = Event(**event_dict)
                        events.append(event)
                    except Exception as e:
                        logger.warning(f"Failed to create event from dict: {e}")

            return events

        except Exception as e:
            logger.error(f"Failed to get events: {e}", exc_info=True)
            return []

    def acknowledge_event(self, event_id: str) -> bool:
        """
        Kvittera ett event (uppdatera status till ACKNOWLEDGED)

        Args:
            event_id: Event ID att kvittera

        Returns:
            True om framgångsrikt
        """
        # TODO: Implementera status-uppdatering i InfluxDB
        # Detta kräver en uppdatering av tag-värdet, vilket kan vara komplex i InfluxDB
        # Alternativ: Skapa nytt event med status=ACKNOWLEDGED och koppla till original

        logger.warning("Event acknowledgment not yet implemented")
        return False

    def get_latest_events(self, limit: int = 50) -> List[Event]:
        """
        Hämta senaste events

        Args:
            limit: Max antal events

        Returns:
            Lista med senaste events
        """
        return self.get_events(limit=limit)

    def _datetime_to_flux_time(self, dt: datetime) -> str:
        """Konvertera datetime till Flux-time format"""
        return dt.strftime('%Y-%m-%dT%H:%M:%SZ')

    def close(self):
        """Stäng anslutningar"""
        if self.write_api:
            self.write_api.close()
        if self.client:
            self.client.close()
