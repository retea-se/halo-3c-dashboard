"""
Generate Mock Data Once - Engångsskript för att fylla historik fram till 2025-11-29 06:00
Kör inuti backend-containern: python scripts/generate_mock_data_once.py
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
INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://halo-influxdb:8086")
INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", "")
INFLUXDB_ORG = os.getenv("INFLUXDB_ORG", "halo-org")
INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "halo-sensors")

# Device ID for mock data - same as live data
DEVICE_ID = "halo-device-1"

# Fixed end date: 2025-11-29 06:00 UTC
END_DATE = datetime(2025, 11, 29, 6, 0, 0)

# Start date: 365 days before end date
START_DATE = END_DATE - timedelta(days=365)

# Sample interval in minutes
SAMPLE_INTERVAL_MINUTES = 5


def get_hour_of_day(dt: datetime) -> float:
    """Get hour as float (0-24) for day cycle calculations"""
    return dt.hour + dt.minute / 60.0


def get_day_of_year(dt: datetime) -> int:
    """Get day of year (1-365)"""
    return dt.timetuple().tm_yday


def generate_temperature(dt: datetime, day_index: int) -> float:
    base_temp = 21.5
    hour = get_hour_of_day(dt)
    daily_cycle = 1.5 * math.sin((hour - 6) * math.pi / 12)
    day_of_year = get_day_of_year(dt)
    seasonal = 2.0 * math.cos((day_of_year - 172) * 2 * math.pi / 365)
    drift = (day_index / 365.0) * 0.5
    noise = random.gauss(0, 0.3)
    return round(base_temp + daily_cycle + seasonal + drift + noise, 1)


def generate_humidity(dt: datetime, temperature: float) -> float:
    base_humidity = 45.0
    temp_effect = -(temperature - 21.5) * 2
    hour = get_hour_of_day(dt)
    daily_cycle = 5 * math.sin((hour - 18) * math.pi / 12)
    noise = random.gauss(0, 3)
    value = base_humidity + temp_effect + daily_cycle + noise
    return round(max(25, min(75, value)), 1)


def generate_co2(dt: datetime, day_index: int) -> float:
    base_co2 = 450.0
    is_weekend = dt.weekday() >= 5
    occupancy_factor = 0.3 if is_weekend else 1.0
    hour = get_hour_of_day(dt)
    if 9 <= hour <= 17:
        work_hours_factor = 200 * occupancy_factor
    else:
        work_hours_factor = 50 * occupancy_factor
    spike = 0
    if random.random() < 0.02:
        spike = random.uniform(100, 300)
    noise = random.gauss(0, 20)
    value = base_co2 + work_hours_factor + spike + noise
    return round(max(400, value), 0)


def generate_tvoc(dt: datetime, co2: float) -> float:
    base_tvoc = (co2 - 400) * 0.15 + 50
    hour = get_hour_of_day(dt)
    if 7 <= hour <= 9:
        morning_spike = random.uniform(20, 50)
    else:
        morning_spike = 0
    noise = random.gauss(0, 10)
    value = base_tvoc + morning_spike + noise
    return round(max(0, value), 0)


def generate_sound(dt: datetime, day_index: int) -> float:
    base_sound = 38.0
    degradation_days = min(day_index, 180)
    degradation = (degradation_days / 180.0) * 5.0
    is_weekend = dt.weekday() >= 5
    hour = get_hour_of_day(dt)
    if is_weekend:
        work_noise = 3 if 10 <= hour <= 16 else 0
    else:
        if 8 <= hour <= 18:
            work_noise = 12 + random.uniform(-2, 5)
        else:
            work_noise = 2
    noise = random.gauss(0, 1.5)
    value = base_sound + degradation + work_noise + noise
    return round(max(30, min(80, value)), 1)


def generate_light(dt: datetime, day_index: int) -> float:
    base_light = 450.0
    degradation_days = min(day_index, 270)
    degradation_factor = 1.0 - (degradation_days / 270.0) * 0.15
    is_weekend = dt.weekday() >= 5
    hour = get_hour_of_day(dt)
    if is_weekend:
        if 10 <= hour <= 15:
            light_level = 200
        else:
            light_level = 20
    else:
        if 7 <= hour <= 19:
            light_level = base_light * degradation_factor
            natural_light = 50 * math.sin((hour - 6) * math.pi / 12)
            light_level += natural_light
        else:
            light_level = 30
    noise = random.gauss(0, 15)
    return round(max(0, light_level + noise), 0)


def generate_pm25(dt: datetime) -> float:
    base_pm = 8.0
    hour = get_hour_of_day(dt)
    daily_variation = 3 * math.sin((hour - 6) * math.pi / 12)
    spike = random.uniform(5, 15) if random.random() < 0.05 else 0
    noise = random.gauss(0, 2)
    value = base_pm + daily_variation + spike + noise
    return round(max(0, value), 1)


def generate_pm10(pm25: float) -> float:
    ratio = random.uniform(1.3, 2.0)
    noise = random.gauss(0, 3)
    return round(max(0, pm25 * ratio + noise), 1)


def generate_aqi(pm25: float, co2: float) -> int:
    pm_score = min(5, pm25 / 25 * 5)
    co2_score = min(5, (co2 - 400) / 1500 * 5)
    aqi = (pm_score * 0.6 + co2_score * 0.4)
    return round(min(5, max(0, aqi)), 1)


def generate_health_index(temperature: float, humidity: float, co2: float, tvoc: float) -> float:
    score = 0
    if temperature < 18 or temperature > 26:
        score += 0.5
    elif temperature < 19 or temperature > 25:
        score += 0.2
    if humidity < 30 or humidity > 60:
        score += 0.5
    elif humidity < 35 or humidity > 55:
        score += 0.2
    if co2 > 1500:
        score += 1.0
    elif co2 > 1000:
        score += 0.5
    elif co2 > 800:
        score += 0.2
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
        day_index = (current_date - start_date).days

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

        current_date += timedelta(minutes=SAMPLE_INTERVAL_MINUTES)


def write_to_influxdb(client: InfluxDBClient, data_points: Generator):
    """Write data points to InfluxDB in batches"""
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
            print(f"  Written {total_points:,} points... (Day {data['day_index']+1}/365)")
            batch = []

    if batch:
        write_api.write(bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG, record=batch)
        total_points += len(batch)

    print(f"\nCompleted! Total points written: {total_points:,}")
    return total_points


def main():
    """Main entry point"""
    print("=" * 60)
    print("Halo Dashboard - One-time Mock Data Generator")
    print("=" * 60)
    print()

    print(f"Configuration:")
    print(f"  Start date: {START_DATE.strftime('%Y-%m-%d %H:%M')}")
    print(f"  End date: {END_DATE.strftime('%Y-%m-%d %H:%M')}")
    print(f"  Sample interval: {SAMPLE_INTERVAL_MINUTES} minutes")
    print(f"  Device ID: {DEVICE_ID}")
    print()

    total_samples = int((END_DATE - START_DATE).total_seconds() / (SAMPLE_INTERVAL_MINUTES * 60))
    total_points = total_samples * 10
    print(f"Expected data points: ~{total_points:,}")
    print()

    print("Built-in degradation trends:")
    print("  - Sound: +5 dB over 6 months (equipment wear)")
    print("  - Light: -15% over 9 months (lamp aging)")
    print("  - Temperature: +0.5C over 12 months (HVAC drift)")
    print()

    # Connect to InfluxDB
    try:
        client = InfluxDBClient(
            url=INFLUXDB_URL,
            token=INFLUXDB_TOKEN,
            org=INFLUXDB_ORG
        )

        health = client.health()
        print(f"InfluxDB connection: {health.status}")
        print()

    except Exception as e:
        print(f"ERROR: Failed to connect to InfluxDB: {e}")
        sys.exit(1)

    # Generate and write data
    try:
        data_generator = generate_data_points(START_DATE, END_DATE)
        write_to_influxdb(client, data_generator)
        print()
        print("Mock data generation complete!")

    except Exception as e:
        print(f"ERROR: Failed to write data: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    main()
