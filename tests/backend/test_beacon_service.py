"""
Unit tests för BeaconService
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from services.beacons import BeaconService


@pytest.fixture
def beacon_service(mock_influxdb_service):
    """BeaconService instance med mocked InfluxDB"""
    with patch('services.beacons.InfluxDBService') as mock_influx:
        service = BeaconService()
        yield service


class TestBeaconService:
    """Test BeaconService functionality"""

    def test_get_all_beacons(self, beacon_service):
        """Test retrieving all beacons"""
        # Mock InfluxDB query result
        mock_record = MagicMock()
        mock_record.get_time.return_value = datetime.utcnow()
        mock_record.values = {
            'beacon_id': 'beacon-001',
            'beacon_name': 'Test Beacon',
        }
        mock_record.get_field.return_value = 'rssi'
        mock_record.get_value.return_value = -65

        mock_table = MagicMock()
        mock_table.records = [mock_record]

        with patch.object(beacon_service.influxdb.query_api, 'query', return_value=[mock_table]):
            beacons = beacon_service.get_all_beacons(device_id="halo-device-1")

            assert isinstance(beacons, list)

    def test_get_beacon_history(self, beacon_service):
        """Test retrieving beacon history"""
        mock_record = MagicMock()
        mock_record.get_time.return_value = datetime.utcnow()
        mock_record.values = {
            'beacon_id': 'beacon-001',
            'beacon_name': 'Test Beacon',
        }
        mock_record.get_field.return_value = 'rssi'
        mock_record.get_value.return_value = -65

        mock_table = MagicMock()
        mock_table.records = [mock_record]

        with patch.object(beacon_service.influxdb.query_api, 'query', return_value=[mock_table]):
            history = beacon_service.get_beacon_history(
                beacon_id="beacon-001",
                from_time=datetime.utcnow() - timedelta(hours=1),
                to_time=datetime.utcnow(),
                limit=100,
            )

            assert isinstance(history, list)


