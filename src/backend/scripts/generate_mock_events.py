"""
Generate Mock Events - Skapar 1 år av realistiska events

Genererar events för alla 26 event-typer från Halo 3C, spridda över ett år bakåt.
Events har realistiska frekvenser och tidsfördelningar.

Kör med: python -m scripts.generate_mock_events
"""
import os
import sys
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import json

# InfluxDB configuration
INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://localhost:8086")
INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", "")
INFLUXDB_ORG = os.getenv("INFLUXDB_ORG", "halo-org")
INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "halo-sensors")

# Device ID for mock data
DEVICE_ID = "halo-device-1"

# Event configuration - frekvens per event-typ (events per månad)
EVENT_FREQUENCIES = {
    # Säkerhet - sällsynta men viktiga
    'Aggression': 0.5,  # ~6 per år
    'Gunshot': 0.1,  # ~1 per år
    'Tamper': 0.3,  # ~4 per år
    'Help': 0.2,  # ~2 per år
    'Motion': 30,  # ~360 per år (vanligt)

    # Vaping/Smoking - varierande frekvens
    'Vape': 2,  # ~24 per år
    'THC': 1,  # ~12 per år
    'Masking': 0.5,  # ~6 per år
    'Smoking': 3,  # ~36 per år

    # Luftkvalitet - vanligare under vissa perioder
    'AQI': 5,  # ~60 per år
    'Health_Index': 8,  # ~96 per år
    'TVOC': 4,  # ~48 per år
    'CO2cal': 6,  # ~72 per år
    'PM2.5': 3,  # ~36 per år
    'PM1': 2,  # ~24 per år
    'PM10': 3,  # ~36 per år
    'CO': 0.5,  # ~6 per år (kritisk)
    'NO2': 2,  # ~24 per år
    'NH3': 1,  # ~12 per år

    # Miljö - säsongsberoende
    'Humidity': 2,  # ~24 per år
    'Humidity_Low': 1,  # ~12 per år
    'Temp_C': 3,  # ~36 per år
    'Temp_C_Low': 2,  # ~24 per år
    'Pressure': 1,  # ~12 per år
    'Light': 4,  # ~48 per år
    'Sound': 10,  # ~120 per år
}

# Event severity mapping
EVENT_SEVERITY = {
    'Aggression': 'WARNING',
    'Gunshot': 'CRITICAL',
    'Tamper': 'CRITICAL',
    'Help': 'CRITICAL',
    'Motion': 'INFO',
    'Vape': 'WARNING',
    'THC': 'WARNING',
    'Masking': 'WARNING',
    'Smoking': 'WARNING',
    'AQI': 'WARNING',
    'Health_Index': 'WARNING',
    'TVOC': 'WARNING',
    'CO2cal': 'WARNING',
    'PM2.5': 'WARNING',
    'PM1': 'WARNING',
    'PM10': 'WARNING',
    'CO': 'CRITICAL',
    'NO2': 'WARNING',
    'NH3': 'WARNING',
    'Humidity': 'WARNING',
    'Humidity_Low': 'INFO',
    'Temp_C': 'WARNING',
    'Temp_C_Low': 'WARNING',
    'Pressure': 'INFO',
    'Light': 'INFO',
    'Sound': 'INFO',
}

# Event summary templates
EVENT_SUMMARIES = {
    'Aggression': 'Aggression detekterad',
    'Gunshot': 'Skottlossning detekterad',
    'Tamper': 'Tamper/sabotage detekterad',
    'Help': 'Nödrop detekterad',
    'Motion': 'Rörelse detekterad',
    'Vape': 'Vape-detektion aktiv',
    'THC': 'THC-detektion aktiv',
    'Masking': 'Maskeringsförsök detekterat',
    'Smoking': 'Rökning detekterad',
    'AQI': 'AQI-varning',
    'Health_Index': 'Hälsoindex-varning',
    'TVOC': 'TVOC-nivå överskriden',
    'CO2cal': 'CO₂-nivå överskriden',
    'PM2.5': 'PM2.5-nivå överskriden',
    'PM1': 'PM1-nivå överskriden',
    'PM10': 'PM10-nivå överskriden',
    'CO': 'Kolmonoxid (CO) detekterad',
    'NO2': 'Kvävedioxid (NO₂) nivå överskriden',
    'NH3': 'Ammoniak (NH₃) nivå överskriden',
    'Humidity': 'Luftfuktighet för hög',
    'Humidity_Low': 'Luftfuktighet för låg',
    'Temp_C': 'Temperatur för hög',
    'Temp_C_Low': 'Temperatur för låg',
    'Pressure': 'Lufttrycksvarning',
    'Light': 'Ljusnivå-varning',
    'Sound': 'Ljudnivå-varning',
}

