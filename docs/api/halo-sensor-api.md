# HALO 3C Smart Sensor - API Reference

This document describes the REST API for integrating with HALO 3C smart sensors.

## Overview

HALO 3C is an advanced IoT smart sensor with comprehensive capabilities for air quality, sound, motion, and security monitoring. The sensor exposes a REST API with **450+ endpoints**.

## Authentication

All API requests require HTTP Basic Authentication:

```bash
curl -u username:password http://SENSOR_IP/api/config/gstate/latest
```

## Core Endpoints

### Sensor Data

#### GET /api/config/gstate/latest

Returns all current sensor values. This is the primary endpoint for sensor data.

**Example Response:**

```json
{
  "htsensor/ctemp": 22.5,
  "htsensor/humidity": 45.0,
  "co2sensor/co2": 450,
  "co2sensor/tvoc": 120,
  "pmsensor/raw/1": 12,
  "pmsensor/raw/2": 18,
  "AQI/value": 42,
  "audsensor/sum": 35,
  "pir/max": 0,
  "HealthIndex/val": 1
}
```

**Available Sensor Paths:**

| Path                 | Description              | Unit      |
| -------------------- | ------------------------ | --------- |
| `htsensor/ctemp`     | Temperature              | °C        |
| `htsensor/humidity`  | Relative Humidity        | %         |
| `htsensor/millibar`  | Atmospheric Pressure     | hPa       |
| `co2sensor/co2`      | CO2 (calibrated)         | ppm       |
| `co2sensor/tvoc`     | Total VOC                | ppb       |
| `pmsensor/raw/0`     | PM1.0                    | µg/m³     |
| `pmsensor/raw/1`     | PM2.5                    | µg/m³     |
| `pmsensor/raw/2`     | PM10                     | µg/m³     |
| `gassensor/co`       | Carbon Monoxide          | ppm       |
| `gassensor/no2`      | Nitrogen Dioxide         | ppb       |
| `gassensor/nh3`      | Ammonia                  | ppm       |
| `AQI/value`          | Air Quality Index        | 0-500     |
| `HealthIndex/val`    | Health Index             | 0-5       |
| `audsensor/sum`      | Sound Level              | dB        |
| `luxsensor/aluxfilt` | Light Level              | lux       |
| `pir/max`            | Motion (PIR)             | 0-1000    |
| `accsensor/move`     | Movement (Accelerometer) | arbitrary |

#### GET /api/sensors/list

Returns a list of all available sensors with descriptions.

#### Individual Sensor Data Endpoints

These endpoints return detailed sensor data objects with timestamps for individual sensors. Each endpoint returns a JSON object with sensor-specific fields and metadata.

| Endpoint                                         | Description                        | Key Fields                                                      |
| ------------------------------------------------ | ---------------------------------- | --------------------------------------------------------------- |
| `GET /api/config/gstate/latest/co2sensor/data`   | CO2 sensor detailed data           | `co2`, `co2f`, `tvoc`, `TVOC`, `t`, `_rtime`, `_rtimet`         |
| `GET /api/config/gstate/latest/htsensor/data`    | Temperature & Humidity sensor data | `ctemp`, `ftemp`, `humidity`, `press`, `millibar`               |
| `GET /api/config/gstate/latest/pmsensor/data`    | Particulate Matter sensor data     | `pm1`, `pm2p5`, `pm10`, `t`, `_rtime`, `_rtimet`, `ser`, `ver`  |
| `GET /api/config/gstate/latest/gassensor/data`   | Gas sensor data (CO, NO2, NH3)     | `co`, `no2`, `nh3`, `t`, `_rtime`, `_rtimet`, `AQICO`, `AQINO2` |
| `GET /api/config/gstate/latest/audsensor/data`   | Audio sensor data                  | `l`, `r`, `sum`, `t`, `_rtime`, `_rtimet`, `rms0-3`, `kw1-8`    |
| `GET /api/config/gstate/latest/luxsensor/data`   | Light sensor data                  | `alux`, `aluxfilt`, `displux`, `time`, `_rtime`, `_rtimet`      |
| `GET /api/config/gstate/latest/AQI/data`         | Air Quality Index value            | `value` (string), `src`                                         |
| `GET /api/config/gstate/latest/HealthIndex/data` | Health Index with averages         | `val`, `src`, `co2.avg`, `pm1.avg`, etc.                        |

