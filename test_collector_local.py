"""
Test script för att testa collector mot riktig Halo sensor (lokalt)
Kör med: python test_collector_local.py
"""
import os
import sys
import time
from datetime import datetime
from dotenv import load_dotenv

# Ladda miljövariabler
load_dotenv()

# Lägg till src/backend i path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from collector.halo_client import HaloClient
from collector.beacon_handler import BeaconHandler
from collector.event_generator import EventGenerator

def test_collector():
    """Test collector mot riktig Halo sensor"""
    print("=" * 60)
    print("Testing Halo 3C Collector - Health Check")
    print("=" * 60)

    # Hämta konfiguration
    halo_ip = os.getenv("HALO_IP", "REDACTED_HALO_IP")
    halo_user = os.getenv("HALO_USER", "admin")
    halo_pass = os.getenv("HALO_PASS", "")

    if not halo_pass:
        print("ERROR: HALO_PASS environment variable is required")
        print("Set it in .env file or environment variable")
        return False

    print(f"\nHalo Configuration:")
    print(f"  IP: {halo_ip}")
    print(f"  User: {halo_user}")

    # Test 1: Halo Client Health Check
    print("\n" + "=" * 60)
    print("Test 1: Halo Client Health Check")
    print("=" * 60)
    try:
        halo_client = HaloClient(ip=halo_ip, username=halo_user, password=halo_pass)
        if halo_client.health_check():
            print("✅ Halo sensor is reachable")
        else:
            print("❌ Halo sensor is NOT reachable")
            return False
    except Exception as e:
        print(f"❌ Failed to connect to Halo sensor: {e}")
        return False

    # Test 2: Fetch Latest State
    print("\n" + "=" * 60)
    print("Test 2: Fetch Latest State")
    print("=" * 60)
    try:
        halo_state = halo_client.get_latest_state()
        if halo_state:
            print(f"✅ Successfully fetched state")
            sensor_count = len([k for k in halo_state.keys() if isinstance(halo_state.get(k), dict)])
            print(f"   Sensors found: {sensor_count}")

            # Visa några sensor-exempel
            count = 0
            for key in list(halo_state.keys())[:5]:
                value = halo_state[key]
                if isinstance(value, dict):
                    print(f"   - {key}: {type(value).__name__}")
                    count += 1
                    if count >= 3:
                        break
        else:
            print("❌ Failed to fetch state")
            return False
    except Exception as e:
        print(f"❌ Error fetching state: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test 3: Extract Beacon Data
    print("\n" + "=" * 60)
    print("Test 3: Extract Beacon Data")
    print("=" * 60)
    try:
        beacon_handler = BeaconHandler()
        beacons = beacon_handler.extract_beacon_data(halo_state)
        if beacons:
            print(f"✅ Found {len(beacons)} beacon(s)")
            for beacon in beacons:
                print(f"   - {beacon.get('name', 'Unknown')} ({beacon.get('beacon_id')})")
                print(f"     RSSI: {beacon.get('rssi')} dBm, Battery: {beacon.get('battery')}%")
        else:
            print("ℹ️  No beacons found in current state (this is OK if no beacons are present)")
    except Exception as e:
        print(f"❌ Error extracting beacon data: {e}")
        import traceback
        traceback.print_exc()

    # Test 4: Generate Events
    print("\n" + "=" * 60)
    print("Test 4: Generate Events")
    print("=" * 60)
    try:
        event_generator = EventGenerator()
        events = event_generator.generate_events_from_sensor_data(halo_state, "halo-device-1")
        if events:
            print(f"✅ Generated {len(events)} event(s)")
            for event in events[:3]:  # Visa första 3
                print(f"   - {event.get('type')}: {event.get('summary')}")
        else:
            print("ℹ️  No events generated (this is OK if no thresholds exceeded)")
    except Exception as e:
        print(f"❌ Error generating events: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
    print("✅ Health check completed successfully!")
    print("=" * 60)
    print("\nNote: Full collector test with InfluxDB requires Docker setup.")
    print("To test full integration, run: docker-compose up collector")
    return True


if __name__ == "__main__":
    success = test_collector()
    sys.exit(0 if success else 1)