# Event type mapping (Halo event_id -> EventType enum value)
EVENT_TYPE_MAPPING = {
    'Aggression': 'Aggression',
    'Gunshot': 'Gunshot',
    'Tamper': 'Tamper',
    'Help': 'Help',
    'Motion': 'Motion',
    'Vape': 'Vape',
    'THC': 'THC',
    'Masking': 'Masking',
    'Smoking': 'Smoking',
    'AQI': 'AQI',
    'Health_Index': 'Health_Index',
    'TVOC': 'TVOC',
    'CO2cal': 'CO2cal',
    'PM2.5': 'PM2.5',
    'PM1': 'PM1',
    'PM10': 'PM10',
    'CO': 'CO',
    'NO2': 'NO2',
    'NH3': 'NH3',
    'Humidity': 'Humidity',
    'Humidity_Low': 'Humidity_Low',
    'Temp_C': 'Temp_C',
    'Temp_C_Low': 'Temp_C_Low',
    'Pressure': 'Pressure',
    'Light': 'Light',
    'Sound': 'Sound',
}


def generate_event_times(event_type: str, start_date: datetime, end_date: datetime) -> List[datetime]:
    """
    Generera tidsstämplar för events baserat på frekvens

    Args:
        event_type: Event-typ
        start_date: Startdatum (1 år bakåt)
        end_date: Slutdatum (idag)

    Returns:
        Lista med tidsstämplar för events
    """
    events = []

    # Hämta frekvens (events per månad)
    frequency = EVENT_FREQUENCIES.get(event_type, 1)

    # Beräkna totalt antal events över hela perioden
    days_diff = (end_date - start_date).days
    months = days_diff / 30.0
    total_events = int(frequency * months)

    # Generera tidsstämplar jämnt fördelade över perioden
    if total_events == 0:
        return events

    # Lägg till lite slumpmässighet
    interval_days = days_diff / total_events if total_events > 0 else days_diff

    for i in range(total_events):
        # Bas-tidpunkt
        base_time = start_date + timedelta(days=i * interval_days)

        # Lägg till slumpmässig variation (±20% av intervallet)
        variation = random.uniform(-0.2, 0.2) * interval_days
        event_time = base_time + timedelta(days=variation)

        # Lägg till slumpmässig tid på dagen (förutom för vissa event-typer)
        if event_type in ['Motion', 'Sound', 'Light']:
            # Dessa kan hända när som helst
            hour = random.randint(0, 23)
            minute = random.randint(0, 59)
            event_time = event_time.replace(hour=hour, minute=minute, second=random.randint(0, 59))
        elif event_type in ['Vape', 'THC', 'Smoking', 'Masking']:
            # Rökning/vape sker oftare under arbetstid
            hour = random.choices(
                range(24),
                weights=[1]*8 + [3]*8 + [1]*8  # Högre vikt 08-16
            )[0]
            minute = random.randint(0, 59)
            event_time = event_time.replace(hour=hour, minute=minute, second=random.randint(0, 59))
        else:
            # Andra events - normal fördelning
            hour = random.randint(0, 23)
            minute = random.randint(0, 59)
            event_time = event_time.replace(hour=hour, minute=minute, second=random.randint(0, 59))

        # Se till att event_time är inom perioden
        if start_date <= event_time <= end_date:
            events.append(event_time)

    # Sortera efter tid
    events.sort()
    return events


