"""
Generate Mock Data - Skapar 365 dagar av realistisk historisk data

Innehaller inbyggda trender for att demonstrera degraderingsvarningar:
- Ljudniva: Gradvis okning +5 dB over 6 manader (simulerar slitageljud)
- Ljus: Gradvis minskning -15% over 9 manader (simulerar lampslitage)
- CO2: Normala dygnsvariatoner + nagra toppar
- Temperatur: Sasongsvariationer + liten drift uppat

Kor med: python -m scripts.generate_mock_data
"""
import os
import sys
import math
import random
from datetime import datetime, timedelta
from typing import Generator, Dict, Any

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS


# InfluxDB configuration
INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://localhost:8086")
INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", "")
INFLUXDB_ORG = os.getenv("INFLUXDB_ORG", "halo-org")
INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "halo-sensors")

# Device ID for mock data - same as live data
DEVICE_ID = "halo-device-1"

# Number of days to generate
DAYS_TO_GENERATE = 365

# Sample interval in minutes
SAMPLE_INTERVAL_MINUTES = 5


def get_hour_of_day(dt: datetime) -> float:
    """Get hour as float (0-24) for day cycle calculations"""
    return dt.hour + dt.minute / 60.0


def get_day_of_year(dt: datetime) -> int:
    """Get day of year (1-365)"""
    return dt.timetuple().tm_yday


def generate_temperature(dt: datetime, day_index: int) -> float:
    """
    Generate realistic temperature with:
    - Daily cycle (warmer during day)
    - Seasonal variation (warmer in summer)
    - Slight upward drift over time (simulating HVAC degradation)
    - Random noise
    """
    base_temp = 21.5  # Base temperature

    # Daily cycle: warmer during work hours
    hour = get_hour_of_day(dt)
    daily_cycle = 1.5 * math.sin((hour - 6) * math.pi / 12)  # Peak at 12:00

    # Seasonal variation (assuming starting date around autumn)
    day_of_year = get_day_of_year(dt)
    seasonal = 2.0 * math.cos((day_of_year - 172) * 2 * math.pi / 365)  # Coldest around day 172 (winter)

    # Degradation trend: +0.5C over 365 days (HVAC inefficiency)
    drift = (day_index / 365.0) * 0.5

    # Random noise
    noise = random.gauss(0, 0.3)

    return round(base_temp + daily_cycle + seasonal + drift + noise, 1)


def generate_humidity(dt: datetime, temperature: float) -> float:
    """
    Generate humidity inversely correlated with temperature
    """
    base_humidity = 45.0

    # Inverse correlation with temperature
    temp_effect = -(temperature - 21.5) * 2

    # Daily variation
    hour = get_hour_of_day(dt)
    daily_cycle = 5 * math.sin((hour - 18) * math.pi / 12)  # Higher at night

    # Random noise
    noise = random.gauss(0, 3)

    value = base_humidity + temp_effect + daily_cycle + noise
    return round(max(25, min(75, value)), 1)  # Clamp between 25-75%


def generate_co2(dt: datetime, day_index: int) -> float:
    """
    Generate CO2 levels with:
    - Higher during daytime (simulated occupancy)
    - Weekend reduction
    - Occasional spikes
    """
    base_co2 = 450.0  # Outdoor baseline

    # Weekday/weekend effect
    is_weekend = dt.weekday() >= 5
    occupancy_factor = 0.3 if is_weekend else 1.0

    # Daily cycle: higher during work hours (9-17)
    hour = get_hour_of_day(dt)
    if 9 <= hour <= 17:
        work_hours_factor = 200 * occupancy_factor
    else:
        work_hours_factor = 50 * occupancy_factor

    # Occasional random spikes (meetings, events)
    spike = 0
    if random.random() < 0.02:  # 2% chance of spike
        spike = random.uniform(100, 300)

    # Random noise
    noise = random.gauss(0, 20)

    value = base_co2 + work_hours_factor + spike + noise
    return round(max(400, value), 0)


def generate_tvoc(dt: datetime, co2: float) -> float:
    """
    Generate TVOC correlated with CO2 but lower values
    """
    # Base TVOC correlated with CO2
    base_tvoc = (co2 - 400) * 0.15 + 50

    # Morning spike (cleaning products)
    hour = get_hour_of_day(dt)
    if 7 <= hour <= 9:
        morning_spike = random.uniform(20, 50)
    else:
        morning_spike = 0

    # Random noise
    noise = random.gauss(0, 10)

    value = base_tvoc + morning_spike + noise
    return round(max(0, value), 0)