**Example Response - CO2 Sensor:**

```json
{
  "co2": 988,
  "co2f": 988,
  "tvoc": 6,
  "TVOC": 0.016,
  "t": 1764498035822,
  "_rtime": 1764498035822,
  "_rtimet": "11:20:35 AM",
  "rmox": [1556318.464, 139700.864, ...],
  "IAQ": 1
}
```

**Example Response - Health Index:**

```json
{
  "val": 3,
  "src": 1,
  "co2": {
    "avg": 1069.26,
    "val": 3,
    "raw": 3.35,
    "clr": ["Unhealthy", "#FFA500", ...]
  },
  "pm2p5": {
    "avg": 0.95,
    "val": 1,
    "raw": 1.08
  }
}
```

**Note:** These endpoints return current sensor values with timestamps (`_rtime`, `_rtimet`), but do **not** provide historical data. The timestamps indicate when the measurement was taken.

### Events

#### GET /api/config/gstate/event_state

Returns the current state of all configured events.

**Example:**

```python
import requests

response = requests.get(
    "http://SENSOR_IP/api/config/gstate/event_state",
    auth=("username", "password")
)
events = response.json()

for event_id, data in events.items():
    if isinstance(data, dict) and data.get('state') == 1:
        print(f"ACTIVE: {event_id}")
```

**Event Types:**

| Group            | Events                                                  |
| ---------------- | ------------------------------------------------------- |
| Vaping/Substance | Vape, THC, Masking, Smoking                             |
| Safety           | Gunshot, Aggression, Tamper, Help, Motion               |
| Air Quality      | Health_Index, AQI, TVOC, CO2cal, PM2.5                  |
| Environment      | PM1, PM10, Humidity, Temp_C, NO2, CO, NH3, Light, Sound |

#### GET /api/config/gstate/config/eventgen/events

Returns the configuration for all event rules including thresholds, operators, and actions.

#### Event State Metadata

These endpoints provide metadata about individual events, including data quality and reporting status.

| Endpoint                                                  | Description                                | Response Type                                          |
| --------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| `GET /api/config/gstate/event_state/{event}/missing_data` | Number of missing data points for an event | Integer (e.g., `0`)                                    |
| `GET /api/config/gstate/event_state/{event}/log_set`      | Logging status for an event                | Integer (e.g., `1` = enabled, `0` = disabled)          |
| `GET /api/config/gstate/event_state/{event}/reportTime`   | Last report timestamp for an event         | Unix timestamp in milliseconds (e.g., `1764493829290`) |

**Supported Event Names:**

- `Health_Index`
- `AQI`
- `CO2cal`
- `PM2.5`
- And other configured event IDs

**Example:**

```bash
curl -u user:pass http://SENSOR_IP/api/config/gstate/event_state/Health_Index/missing_data
# Returns: 0

curl -u user:pass http://SENSOR_IP/api/config/gstate/event_state/Health_Index/reportTime
# Returns: 1764493829290
```

**Note:** The `missing_data` field indicates that Halo tracks data gaps internally, but no API endpoint was found to retrieve the actual missing data points.

#### Advanced Conditions

Advanced Conditions allow for filtering and combining values numerically and logically when configuring events. This powerful feature enables complex event triggering logic beyond simple threshold comparisons.

**Basic Examples:**

```
require 5
```

Only trigger this event if value is above threshold for at least 5 seconds. `require` is a logical or state function.

```
and event Small_Particles
```

Only trigger this event if another event (Small_Particles) has also been triggered. `and` is a logical or state function.

```
smooth 15
```

Smooth (ignore) value changes faster than 15 seconds before comparing to the threshold. `smooth` is a numeric or filtering function.

**Combined Functions:**

Functions can be combined. Numeric functions must be first, then followed by logical ones:

```
smooth 15 and Small_Particles require 5
```

Smooth fast value changes before comparing with threshold; if that is above threshold and Small_Particles has triggered for at least 5 seconds, trigger event.

All functions are performed left-to-right unless parenthesis group items to do first on the right. Order does not matter for many sets of functions (+ and -, smooth and zero and rate, etc).

**More Examples:**

```
+ event Large_Particles  smooth3 15  zero 45  scale 0 10 0 100
```

Add in the final (advanced conditioned) value from Large_Particles event, then triple smooth3 value changes faster than 15 seconds, zero-out value changes slower than 45 seconds, then scale result from 400 through 3000 down to and limit result to 0 through 100.

