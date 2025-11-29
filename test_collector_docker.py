"""
Test script för att testa collector i Docker environment
Kör med: python test_collector_docker.py
"""
import os
import sys
import time
import requests
from datetime import datetime
from dotenv import load_dotenv

# Fix Unicode output for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Ladda miljövariabler
load_dotenv()

def test_collector_in_docker():
    """Test collector i Docker environment"""
    print("=" * 60)
    print("Testing Halo 3C Collector - Docker Environment")
    print("=" * 60)

    # Hämta konfiguration
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    halo_ip = os.getenv("HALO_IP", "192.168.0.73")

    print(f"\nBackend URL: {backend_url}")
    print(f"Halo IP: {halo_ip}")

    # Test 1: Health Check
    print("\n" + "=" * 60)
    print("Test 1: Backend Health Check")
    print("=" * 60)
    try:
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            print(f"[OK] Backend is healthy: {response.json()}")
        else:
            print(f"[FAIL] Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Backend is not accessible: {e}")
        print("   Make sure Docker containers are running: docker-compose up -d")
        return False

    # Test 2: System Status
    print("\n" + "=" * 60)
    print("Test 2: System Status Check")
    print("=" * 60)
    try:
        response = requests.get(f"{backend_url}/api/system/status", timeout=5)
        if response.status_code == 200:
            status = response.json()
            print(f"[OK] System status retrieved")
            print(f"   InfluxDB: {status.get('influxdb', {}).get('status', 'unknown')}")
            print(f"   Halo Sensor: {status.get('halo_sensor', {}).get('status', 'unknown')}")
        else:
            print(f"[WARN] System status check failed: {response.status_code}")
    except Exception as e:
        print(f"[WARN] System status check error: {e}")

    # Test 3: Check Latest Sensor Values
    print("\n" + "=" * 60)
    print("Test 3: Check Latest Sensor Values from InfluxDB")
    print("=" * 60)
    try:
        response = requests.get(f"{backend_url}/api/sensors/latest", timeout=10)
        if response.status_code == 200:
            data = response.json()
            sensors = data.get('sensors', [])
            print(f"[OK] Retrieved {len(sensors)} sensor(s) from InfluxDB")
            if sensors:
                print(f"   Latest timestamp: {data.get('timestamp')}")
                print(f"   Sample sensors:")
                for sensor in sensors[:3]:
                    print(f"     - {sensor.get('sensor_id')}: {list(sensor.get('values', {}).keys())}")
            else:
                print("   [INFO] No sensors found - collector may not have written data yet")
        else:
            print(f"[FAIL] Failed to get sensor values: {response.status_code}")
    except Exception as e:
        print(f"[FAIL] Error getting sensor values: {e}")

    # Test 4: Check Latest Events
    print("\n" + "=" * 60)
    print("Test 4: Check Latest Events from InfluxDB")
    print("=" * 60)
    try:
        response = requests.get(f"{backend_url}/api/events/latest?limit=5", timeout=10)
        if response.status_code == 200:
            events = response.json()
            print(f"[OK] Retrieved {len(events)} event(s) from InfluxDB")
            if events:
                print(f"   Recent events:")
                for event in events[:3]:
                    print(f"     - {event.get('type')}: {event.get('summary')}")
            else:
                print("   [INFO] No events found - this is OK if no thresholds exceeded")
        else:
            print(f"[WARN] Failed to get events: {response.status_code}")
    except Exception as e:
        print(f"[WARN] Error getting events: {e}")

    # Test 5: Check Beacons
    print("\n" + "=" * 60)
    print("Test 5: Check Beacon Data from InfluxDB")
    print("=" * 60)
    try:
        response = requests.get(f"{backend_url}/api/beacons", timeout=10)
        if response.status_code == 200:
            beacons = response.json()
            print(f"[OK] Retrieved {len(beacons)} beacon(s) from InfluxDB")
            if beacons:
                for beacon in beacons[:3]:
                    print(f"     - {beacon.get('name', beacon.get('beacon_id'))}: RSSI {beacon.get('rssi')}, Battery {beacon.get('battery')}%")
            else:
                print("   [INFO] No beacons found - this is OK if no beacons are present")
        else:
            print(f"[WARN] Failed to get beacons: {response.status_code}")
    except Exception as e:
        print(f"[WARN] Error getting beacons: {e}")

    print("\n" + "=" * 60)
    print("[OK] Docker environment test completed!")
    print("=" * 60)
    print("\nNote: If collector is running, wait 10-15 seconds and check again")
    print("      for sensor data to appear in InfluxDB.")
    print("\nTo check collector logs:")
    print("  docker-compose logs -f collector")
    return True


if __name__ == "__main__":
    success = test_collector_in_docker()
    sys.exit(0 if success else 1)