def generate_sound(dt: datetime, day_index: int) -> float:
    """
    Generate sound levels with DEGRADATION TREND:
    - Gradual increase of +5 dB over 6 months (equipment wear)
    - Higher during work hours
    - Weekend reduction
    """
    base_sound = 38.0  # Night/empty room baseline

    # DEGRADATION TREND: +5 dB over 180 days (6 months)
    # This simulates fans/equipment getting louder over time
    degradation_days = min(day_index, 180)
    degradation = (degradation_days / 180.0) * 5.0

    # Weekday/weekend effect
    is_weekend = dt.weekday() >= 5

    # Daily cycle: louder during work hours
    hour = get_hour_of_day(dt)
    if is_weekend:
        work_noise = 3 if 10 <= hour <= 16 else 0
    else:
        if 8 <= hour <= 18:
            work_noise = 12 + random.uniform(-2, 5)
        else:
            work_noise = 2

    # Random noise
    noise = random.gauss(0, 1.5)

    value = base_sound + degradation + work_noise + noise
    return round(max(30, min(80, value)), 1)


def generate_light(dt: datetime, day_index: int) -> float:
    """
    Generate light levels with DEGRADATION TREND:
    - Gradual decrease of -15% over 9 months (lamp aging)
    - Follows daylight and work patterns
    - Weekend reduction
    """
    base_light = 450.0  # Normal office lighting

    # DEGRADATION TREND: -15% over 270 days (9 months)
    # This simulates lamps dimming over time
    degradation_days = min(day_index, 270)
    degradation_factor = 1.0 - (degradation_days / 270.0) * 0.15

    # Weekday/weekend effect
    is_weekend = dt.weekday() >= 5

    # Daily cycle
    hour = get_hour_of_day(dt)

    if is_weekend:
        if 10 <= hour <= 15:
            light_level = 200  # Some natural light
        else:
            light_level = 20  # Very dim
    else:
        if 7 <= hour <= 19:
            # Work hours - full lighting with degradation
            light_level = base_light * degradation_factor
            # Add some natural light variation
            natural_light = 50 * math.sin((hour - 6) * math.pi / 12)
            light_level += natural_light
        else:
            # After hours - minimal lighting
            light_level = 30

    # Random noise
    noise = random.gauss(0, 15)

    return round(max(0, light_level + noise), 0)


def generate_pm25(dt: datetime) -> float:
    """Generate PM2.5 levels"""
    base_pm = 8.0

    # Slightly higher during day
    hour = get_hour_of_day(dt)
    daily_variation = 3 * math.sin((hour - 6) * math.pi / 12)

    # Occasional spikes
    spike = random.uniform(5, 15) if random.random() < 0.05 else 0

    # Random noise
    noise = random.gauss(0, 2)

    value = base_pm + daily_variation + spike + noise
    return round(max(0, value), 1)


def generate_pm10(pm25: float) -> float:
    """Generate PM10 correlated with PM2.5"""
    ratio = random.uniform(1.3, 2.0)
    noise = random.gauss(0, 3)
    return round(max(0, pm25 * ratio + noise), 1)


def generate_aqi(pm25: float, co2: float) -> int:
    """Calculate Air Quality Index (0-5 scale)"""
    # Simple AQI based on PM2.5 and CO2
    pm_score = min(5, pm25 / 25 * 5)
    co2_score = min(5, (co2 - 400) / 1500 * 5)

    # Weighted average
    aqi = (pm_score * 0.6 + co2_score * 0.4)
    return round(min(5, max(0, aqi)), 1)


def generate_health_index(temperature: float, humidity: float, co2: float, tvoc: float) -> float:
    """Calculate Health Index (0-3 scale, 0=good, 3=bad)"""
    score = 0

    # Temperature score
    if temperature < 18 or temperature > 26:
        score += 0.5
    elif temperature < 19 or temperature > 25:
        score += 0.2

    # Humidity score
    if humidity < 30 or humidity > 60:
        score += 0.5
    elif humidity < 35 or humidity > 55:
        score += 0.2

    # CO2 score
    if co2 > 1500:
        score += 1.0
    elif co2 > 1000:
        score += 0.5
    elif co2 > 800:
        score += 0.2

    # TVOC score
    if tvoc > 500:
        score += 1.0
    elif tvoc > 200:
        score += 0.3

    return round(min(3, score), 1)