```
+ ( Large_Particles value smooth3 15 ) zero 45 scale 0 10 0 100
```

Like above but only Large_Particles value is smoothed.

```
and ( Large_Particles or Medium_Particles )
```

Either Large_Particles or Medium_Particles must also be set.

**Note:** Values used from other events might be the immediate value or 1 second older. Avoid referring to own event name directly or indirectly.

##### Function Structure

The Advanced Condition field must be one of:

- `empty` - No special instructions (default)
- `value_function` - Special processing of sensor values
- `state_function` - Special processing of event trigger
- `value_function state_function` - If both value functions and state functions are specified, they must be in this order

##### Value Functions

Value functions operate on sensor values and can be chained. Numeric functions must come before logical ones.

**Numbers:**

- `123.45` - Numbers with and without decimals

**Values:**

- `eventval event_id` - Current final filtered or processed value for the event
- `data_source` - Raw sensor data source (see available data sources below)
- `(value_expression)` - A sub expression to compute first
- `number` - A constant value
- `$` - Unfiltered value of the selected source item of the event (implied start for calculation)
- `FLAGV1`, `FLAGV2`, `FLAGV3`, `FLAGV4` - Returns the value of respective flags from messages sent to the Halo
- `if(state_expression, value_expression, value_expression)` - Returns first value if condition is true, otherwise second value

**Available Event IDs:**

- `Health_Index`, `AQI`, `PM1`, `PM2.5`, `PM10`, `TVOC`, `CO2cal`, `Humidity`, `Humidity_Low`, `Temp_C`, `Temp_C_Low`, `NO2`, `Pressure`, `Light`, `Sound`, `CO`, `NH3`, `Vape`, `THC`, `Masking`, `Smoking`, `Gunshot`, `Aggression`, `Tamper`, `Help`, `Motion`

**Available Data Sources:**

- `Temperature_[C]` or `TempC`
- `Temperature_[F]` or `TempF`
- `Relative_Humidity` or `RelHum`
- `Light_Lux` or `Lux`
- `TVOC`, `CO2cal`, `CO2eq`
- `PM1_[1_um_particulates]` or `PM1`
- `PM2.5_[2.5_um_particulates]` or `PM2.5`
- `PM10_[10_um_particulates]` or `PM10`
- `Ammonia` or `NH3`
- `NO2`, `Carbon_Monoxide` or `CO`
- `X_orientation_[milli_g]`, `Y_orientation_[milli_g]`, `Z_orientation_[milli_g]`
- `Move_[mm/100]`
- `Pressure_[inHg]`, `Pressure_[hPa]`
- `AQI`, `AQI_Source`, `NO2_AQI`, `CO_AQI`, `PM10_AQI`, `PM25_AQI`
- `External_Input` or `INP`
- `Panic_Button`, `Motion`
- `Noise_Level_[db]` or `Noise`
- `High_Gain_Mic_[db]` or `HGMic`
- `Low_Gain_Mic_[db]` or `LGMic`
- `Aggression` or `Aud1`
- `Audio_2` or `Aud2`, `Audio_3` or `Aud3`, `Audio_4` or `Aud4`
- `Gunshot`
- `Keyword_1` through `Keyword_8` (or `KW1` through `KW8`)
- `VCO2eq`, `VTVOC`
- `Health_Index` or `HI`
- `Health_Index_Source` or `HIsrc`
- `CO2_Health_Index` or `HIco2`
- `Humidity_Health_Index` or `HIhum`
- `PM1_Health_Index` or `HIpm1`
- `PM2.5_Health_Index` or `HIpm2.5`
- `PM10_Health_Index` or `HIpm10`
- `TVOC_Health_Index` or `HItvoc`
- `NO2_Health_Index` or `HIno2`

**Alternate Data Sources:**

- `data_source||data_source ...` - `||` specifies an alternate data source(s) if the first is not available on that Halo model

**Value Functions:**

**scale** `in_low in_high out_low out_high`

- Scale value from in_low through in_high to out_low through out_high
- in_low and in_high can be reversed to invert the scaling result
- Result is limited to out_low through out_high unless they are reversed which also inverts the scaling
- Reversing both only removes limiting of the result
- Examples:
  - `scale 0 50 0 50` - Just limit value to 0 through 50
  - `scale 0 1000 10 1010` - Adds 10 to value and limits result
  - `scale 0 1 1 0` - The negative of the value
  - `scale 1 0 2 0` - Multiplies value by 2 without limits

