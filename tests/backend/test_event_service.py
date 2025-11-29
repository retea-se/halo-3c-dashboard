"""
Unit tests för EventService
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from services.events import EventService
from models.events import Event, EventType, EventSeverity, EventStatus


@pytest.fixture
def event_service(mock_influxdb_service):
    """EventService instance med mocked InfluxDB"""
    with patch('services.events.InfluxDBService') as mock_influx:
        service = EventService(
            url="http://localhost:8086",
            token="test-token",
            org="test-org",
            bucket="test-bucket"
        )
        yield service


class TestEventService:
    """Test EventService functionality"""

    def test_create_event(self, event_service):
        """Test creating an event"""
        event = Event(
            timestamp=datetime.utcnow(),
            type=EventType.SENSOR_THRESHOLD,
            severity=EventSeverity.WARNING,
            source="temperature",
            summary="Temperature exceeded threshold",
            details={"threshold": 25.0, "current": 26.5},
            status=EventStatus.ACTIVE,
            device_id="halo-device-1",
        )

        created_event = event_service.create_event(event)

        assert created_event is not None
        assert created_event.type == EventType.SENSOR_THRESHOLD
        assert created_event.severity == EventSeverity.WARNING
        assert created_event.summary == "Temperature exceeded threshold"

    def test_get_latest_events(self, event_service):
        """Test retrieving latest events"""
        # Mock InfluxDB query result
        mock_record = MagicMock()
        mock_record.get_time.return_value = datetime.utcnow()
        mock_record.values = {
            'type': 'SENSOR_THRESHOLD',
            'severity': 'WARNING',
            'source': 'temperature',
        }
        mock_record.get_field.return_value = 'summary'
        mock_record.get_value.return_value = 'Temperature exceeded threshold'

        mock_table = MagicMock()
        mock_table.records = [mock_record]

        with patch.object(event_service.influxdb.query_api, 'query', return_value=[mock_table]):
            events = event_service.get_latest_events(limit=10)

            assert isinstance(events, list)

    def test_acknowledge_event(self, event_service):
        """Test acknowledging an event"""
        event_id = "test-event-123"

        with patch.object(event_service.influxdb.query_api, 'query', return_value=[]):
            result = event_service.acknowledge_event(event_id)

            # Acknowledge should update event status
            assert result is not None

    def test_get_events_with_filters(self, event_service):
        """Test retrieving events with filters"""
        mock_record = MagicMock()
        mock_record.get_time.return_value = datetime.utcnow()
        mock_record.values = {
            'type': 'SENSOR_THRESHOLD',
            'severity': 'CRITICAL',
        }
        mock_record.get_field.return_value = 'summary'
        mock_record.get_value.return_value = 'Critical threshold exceeded'

        mock_table = MagicMock()
        mock_table.records = [mock_record]

        with patch.object(event_service.influxdb.query_api, 'query', return_value=[mock_table]):
            events = event_service.get_events(
                from_time=datetime.utcnow() - timedelta(hours=1),
                to_time=datetime.utcnow(),
                event_type=EventType.SENSOR_THRESHOLD,
                severity=EventSeverity.CRITICAL,
            )

            assert isinstance(events, list)