def generate_data_points(start_date: datetime, end_date: datetime) -> Generator[Dict[str, Any], None, None]:
    """Generate all data points for the date range"""
    current_date = start_date
    day_index = 0

    while current_date < end_date:
        # Calculate day index from start
        day_index = (current_date - start_date).days

        # Generate all sensor values
        temp = generate_temperature(current_date, day_index)
        humidity = generate_humidity(current_date, temp)
        co2 = generate_co2(current_date, day_index)
        tvoc = generate_tvoc(current_date, co2)
        sound = generate_sound(current_date, day_index)
        light = generate_light(current_date, day_index)
        pm25 = generate_pm25(current_date)
        pm10 = generate_pm10(pm25)
        aqi = generate_aqi(pm25, co2)
        health = generate_health_index(temp, humidity, co2, tvoc)

        yield {
            "timestamp": current_date,
            "day_index": day_index,
            "sensors": {
                "htsensor/ctemp": temp,
                "htsensor/humidity": humidity,
                "co2sensor/co2fo": co2,
                "co2sensor/tvoc": tvoc,
                "audsensor/sum": sound,
                "luxsensor/alux": light,
                "pmsensor/pm2p5conc": pm25,
                "pmsensor/pm10conc": pm10,
                "AQI/src": aqi,
                "HealthIndex/val": health,
            }
        }

        # Move to next sample
        current_date += timedelta(minutes=SAMPLE_INTERVAL_MINUTES)


def write_to_influxdb(client: InfluxDBClient, data_points: Generator):
    """Write data points to InfluxDB in batches

    Uses same measurement format as live data:
    - measurement: sensor_{sensor_type} (e.g., sensor_htsensor, sensor_co2sensor)
    - tag: sensor_id = full sensor path (e.g., htsensor/ctemp)
    - field: value = sensor value
    """
    write_api = client.write_api(write_options=SYNCHRONOUS)

    batch = []
    batch_size = 5000
    total_points = 0

    print(f"Writing mock data to InfluxDB...")
    print(f"  URL: {INFLUXDB_URL}")
    print(f"  Org: {INFLUXDB_ORG}")
    print(f"  Bucket: {INFLUXDB_BUCKET}")
    print()

    for data in data_points:
        timestamp = data["timestamp"]

        for sensor_id, value in data["sensors"].items():
            # Extract sensor type from sensor_id (e.g., "htsensor" from "htsensor/ctemp")
            sensor_type = sensor_id.split('/')[0]
            measurement_name = f"sensor_{sensor_type}"

            point = (
                Point(measurement_name)
                .tag("device_id", DEVICE_ID)
                .tag("sensor_id", sensor_id)
                .field("value", float(value))
                .time(timestamp)
            )
            batch.append(point)

        if len(batch) >= batch_size:
            write_api.write(bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG, record=batch)
            total_points += len(batch)
            print(f"  Written {total_points:,} points... (Day {data['day_index']+1}/{DAYS_TO_GENERATE})")
            batch = []

    # Write remaining points
    if batch:
        write_api.write(bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG, record=batch)
        total_points += len(batch)

    print(f"\nCompleted! Total points written: {total_points:,}")
    return total_points


def main():
    """Main entry point"""
    print("=" * 60)
    print("Tekniklokaler Dashboard - Mock Data Generator")
    print("=" * 60)
    print()

    # Calculate date range
    end_date = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=DAYS_TO_GENERATE)

    print(f"Configuration:")
    print(f"  Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"  Days: {DAYS_TO_GENERATE}")
    print(f"  Sample interval: {SAMPLE_INTERVAL_MINUTES} minutes")
    print(f"  Device ID: {DEVICE_ID}")
    print()

    # Calculate expected number of points
    total_samples = (DAYS_TO_GENERATE * 24 * 60) // SAMPLE_INTERVAL_MINUTES
    total_points = total_samples * 10  # 10 sensors
    print(f"Expected data points: ~{total_points:,}")
    print()

    # Degradation trends summary
    print("Built-in degradation trends for demo:")
    print("  - Sound: +5 dB over 6 months (equipment wear)")
    print("  - Light: -15% over 9 months (lamp aging)")
    print("  - Temperature: +0.5C over 12 months (HVAC drift)")
    print()

    # Confirm before proceeding
    if not os.getenv("MOCK_DATA_CONFIRM", "").lower() == "yes":
        print("WARNING: This will generate a large amount of data.")
        print("Set MOCK_DATA_CONFIRM=yes to run automatically,")
        response = input("or type 'yes' to continue: ")
        if response.lower() != 'yes':
            print("Aborted.")
            return

    print()

    # Connect to InfluxDB
    try:
        client = InfluxDBClient(
            url=INFLUXDB_URL,
            token=INFLUXDB_TOKEN,
            org=INFLUXDB_ORG
        )

        # Test connection
        health = client.health()
        print(f"InfluxDB connection: {health.status}")
        print()

    except Exception as e:
        print(f"ERROR: Failed to connect to InfluxDB: {e}")
        print()
        print("Make sure InfluxDB is running and environment variables are set:")
        print("  INFLUXDB_URL, INFLUXDB_TOKEN, INFLUXDB_ORG, INFLUXDB_BUCKET")
        sys.exit(1)

    # Generate and write data
    try:
        data_generator = generate_data_points(start_date, end_date)
        write_to_influxdb(client, data_generator)
        print()
        print("Mock data generation complete!")

    except Exception as e:
        print(f"ERROR: Failed to write data: {e}")
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    main()