**smooth** `number_of_seconds` / **smooth2** / **smooth3** / **smooth4**

- Smooths changes in value to 63% of final value within number_of_seconds (1 pole low pass filter)
- `smooth2` - Additional smoothing removes more variations while still preserving faster changes (2 pole low pass filter)
- `smooth3` - Triple-smooths changes in value to 8% of final value within number_of_seconds (3 pole low pass filter)
- `smooth4` - Quadruple-smooths changes in value to 2% of final value within number_of_seconds (4 pole low pass filter)
- All smooths can be followed by an optional `decay` and a number if the response speed to increases (attacks) should be different from decreases (decays)
- Examples:
  - `smooth 5 decay 60` - Respond to increases in 5 seconds but decreases in 60 seconds
  - `smooth 20 decay 0` - Respond to increases over 20 seconds but instantly drop when decreasing
  - `smooth4 0 decay 30` - Instantly increase but quadruple-smooth decreases

**zero** `number_of_seconds` / **zero2** / **zero3** / **zero4**

- Remove offsets by 63% within number_of_seconds (1 pole high pass filter)
- This is also a scaled rate of change (or velocity) averaged over number_of_seconds
- `zero2` - Double-zeros offsets by 26% within number_of_seconds (2 pole high pass filter, scaled acceleration)
- `zero3` - Triple-zeros offsets by 8% within number_of_seconds (3 pole high pass filter)
- `zero4` - Quadruple-zeros offsets by 2% within number_of_seconds (4 pole high pass filter)
- All zeros can be followed by an optional `decay` and a number
- Examples:
  - `zero 20 decay 0` - Preserve quick increases but instantly remove decreases in value
  - `zero 0 decay 20` - Instantly remove increases in value but preserve decreases in value

**rate** `time_unit_seconds`

- Rate of change (velocity) per time_unit_seconds
- This should usually be averaged using smooth for more useful results
- `rate # rate 1` is acceleration (differentiator with gain)

**+** `value_prod` / **-** `value_prod`

- Add or subtract a value

**max** `value_prod` / **lowlimit** `value_prod`

- Provide the maximum of the current value (or on left) and the supplied parameter value
- `lowlimit` is a synonym where the value parameter is intended as a limiting value

**min** `value_prod` / **highlimit** `value_prod`

- Provide the minimum of the current value (or on left) and the supplied parameter value
- `highlimit` is a synonym where the value parameter is intended as a limiting value

**baseline** `cycle_seconds resolution_seconds rate_cycles name`

- The typical average values and deviations for this time of day (resolution) are subtracted from the current value and returned
- If there are frequent increases in values at this time of day, that is learned and subtracted as well
- The result is always 0 or a positive amount the current value exceeds the typical value
- The average is continually updated slowly and by rate_cycles will be 63% closer to any new value
- The history is saved as the specified name which should be chosen to be unique for all events
- Example: `baseline 604800 900 3 tvoc`
  - 604800 seconds is 1 week cycle time
  - 900 seconds is 15 minute resolution of averages saved
  - 3 is number of cycles to average the typical values (to 63% in 3\*900 sec (45 min), 1 pole filter)

**baselineavg** `cycle_seconds resolution_seconds rate_cycles name`

- The typical average value (baseline) for this time of day (or etc) is subtracted from the current value and returned
- The result is always 0 or a positive amount the current value exceeds the typical value
- Similar to `baseline` but without deviation learning

**baselinepct** `cycle_seconds resolution_seconds rate_cycles name`

- The current value as a percentage of the typical average value (baseline) for this time of day (or etc) is returned
- 100 means current value is the same as the typical average value, 50 would mean half, 200 would mean double, etc.
- The typical average is continually updated slowly and by rate_cycles will be 63% closer to any new value

**Powers and Expressions:**

- Powers are evaluated right to left before \* / + - etc.
- `value ^ value_pow` - Powers are evaluated right to left
- `value_pow * value_pow` - Product of 2 values or powers (evaluated left to right after powers)
- `value_pow / value_pow` - Division of 2 values or powers (evaluated left to right after powers)

##### State Functions

State functions operate on event trigger states and can be chained.

**State Values:**

