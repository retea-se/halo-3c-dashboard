"""
Run collector locally on host (outside Docker) to access Halo sensor on local network
Kör med: python run_collector_local.py
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "src" / "backend"
sys.path.insert(0, str(backend_path))

# Set PYTHONPATH
os.environ["PYTHONPATH"] = str(backend_path)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Override InfluxDB URL for local execution (use Docker container)
influxdb_url = os.getenv("INFLUXDB_URL", "http://localhost:8086")
if "influxdb:8086" in influxdb_url:
    influxdb_url = influxdb_url.replace("influxdb:8086", "localhost:8086")
os.environ["INFLUXDB_URL"] = influxdb_url

# Import and run collector
if __name__ == "__main__":
    from collector.main import main
    print("=" * 60)
    print("Running Halo 3C Collector on HOST (outside Docker)")
    print("=" * 60)
    print(f"InfluxDB URL: {influxdb_url}")
    print(f"Halo IP: {os.getenv('HALO_IP', '192.168.0.73')}")
    print("=" * 60)
    print()
    try:
        main()
    except KeyboardInterrupt:
        print("\n[INFO] Collector stopped by user")
        sys.exit(0)

