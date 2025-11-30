"""
InfluxDB Service - Centraliserad hantering av InfluxDB-anslutning
"""
from typing import Optional
from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS
from influxdb_client.client.query_api import QueryApi
import logging
import os

logger = logging.getLogger(__name__)


class InfluxDBService:
    """Centraliserad service för InfluxDB-anslutning"""

    _instance: Optional['InfluxDBService'] = None
    _client: Optional[InfluxDBClient] = None
    _write_api: Optional = None
    _query_api: Optional[QueryApi] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(InfluxDBService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._url = os.getenv("INFLUXDB_URL", "http://influxdb:8086")
            self._token = os.getenv("INFLUXDB_TOKEN", "")
            self._org = os.getenv("INFLUXDB_ORG", "halo-org")
            self._bucket = os.getenv("INFLUXDB_BUCKET", "halo-sensors")
            self._connect()

    def _connect(self):
        """Etablera InfluxDB-anslutning"""
        try:
            self._client = InfluxDBClient(
                url=self._url,
                token=self._token,
                org=self._org,
                timeout=30000  # 30 sekunder timeout
            )
            self._write_api = self._client.write_api(write_options=SYNCHRONOUS)
            self._query_api = self._client.query_api()
            logger.info(f"Connected to InfluxDB at {self._url}")
        except Exception as e:
            logger.error(f"Failed to connect to InfluxDB: {e}")
            raise

    @property
    def client(self) -> InfluxDBClient:
        """Get InfluxDB client"""
        if self._client is None:
            self._connect()
        return self._client

    @property
    def write_api(self):
        """Get write API"""
        if self._write_api is None:
            self._connect()
        return self._write_api

    @property
    def query_api(self) -> QueryApi:
        """Get query API"""
        if self._query_api is None:
            self._connect()
        return self._query_api

    def get_org(self) -> str:
        """Get organization"""
        return os.getenv("INFLUXDB_ORG", "halo-org")

    def get_bucket(self) -> str:
        """Get bucket"""
        return os.getenv("INFLUXDB_BUCKET", "halo-sensors")

    def close(self):
        """Stäng anslutningar"""
        if self._write_api:
            self._write_api.close()
        if self._client:
            self._client.close()