- `event event_id` - Current final conditioned set or reset state of another event_id
- `not state_value` - Reverse sense of state_value (set or reset)
- `isstarting state_value` - True only at the moment parameter becomes true
- `(state_expression)` - A sub expression to evaluate first
- `$` - Raw result after comparison to the threshold (implied start for calculation)
- `FLAG1`, `FLAG2`, `FLAG3`, `FLAG4` - Returns the value of respective flags from messages sent to the Halo
- `if(state_expression, state_expression, state_expression)` - Returns first condition if condition is true, otherwise second condition

**Comparisons:**

- `value_expression > value_expression` - Greater than
- `value_expression < value_expression` - Less than
- `value_expression >= value_expression` - Greater than or equal
- `value_expression <= value_expression` - Less than or equal
- `value_expression = value_expression` - Equal
- `value_expression != value_expression` - Not equal

**Time-based Conditions:**

- `speaker_on` - True when speaker is being used
- `speaker_off` - True when speaker is not being used
- `time day-range time-range` or `time time-range day-range` - True during the specified local time periods
- Time range can be:
  - `any` - Any time of day
  - `hh:mm-hh:mm` - Starting hour-minute and ending hour-minute (from 00:00 to 23:59)
  - Examples: `09:00-17:30` (9am to 5:30pm), `17:00-09:00` (5pm to 9am)
- Day range can be:
  - `any` - Any day of week
  - `day-of-week` - One day of week (sun, mon, tue, wed, thu, fri, sat)
  - `day-of-week-day-of-week` - Range of week days
  - Examples: `wed` (Wednesday only), `mon-fri` (Monday through Friday), `thu-tue` (anything but Wednesday)
- Complex schedule example: `( time mon-fri 9:00-17:00 or time sat-sun 12:00-15:00 )` - Different times different week days

**State Functions:**

**reverse**

- Reverse the state of the event or condition
- `reverse` by itself will fire the event when value is below threshold
- In an expression, everything to the left is reversed before combining with the right

**and** `state_value` / **or** `state_value`

- `and` - Additionally, this state must also be set ("and" is optional)
- `or` - Alternatively, this state can be set

**require** `time_seconds`

- State must be set for at least time_seconds
- This filters out occurrences shorter than time_seconds
- This delays the set for time_seconds

**hold** `time_seconds`

- Hold state past end time_seconds longer
- This filters out shorter resets
- This delays reset for time_seconds
- It is technically equivalent to `not require # not`

**extend** `time_seconds`

- Short occurrences are extended to a minimum time
- Longer occurrences are unaffected
- This also filters out resets during the first seconds

**report** `value` / **report** `time` / **report** `value value`

- This captures event time and/or value for email, vms or cloud
- It can be placed at the start or in the middle of the state_expression and takes effect when the left portion becomes true
- For value, you can use `$` for the normal value that crosses the threshold
- `report time` captures only the time to be sent
- `report value value` captures only the value to be sent
- Example: `... report $ requires 5 ...` - Report the time and value before the requires 5 instead of after

**allow** `count per time_seconds`

- This filters the frequency of true conditions
- Additional instances of the condition becoming true are suppressed if too frequent
- Example: `... allow 3 per 3600 pause 0` - For 1 hour after the start of a first event, only 2 more events are permitted
- `"pause 0"` is added to allow the events to be adjacent

##### Options at the End of Advanced Conditions

**nocloud** / **allowcloud** `count per time_seconds`

- `allowcloud count per time_seconds` - Filters the frequency of events sent to the cloud (does not affect the expression value)
- Example: `... allowcloud 5 per 86400` - Allow 5 events sent to cloud per day
- `nocloud` - Never send this event to the cloud

**stretch** `time_seconds`

- This is an option that can be added once to an event
- It does not affect the expression value
- It controls the minimum duration of the event
- It will override the global time (30s) to stretch the event reporting

**hysteresis** `threshold_offset`

- This is an option that can be added once to an event
- It does not affect the expression value
- This is amount value must drop below the threshold for the event to stop being triggered
- Events trigger when >= threshold, and stop when < threshold - hysteresis
- The default is 0

##### Special Functions

**H3[** `h3text , h2text` **]**

- This selects alternate Advanced Conditions functions depending on Halo model

**HAVE[** `condition | true_text | false_text` **]**

- This selects alternate Advanced Conditions functions depending presence of other events
- condition can be a list of other event names ("and" is implied) or separated with "or"
- Evaluation is left to right

### Configuration

#### GET /api/config

