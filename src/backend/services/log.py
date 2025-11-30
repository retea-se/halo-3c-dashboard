"""
Log Service - Hämtar rådata från InfluxDB för logg-visning
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import json

from .influxdb import InfluxDBService

logger = logging.getLogger(__name__)


class LogService:
    """Service för att hämta rådata från InfluxDB för logg-visning"""

    def __init__(self):
        self.influxdb = InfluxDBService()
        self.bucket = self.influxdb.get_bucket()
        self.device_id = "halo-device-1"  # TODO: Lägg till som parameter

    def _datetime_to_flux_time(self, dt: datetime) -> str:
        """Konvertera datetime till Flux time string"""
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    def get_log_data(
        self,
        measurement: Optional[str] = None,
        hours: int = 24,
        limit: int = 1000,
        device_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Hämta rådata från InfluxDB för logg-visning

        Args:
            measurement: Measurement-typ att filtrera på (events, sensor_*, beacon_presence, heartbeat, eller "all")
            hours: Antal timmar bakåt (default: 24)
            limit: Max antal rader (default: 1000)
            device_id: Device ID (optional)

        Returns:
            Dictionary med log-data
        """
        device_id = device_id or self.device_id

        try:
            # Beräkna tidsperiod
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=hours)

            start_flux = self._datetime_to_flux_time(start_time)
            stop_flux = self._datetime_to_flux_time(end_time)

            # Bygg Flux query
            query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: {start_flux}, stop: {stop_flux})
            '''

            # Lägg till measurement-filter
            if measurement and measurement != "all":
                if measurement == "sensor":
                    # Filtrera på alla sensor_* measurements
                    query += '|> filter(fn: (r) => r["_measurement"] =~ /^sensor_/)'
                else:
                    # Specifik measurement
                    query += f'|> filter(fn: (r) => r["_measurement"] == "{measurement}")'
            # Om measurement är "all" eller None, hämta alla

            # Filtrera på device_id om tag finns (vissa measurements kanske inte har device_id)
            # Vi gör detta i två steg: först kolla om device_id finns, sedan filtrera
            query += f'|> filter(fn: (r) => not exists r["device_id"] or r["device_id"] == "{device_id}")'

            # Sortera och begränsa INNAN pivot för prestanda
            # Pivot är en tung operation, så vi minimerar data först
            query += '''
              |> sort(columns: ["_time"], desc: true)
            '''

            # Limit innan pivot (begränsa antal rader tidigt)
            query += f'|> limit(n: {limit * 5})'

            # Pivot för att samla alla fields till en rad per datapunkt
            query += '''
              |> pivot(rowKey: ["_time", "_measurement"], columnKey: ["_field"], valueColumn: "_value")
            '''

            # Final limit efter pivot
            query += f'|> limit(n: {limit})'

            # Kör query
            result = self.influxdb.query_api.query(query=query)

            # Konvertera till log-format
            # Efter pivot har vi en rad per timestamp+measurement med alla fields som kolumner
            log_entries = []
            seen_entries = {}  # För att deduplisera samma timestamp+measurement+tags

            # Kända tag-namn (från InfluxDB schema)
            known_tags = {
                'device_id', 'sensor_id', 'event_id', 'beacon_id', 'beacon_name',
                'type', 'severity', 'status', 'source', 'location', 'sensor_metadata_id'
            }

            for table in result:
                for record in table.records:
                    timestamp = record.get_time()
                    measurement_name = record.values.get('_measurement', 'unknown')

                    # Extrahera tags och fields från pivoterad data
                    tags = {}
                    fields = {}
                    id_value = None

                    # Gå igenom alla värden i record
                    for key_name, value in record.values.items():
                        if key_name in ['_time', '_measurement', '_start', '_stop']:
                            continue

                        # Identifiera om det är en tag eller field
                        if key_name in known_tags:
                            tags[key_name] = value
                            # Identifiera ID från tags
                            if key_name in ['sensor_id', 'event_id', 'beacon_id']:
                                id_value = value
                        else:
                            # Detta är ett field
                            if value is not None:  # Skippa None-värden
                                fields[key_name] = value

                    # Om inget ID hittades, försök hitta från source eller andra taggar
                    if not id_value:
                        id_value = tags.get('source', tags.get('beacon_name', tags.get('sensor_id', 'unknown')))

                    # Skapa unik nyckel för timestamp + measurement + id
                    key = f"{timestamp.isoformat()}_{measurement_name}_{id_value}"

                    # Om vi redan har denna kombination, uppdatera fields
                    if key in seen_entries:
                        entry = seen_entries[key]
                        # Lägg till nya fields (Python dict merge)
                        entry['fields'].update(fields)
                    else:
                        entry = {
                            'timestamp': timestamp.isoformat(),
                            'measurement': measurement_name,
                            'id': id_value or 'unknown',
                            'tags': tags,
                            'fields': fields
                        }
                        seen_entries[key] = entry
                        log_entries.append(entry)

            # Extrahera huvudvärde från fields
            for entry in log_entries:
                # Försök hitta ett huvudvärde
                value = None
                if 'value' in entry['fields']:
                    value = entry['fields']['value']
                elif 'summary' in entry['fields']:
                    value = entry['fields']['summary']
                elif 'current_value' in entry['fields']:
                    value = entry['fields']['current_value']
                elif entry['fields']:
                    # Ta första värdet
                    value = list(entry['fields'].values())[0] if entry['fields'] else None

                entry['value'] = value

            # Sortera efter timestamp (senaste först)
            log_entries.sort(key=lambda x: x['timestamp'], reverse=True)

            return {
                'data': log_entries,
                'total': len(log_entries),
                'measurement': measurement or 'all',
                'hours': hours
            }

        except Exception as e:
            logger.error(f"Failed to get log data: {e}", exc_info=True)
            return {
                'data': [],
                'total': 0,
                'measurement': measurement or 'all',
                'hours': hours
            }