def create_event_point(event_type: str, timestamp: datetime) -> Point:
    """
    Skapa en InfluxDB Point för ett event

    Args:
        event_type: Event-typ
        timestamp: Tidsstämpel

    Returns:
        InfluxDB Point
    """
    event_id = str(uuid.uuid4())
    severity = EVENT_SEVERITY.get(event_type, 'INFO')
    summary = EVENT_SUMMARIES.get(event_type, f'{event_type} event')
    type_value = EVENT_TYPE_MAPPING.get(event_type, event_type)

    # Generera realistiska värden för vissa event-typer
    rawval = 0
    current_value = None
    threshold_value = None

    if event_type in ['Vape', 'THC', 'Smoking', 'Masking']:
        rawval = random.randint(1, 10)
        current_value = rawval
    elif event_type in ['CO2cal', 'TVOC', 'PM2.5', 'PM1', 'PM10']:
        rawval = random.randint(50, 200)
        current_value = rawval
        threshold_value = random.randint(40, 150)
    elif event_type in ['CO', 'NO2', 'NH3']:
        rawval = random.randint(1, 50)
        current_value = rawval
        threshold_value = random.randint(5, 30)
    elif event_type in ['Temp_C', 'Temp_C_Low']:
        rawval = random.randint(15, 30)
        current_value = rawval
        threshold_value = random.randint(20, 28)
    elif event_type in ['Humidity', 'Humidity_Low']:
        rawval = random.randint(20, 80)
        current_value = rawval
        threshold_value = random.randint(30, 70)
    elif event_type == 'Sound':
        rawval = random.randint(60, 90)
        current_value = rawval
        threshold_value = random.randint(65, 85)
    elif event_type == 'Light':
        rawval = random.randint(100, 1000)
        current_value = rawval
        threshold_value = random.randint(200, 800)
    elif event_type == 'Motion':
        rawval = 1
        current_value = 1
    else:
        rawval = random.randint(1, 5)
        current_value = rawval

    # Skapa details
    details = {
        'event_id': event_type.lower(),
        'rawval': rawval,
        'state': 1,
        'halo_event_data': {
            'state': 1,
            'rawval': rawval
        }
    }

    # Skapa Point
    point = Point("events") \
        .tag("type", type_value) \
        .tag("severity", severity) \
        .tag("status", "ACTIVE") \
        .tag("device_id", DEVICE_ID) \
        .tag("source", f"halo-event-{event_type.lower()}") \
        .field("summary", summary) \
        .field("details", json.dumps(details)) \
        .field("event_id", event_id) \
        .time(timestamp)

    if current_value is not None:
        point = point.field("current_value", float(current_value))
    if threshold_value is not None:
        point = point.field("threshold_value", float(threshold_value))

    return point


def generate_mock_events():
    """Huvudfunktion för att generera mock events"""
    print("=" * 60)
    print("Generating Mock Events")
    print("=" * 60)
    print()

    # Datum: 1 år bakåt till idag
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=365)

    print(f"Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"Total days: {(end_date - start_date).days}")
    print()

    # Anslut till InfluxDB
    try:
        client = InfluxDBClient(
            url=INFLUXDB_URL,
            token=INFLUXDB_TOKEN,
            org=INFLUXDB_ORG
        )
        write_api = client.write_api(write_options=SYNCHRONOUS)
        print(f"Connected to InfluxDB at {INFLUXDB_URL}")
        print(f"Bucket: {INFLUXDB_BUCKET}")
        print()
    except Exception as e:
        print(f"Failed to connect to InfluxDB: {e}")
        sys.exit(1)

    # Generera events för alla event-typer
    all_points = []
    total_events = 0

    print("Generating events...")
    for event_type in EVENT_FREQUENCIES.keys():
        event_times = generate_event_times(event_type, start_date, end_date)
        print(f"  {event_type}: {len(event_times)} events")

        for timestamp in event_times:
            point = create_event_point(event_type, timestamp)
            all_points.append(point)
            total_events += 1

    print()
    print(f"Total events generated: {total_events}")
    print()

    # Skriv till InfluxDB i batchar
    print("Writing events to InfluxDB...")
    batch_size = 1000
    written = 0

    for i in range(0, len(all_points), batch_size):
        batch = all_points[i:i + batch_size]
        write_api.write(bucket=INFLUXDB_BUCKET, record=batch)
        written += len(batch)
        print(f"  Written {written}/{total_events} events...")

    print()
    print("=" * 60)
    print(f"Completed! Total events written: {total_events}")
    print("=" * 60)

    # Stäng anslutning
    client.close()


if __name__ == "__main__":
    generate_mock_events()

