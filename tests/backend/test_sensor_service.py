"""
Unit tests för SensorService
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from services.sensors import SensorService


@pytest.fixture
def sensor_service(mock_influxdb_service):
    """SensorService instance med mocked InfluxDB"""
    with patch('services.sensors.InfluxDBService') as mock_influx:
        service = SensorService()
        yield service


class TestSensorService:
    """Test SensorService functionality"""

    def test_get_latest_sensor_values(self, sensor_service):
        """Test retrieving latest sensor values"""
        # Mock InfluxDB query result
        mock_record = MagicMock()
        mock_record.get_time.return_value = datetime.utcnow()
        mock_record.values = {
            'sensor_id': 'temperature',
            'device_id': 'halo-device-1',
        }
        mock_record.get_field.return_value = 'value'
        mock_record.get_value.return_value = 22.5

        mock_table = MagicMock()
        mock_table.records = [mock_record]

        with patch.object(sensor_service.influxdb.query_api, 'query', return_value=[mock_table]):
            result = sensor_service.get_latest_sensor_values(device_id="halo-device-1")

            assert result is not None
            assert 'device_id' in result
            assert 'sensors' in result

    def test_get_sensor_history(self, sensor_service):
        """Test retrieving sensor history"""
        mock_record = MagicMock()
        mock_record.get_time.return_value = datetime.utcnow()
        mock_record.get_field.return_value = 'value'
        mock_record.get_value.return_value = 22.5

        mock_table = MagicMock()
        mock_table.records = [mock_record]

        with patch.object(sensor_service.influxdb.query_api, 'query', return_value=[mock_table]):
            history = sensor_service.get_sensor_history(
                sensor_id="temperature",
                from_time=datetime.utcnow() - timedelta(hours=1),
                to_time=datetime.utcnow(),
                limit=100,
            )

            assert isinstance(history, list)


