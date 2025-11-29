"""
Pytest configuration and fixtures för backend tests
"""
import pytest
import os
from unittest.mock import Mock, patch
from typing import Generator
import sys
from pathlib import Path

# Lägg till src/backend i path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src" / "backend"))


@pytest.fixture
def mock_influxdb_service():
    """Mock InfluxDB service för tester"""
    from services.influxdb import InfluxDBService

    with patch('services.influxdb.InfluxDBService') as mock_service:
        # Mock write operations
        mock_write_api = Mock()
        mock_service.return_value.write_api.return_value = mock_write_api

        # Mock query operations
        mock_query_api = Mock()
        mock_service.return_value.query_api.return_value = mock_query_api

        yield mock_service


@pytest.fixture
def mock_halo_client():
    """Mock Halo client för tester"""
    from collector.halo_client import HaloClient

    # Mock Halo state data
    mock_state = {
        "temperature": {"value": 22.5, "unit": "°C"},
        "humidity": {"value": 45.0, "unit": "%"},
        "co2": {"value": 450, "unit": "ppm"},
    }

    with patch('collector.halo_client.HaloClient') as mock_client:
        mock_instance = Mock()
        mock_instance.get_latest_state.return_value = mock_state
        mock_instance.health_check.return_value = True
        mock_client.return_value = mock_instance

        yield mock_instance


@pytest.fixture
def sample_sensor_data():
    """Sample sensor data för tester"""
    return {
        "temperature": {"value": 22.5, "unit": "°C"},
        "humidity": {"value": 45.0, "unit": "%"},
        "co2": {"value": 450, "unit": "ppm"},
        "noise": {"value": 35, "unit": "dB"},
    }


@pytest.fixture
def sample_beacon_data():
    """Sample beacon data för tester"""
    return {
        "blebcn/alert/status": {
            "id": "beacon-001",
            "name": "Test Beacon",
            "battery": 85,
            "rssi": -65,
            "status": 0,
            "time": "2025-01-27T10:00:00Z",
        }
    }


@pytest.fixture
def sample_event_data():
    """Sample event data för tester"""
    return {
        "id": "event-001",
        "timestamp": "2025-01-27T10:00:00Z",
        "type": "SENSOR_THRESHOLD",
        "severity": "WARNING",
        "source": "temperature",
        "summary": "Temperature exceeded threshold",
        "details": {"threshold": 25.0, "current": 26.5},
        "status": "ACTIVE",
        "device_id": "halo-device-1",
    }