Returns the complete device configuration.

#### POST /api/config

Updates device configuration (supports partial updates).

```python
config = requests.get("http://SENSOR_IP/api/config", auth=auth).json()
config['devicename'] = 'New_Name'
requests.post("http://SENSOR_IP/api/config", auth=auth, json=config)
```

### Control

#### LED Control

```python
# Set LED color (RGB as integer)
requests.post(
    "http://SENSOR_IP/api/config/gstate/LED/color",
    auth=auth,
    json=16711680  # 0xFF0000 = Red
)
```

#### Force Sound

```python
# Play a sound file
requests.post(
    "http://SENSOR_IP/api/config/gstate/force/sound",
    auth=auth,
    json="Emergency2C2N.wav"
)
```

#### Relay Control

```python
# Get relay status
status = requests.get(
    "http://SENSOR_IP/api/config/gstate/relay",
    auth=auth
).json()
# Returns: {"k1": 0, "k2": 0, "wd": 1, "but": 1, ...}
```

### Device Information

#### Network & System Info

| Endpoint                                     | Description                                     | Response Type                                       |
| -------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| `GET /api/device/netinfo`                    | Network configuration and status                | JSON with IP, MAC, gateway, DNS, WiFi info          |
| `GET /api/device/gettimeinfo`                | Time settings and timezone                      | JSON with timezone, NTP settings                    |
| `GET /api/device/users`                      | List of configured users                        | JSON array of user objects                          |
| `GET /api/config/gstate/workers`             | System worker processes information             | JSON with `lifetimehrs`, `starttime`, `go`, etc.    |
| `GET /api/config/gstate/workers/lifetimehrs` | Device uptime in hours                          | Integer                                             |
| `GET /api/config/gstate/cloud`               | Cloud connectivity status                       | JSON with `connected`, `server`, `domain`, `state`  |
| `GET /api/config/gstate/hidden/about`        | Device identification (serial, model, firmware) | JSON with `serial`, `model`, `firmware`, `hardware` |

**Example - Network Info:**

```json
{
  "ip": "192.168.0.73",
  "mac": "00:11:22:33:44:55",
  "gateway": "192.168.0.1",
  "netmask": "255.255.255.0",
  "dns1": "8.8.8.8",
  "dhcp": true,
  "eth0": {
    "ip": "192.168.0.73",
    "router": "192.168.0.1"
  },
  "wlan0": {
    "wifion": false,
    "ssid": ""
  }
}
```

**Example - Cloud Status:**

```json
{
  "connected": true,
  "server": "wss://register.iotmanager.com",
  "domain": "example.com",
  "state": "connected",
  "alertsOn": true
}
```

### Logging

#### Log File Management

| Endpoint                   | Description                  | Response Type                       |
| -------------------------- | ---------------------------- | ----------------------------------- |
| `GET /api/logs`            | List all available log files | JSON array of log filenames         |
| `GET /api/logs/{filename}` | Download a specific log file | Text content (e.g., `20251130.log`) |

**Example:**

```bash
# List log files
curl -u user:pass http://SENSOR_IP/api/logs
# Returns: ["20251130.log", "drv20251130.log", ...]

# Get log file content
curl -u user:pass http://SENSOR_IP/api/logs/20251130.log
# Returns: Log file text content
```

**Note:** Log files contain system logs, not structured sensor data. They may include information about sensor readings, errors, and system events, but are not suitable for programmatic data extraction.

### Data Logging Configuration

The HALO 3C sensor stores sensor data internally for 7 days (configurable via `datalog.keep_days`). However, **no API endpoint was found** to retrieve this historical data via REST API.

| Endpoint                        | Description                  | Response         | Notes                                                         |
| ------------------------------- | ---------------------------- | ---------------- | ------------------------------------------------------------- |
| `GET /api/config/datalog`       | Data logging configuration   | Full config JSON | Includes `datalog.rate_secs` (15) and `datalog.keep_days` (7) |
| `GET /api/config/datalog/data`  | Attempt to get logged data   | Full config JSON | **Note:** Returns config, not data                            |
| `GET /api/config/datalog/query` | Attempt to query logged data | Full config JSON | **Note:** Returns config, not data. Accepts POST requests.    |
| `GET /api/config/datalog/fetch` | Attempt to fetch logged data | Full config JSON | **Note:** Returns config, not data. Accepts POST requests.    |
| `GET /api/config/datalog/list`  | List data log entries        | Full config JSON | **Note:** Returns config, not data                            |
| `GET /api/config/datalog/files` | List data log files          | Full config JSON | **Note:** Returns config, not data                            |

