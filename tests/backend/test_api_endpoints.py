"""
Integration tests för API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import sys
from pathlib import Path

# Lägg till src/backend i path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src" / "backend"))

from api.main import app

client = TestClient(app)


class TestAPIRoot:
    """Test root endpoints"""

    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()

    def test_health_endpoint(self):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestSensorEndpoints:
    """Test sensor endpoints"""

    @patch('api.routes.sensors.SensorService')
    def test_get_sensor_metadata(self, mock_service):
        """Test getting sensor metadata"""
        response = client.get("/api/sensors/meta")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @patch('api.routes.sensors.SensorService')
    def test_get_sensor_metadata_by_id(self, mock_service):
        """Test getting sensor metadata by ID"""
        response = client.get("/api/sensors/meta/temperature_c")
        # Should return 200 or 404 depending on if sensor exists
        assert response.status_code in [200, 404]


class TestEventEndpoints:
    """Test event endpoints"""

    @patch('api.routes.events.EventService')
    def test_get_latest_events(self, mock_service):
        """Test getting latest events"""
        response = client.get("/api/events/latest?limit=10")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestBeaconEndpoints:
    """Test beacon endpoints"""

    @patch('api.routes.beacons.BeaconService')
    def test_get_all_beacons(self, mock_service):
        """Test getting all beacons"""
        response = client.get("/api/beacons")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


