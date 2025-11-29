"""
Unit tests för HaloClient
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import requests
from collector.halo_client import HaloClient


@pytest.fixture
def halo_client():
    """HaloClient instance"""
    return HaloClient(
        ip="REDACTED_HALO_IP",
        username="admin",
        password="test-password"
    )


class TestHaloClient:
    """Test HaloClient functionality"""

    @patch('requests.get')
    def test_health_check_success(self, mock_get, halo_client):
        """Test successful health check"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_get.return_value = mock_response

        result = halo_client.health_check()

        assert result is True
        mock_get.assert_called_once()

    @patch('collector.halo_client.requests.get')
    def test_health_check_failure(self, mock_get, halo_client):
        """Test failed health check"""
        import requests
        mock_get.side_effect = requests.exceptions.ConnectionError()

        result = halo_client.health_check()

        assert result is False

    @patch('collector.halo_client.requests.get')
    def test_get_latest_state(self, mock_get, halo_client):
        """Test getting latest state"""
        mock_state = {
            "temperature": {"value": 22.5, "unit": "°C"},
            "humidity": {"value": 45.0, "unit": "%"},
        }

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_state
        mock_get.return_value = mock_response

        state = halo_client.get_latest_state()

        assert state is not None
        assert "temperature" in state
        assert state["temperature"]["value"] == 22.5