**Data Logging Configuration:**

```json
{
  "datalog": {
    "rate_secs": 15, // Data collection interval (seconds)
    "keep_days": 7 // Data retention period (days)
  }
}
```

**Important:** While the sensor stores data internally for 7 days, accessing this historical data via REST API is **not currently available**. The datalog endpoints return only configuration, not the actual stored data. Consider:

- Using SNMP/BACnet protocols (if they expose historical data)
- Contacting Halo support for historical data API
- Maintaining external data storage (InfluxDB) for historical records

### Graphics & Visualization

| Endpoint                      | Description           |
| ----------------------------- | --------------------- |
| `/api/gfx/dashboardframe.jpg` | Dashboard image (JPG) |
| `/api/gfx/dashboard.svg`      | Dashboard (SVG)       |
| `/api/gfx/stream.jpg`         | MJPEG video stream    |

### RTSP Video Streaming

HALO 3C supports RTSP (Real-Time Streaming Protocol) for video streaming.

#### RTSP Configuration

**RTSP Stream URL:** `rtsp://{HALO_IP}:8554/stream`

**Configuration Options:**

- **RTSP Stream Enabled:** Enable/disable RTSP streaming
- **Port:** Default 8554 (configurable)
- **Authentication:** Supports "basic", "digest", or "both"
- **Username/Password:** Optional authentication credentials

**Example RTSP Stream:**

```
rtsp://192.168.0.73:8554/stream
```

**Note:** RTSP configuration is part of the device configuration and can be accessed/modified via `/api/config` under the `rtsp` section.

## Integration Protocols

HALO 3C supports multiple integration methods:

- **REST API** - HTTP/HTTPS (documented here)
- **SNMP** - Network management
- **BACnet** - Building automation (see [BACnet Exploration](./bacnet-exploration.md) for details)
- **RTSP** - Video streaming (port 8554)
- **WebSocket** - Real-time cloud connectivity
- **Email** - SMTP-based alerts

### BACnet Integration

HALO 3C exposes all sensors and events via BACnet with predefined instance numbers. See [BACnet Exploration](./bacnet-exploration.md) for complete instance number mapping and integration guide.

**Key Information:**

- **Device Name:** Configurable (e.g., "Halo_Device")
- **Device Instance:** Configurable (typically 0 for device itself)
- **Port:** 47808/UDP (standard BACnet port)
- **COV Increment:** 5 (Change of Value threshold)

**Sensor/Event Instance Numbers:** Each sensor and event has a unique BACnet instance number. See the [BACnet Exploration document](./bacnet-exploration.md) for the complete mapping (Instance 1-33 covering all sensors and events).

## Event Variables

When configuring integrations, these variables are available:

| Variable      | Description           |
| ------------- | --------------------- |
| `%NAME%`      | Device name           |
| `%IP%`        | IP address            |
| `%MAC%`       | MAC address           |
| `%EID%`       | Event ID              |
| `%VAL%`       | Sensor value          |
| `%THR%`       | Threshold value       |
| `%DATE%`      | Event date            |
| `%TIME%`      | Event time            |
| `%SENSOR:id%` | Specific sensor value |
| `%ACTIVE%`    | List of active events |

## Python Client Example

```python
import requests
from requests.auth import HTTPBasicAuth

class HaloClient:
    def __init__(self, ip, username, password):
        self.base_url = f"http://{ip}"
        self.auth = HTTPBasicAuth(username, password)

    def get_sensor_data(self):
        """Get all current sensor values."""
        r = requests.get(
            f"{self.base_url}/api/config/gstate/latest",
            auth=self.auth
        )
        return r.json()

    def get_temperature(self):
        """Get current temperature in Celsius."""
        data = self.get_sensor_data()
        return data.get("htsensor/ctemp")

    def get_co2(self):
        """Get current CO2 level in ppm."""
        data = self.get_sensor_data()
        return data.get("co2sensor/co2")

    def get_aqi(self):
        """Get current Air Quality Index."""
        data = self.get_sensor_data()
        return data.get("AQI/value")

    def get_active_events(self):
        """Get list of currently active events."""
        r = requests.get(
            f"{self.base_url}/api/config/gstate/event_state",
            auth=self.auth
        )
        events = r.json()
        active = []
        for event_id, data in events.items():
            if isinstance(data, dict) and data.get('state') == 1:
                active.append(event_id)
        return active

# Usage
client = HaloClient("SENSOR_IP", "username", "password")
print(f"Temperature: {client.get_temperature()}°C")
print(f"CO2: {client.get_co2()} ppm")
print(f"AQI: {client.get_aqi()}")
print(f"Active events: {client.get_active_events()}")
```

