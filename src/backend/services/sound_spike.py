"""
Sound Spike Detection Service - 24/7 ljudspiksövervakning

Detekterar plötsliga ljudspikar och ovanliga ljudnivåer dygnet runt.
Anpassar tröskelvärdena baserat på tid på dygnet.
"""
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from collections import deque
import logging
import statistics

logger = logging.getLogger(__name__)


class SoundSpikeDetector:
    """
    Detekterar ljudspikar och ovanliga ljudnivåer.

    Strategier:
    1. Absolut spik: Ljud > kritisk nivå
    2. Relativ spik: Ljud > baslinjen + X dB (plötslig ökning)
    3. Ihållande hög nivå: Ljud > varningsnivå i Y sekunder
    4. Nattlig detektion: Strängare gränser nattetid (23:00-06:00)
    """

    # Tidszoner för olika ljudnivågränser
    NIGHT_START = 23  # 23:00
    NIGHT_END = 6     # 06:00

    # Tröskelvärden (dB)
    THRESHOLDS = {
        'day': {
            'spike_absolute': 85,      # Kritisk nivå dagtid
            'spike_relative': 20,      # dB ökning över baslinje för spik
            'warning_sustained': 70,   # Varning vid ihållande nivå
            'normal_max': 65,          # Normal maxnivå
        },
        'night': {
            'spike_absolute': 70,      # Kritisk nivå nattetid
            'spike_relative': 15,      # dB ökning över baslinje för spik
            'warning_sustained': 55,   # Varning vid ihållande nivå
            'normal_max': 50,          # Normal maxnivå
        }
    }

    # Inställningar
    BASELINE_WINDOW_SIZE = 60  # Antal mätningar för baslinje (ca 10 min vid 10s intervall)
    SUSTAINED_DURATION = 30    # Sekunder med ihållande hög nivå innan varning
    SPIKE_COOLDOWN = 60        # Sekunder mellan spikvarningar (undvik spam)

    def __init__(self):
        self.sound_history: deque = deque(maxlen=self.BASELINE_WINDOW_SIZE)
        self.last_spike_time: Optional[datetime] = None
        self.sustained_high_start: Optional[datetime] = None
        self.last_sustained_alert: Optional[datetime] = None

    def is_night_time(self, dt: Optional[datetime] = None) -> bool:
        """Kontrollera om det är nattetid"""
        if dt is None:
            dt = datetime.now()
        hour = dt.hour
        return hour >= self.NIGHT_START or hour < self.NIGHT_END

    def get_thresholds(self, dt: Optional[datetime] = None) -> Dict[str, float]:
        """Hämta rätt tröskelvärden baserat på tid"""
        if self.is_night_time(dt):
            return self.THRESHOLDS['night']
        return self.THRESHOLDS['day']

    def get_baseline(self) -> Optional[float]:
        """Beräkna baslinjenivå från historik"""
        if len(self.sound_history) < 10:
            return None

        # Använd median för att vara robust mot outliers
        return statistics.median(self.sound_history)

    def analyze_sound_level(
        self,
        sound_level: float,
        timestamp: Optional[datetime] = None
    ) -> List[Dict]:
        """
        Analysera en ljudnivåmätning och generera events vid behov.

        Args:
            sound_level: Ljudnivå i dB
            timestamp: Tidpunkt för mätningen

        Returns:
            Lista med events (spik, ihållande, etc.)
        """
        events = []
        now = timestamp or datetime.now()
        thresholds = self.get_thresholds(now)
        baseline = self.get_baseline()

        # Lägg till i historik
        self.sound_history.append(sound_level)

        # 1. Kontrollera absolut spik
        if sound_level >= thresholds['spike_absolute']:
            if self._can_generate_spike_event(now):
                period = "natt" if self.is_night_time(now) else "dag"
                events.append({
                    'type': 'SOUND_SPIKE',
                    'severity': 'CRITICAL',
                    'source': 'sound-spike-detector',
                    'summary': f'Kritisk ljudnivå: {sound_level:.1f} dB ({period}tid)',
                    'details': {
                        'sound_level': sound_level,
                        'threshold': thresholds['spike_absolute'],
                        'baseline': baseline,
                        'time_period': period,
                        'detection_type': 'absolute_spike'
                    },
                    'current_value': sound_level,
                    'threshold_value': thresholds['spike_absolute']
                })
                self.last_spike_time = now
                logger.warning(f"Critical sound spike detected: {sound_level:.1f} dB")

        # 2. Kontrollera relativ spik (plötslig ökning)
        elif baseline and (sound_level - baseline) >= thresholds['spike_relative']:
            if self._can_generate_spike_event(now):
                increase = sound_level - baseline
                period = "natt" if self.is_night_time(now) else "dag"
                events.append({
                    'type': 'SOUND_SPIKE',
                    'severity': 'WARNING',
                    'source': 'sound-spike-detector',
                    'summary': f'Ljudspik: +{increase:.1f} dB över baslinje ({sound_level:.1f} dB)',
                    'details': {
                        'sound_level': sound_level,
                        'baseline': baseline,
                        'increase': increase,
                        'threshold_increase': thresholds['spike_relative'],
                        'time_period': period,
                        'detection_type': 'relative_spike'
                    },
                    'current_value': sound_level,
                    'threshold_value': baseline + thresholds['spike_relative']
                })
                self.last_spike_time = now
                logger.info(f"Sound spike detected: {sound_level:.1f} dB (+{increase:.1f} dB from baseline)")

        # 3. Kontrollera ihållande hög nivå
        if sound_level >= thresholds['warning_sustained']:
            if self.sustained_high_start is None:
                self.sustained_high_start = now
            elif (now - self.sustained_high_start).total_seconds() >= self.SUSTAINED_DURATION:
                if self._can_generate_sustained_event(now):
                    duration = int((now - self.sustained_high_start).total_seconds())
                    events.append({
                        'type': 'SOUND_SUSTAINED',
                        'severity': 'WARNING',
                        'source': 'sound-spike-detector',
                        'summary': f'Ihållande högt ljud: {sound_level:.1f} dB i {duration}s',
                        'details': {
                            'sound_level': sound_level,
                            'threshold': thresholds['warning_sustained'],
                            'duration_seconds': duration,
                            'detection_type': 'sustained_high'
                        },
                        'current_value': sound_level,
                        'threshold_value': thresholds['warning_sustained']
                    })
                    self.last_sustained_alert = now
                    logger.info(f"Sustained high sound detected: {sound_level:.1f} dB for {duration}s")
        else:
            # Reset sustained high tracking
            self.sustained_high_start = None

        return events

    def _can_generate_spike_event(self, now: datetime) -> bool:
        """Kontrollera cooldown för spikvarningar"""
        if self.last_spike_time is None:
            return True
        return (now - self.last_spike_time).total_seconds() >= self.SPIKE_COOLDOWN

    def _can_generate_sustained_event(self, now: datetime) -> bool:
        """Kontrollera cooldown för ihållande varningar"""
        if self.last_sustained_alert is None:
            return True
        # Längre cooldown för sustained alerts (5 min)
        return (now - self.last_sustained_alert).total_seconds() >= 300

    def get_status(self) -> Dict:
        """Hämta aktuell status för detektorn"""
        now = datetime.now()
        baseline = self.get_baseline()
        thresholds = self.get_thresholds(now)

        return {
            'active': True,
            'is_night_mode': self.is_night_time(now),
            'current_baseline': baseline,
            'thresholds': thresholds,
            'history_size': len(self.sound_history),
            'last_spike': self.last_spike_time.isoformat() if self.last_spike_time else None,
            'sustained_high_active': self.sustained_high_start is not None,
            'sustained_high_since': self.sustained_high_start.isoformat() if self.sustained_high_start else None
        }


# Global instance för användning i collector
_detector: Optional[SoundSpikeDetector] = None


def get_sound_spike_detector() -> SoundSpikeDetector:
    """Hämta eller skapa global sound spike detector"""
    global _detector
    if _detector is None:
        _detector = SoundSpikeDetector()
    return _detector


def analyze_sound_from_sensor_data(sensor_data: Dict) -> Tuple[Optional[float], List[Dict]]:
    """
    Analysera ljuddata från Halo-sensordata.

    Args:
        sensor_data: Rå sensordata från Halo

    Returns:
        Tuple med (ljudnivå, lista med events)
    """
    detector = get_sound_spike_detector()

    try:
        # Extrahera ljudnivå från sensor_data
        sound_level = None

        # Försök hitta audsensor/sum
        audsensor = sensor_data.get('audsensor', {})
        if isinstance(audsensor, dict):
            data = audsensor.get('data', {})
            if isinstance(data, dict):
                sound_level = data.get('sum')

        if sound_level is None:
            return None, []

        # Analysera och generera events
        events = detector.analyze_sound_level(float(sound_level))
        return sound_level, events

    except Exception as e:
        logger.error(f"Error analyzing sound data: {e}", exc_info=True)
        return None, []