## Best Practices

1. **Polling Interval**: Use 5-10 second intervals to avoid overloading the sensor
2. **Caching**: Cache `/api/config` responses as configuration rarely changes
3. **Error Handling**: Implement retry logic for network failures
4. **HTTPS**: Use HTTPS in production (self-signed certificate)
5. **Event System**: Use the built-in event system for automation rather than polling

## Endpoint Summary

### Confirmed Working Endpoints

**Sensor Data (8 endpoints):**

- `/api/config/gstate/latest` - All sensor values (primary)
- `/api/config/gstate/latest/{sensor}/data` - Individual sensor detailed data (8 sensors)

**Events (4+ endpoints):**

- `/api/config/gstate/event_state` - All event states
- `/api/config/gstate/event_state/{event}/missing_data` - Event metadata
- `/api/config/gstate/event_state/{event}/log_set` - Event metadata
- `/api/config/gstate/event_state/{event}/reportTime` - Event metadata
- `/api/config/gstate/config/eventgen/events` - Event configuration

**Device Info (7 endpoints):**

- `/api/device/netinfo` - Network information
- `/api/device/gettimeinfo` - Time settings
- `/api/device/users` - User list
- `/api/config/gstate/workers` - System info
- `/api/config/gstate/workers/lifetimehrs` - Uptime
- `/api/config/gstate/cloud` - Cloud status
- `/api/config/gstate/hidden/about` - Device identification

**Logging (2 endpoints):**

- `/api/logs` - List log files
- `/api/logs/{filename}` - Get log file

**Configuration (2 endpoints):**

- `/api/config` - Full configuration (GET/POST)
- `/api/config/datalog` - Data logging config

**Control (3 endpoints):**

- `/api/config/gstate/LED/color` - LED control
- `/api/config/gstate/force/sound` - Sound playback
- `/api/config/gstate/relay` - Relay status

**Graphics (3 endpoints):**

- `/api/gfx/dashboardframe.jpg` - Dashboard image
- `/api/gfx/dashboard.svg` - Dashboard SVG
- `/api/gfx/stream.jpg` - Video stream

**Total documented:** ~30+ endpoints

### Endpoints NOT Found

The following endpoints were tested but **not found** or **do not provide historical data**:

- Historical data endpoints (all returned 404)
- Data log retrieval endpoints (return config only, not data)
- Time-range query endpoints

See [Historical Data Report](./halo-historical-data-final-report.md) for details.

## Dashboard Integration

RTSP och BACnet kan konfigureras direkt från dashboard-applikationen via integrations-sidan (`/integrations`). Se [RTSP Configuration](./rtsp-configuration.md) och [BACnet Exploration](./bacnet-exploration.md) för mer detaljer.

### API Endpoints för Integrationer

Dashboard-applikationen exponerar följande endpoints för RTSP och BACnet-konfiguration:

**RTSP:**

- `GET /api/integrations/rtsp/config` - Hämta RTSP-konfiguration
- `PUT /api/integrations/rtsp/config` - Uppdatera RTSP-konfiguration
- `GET /api/integrations/rtsp/status` - Hämta RTSP-status och port-information

**BACnet:**

- `GET /api/integrations/bacnet/config` - Hämta BACnet-konfiguration
- `PUT /api/integrations/bacnet/config` - Uppdatera BACnet-konfiguration
- `GET /api/integrations/bacnet/status` - Hämta BACnet-status och port-information

Se [API Documentation](./api-documentation.md) för detaljerad API-referens.

## Related Documentation

- [Architecture Overview](./architecture.md)
- [API Documentation](./api-documentation.md)
- [Historical Data Exploration](./halo-historical-data-final-report.md)
- [RTSP Configuration](./rtsp-configuration.md)
- [BACnet Exploration](./bacnet-exploration.md)

---

_This documentation covers HALO 3C Smart Sensor API v2.8+_
_Last updated: 2025-11-30_
