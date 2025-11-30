"""
Predictive Maintenance Service - Regelmotor för prediktiv drift

Analyserar sensordata och trender för att förutsäga underhållsbehov.
"""
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import logging
import statistics

logger = logging.getLogger(__name__)


class RuleType(Enum):
    """Typer av regler"""
    THRESHOLD = "threshold"          # Enkelt tröskelvärde
    TREND = "trend"                  # Trendanalys
    RATE_OF_CHANGE = "rate_of_change"  # Ändringstakt
    PATTERN = "pattern"              # Mönsterigenkänning
    COMBINED = "combined"            # Kombinerad regel


class AlertPriority(Enum):
    """Prioritet för alerts"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Rule:
    """Definition av en prediktiv regel"""
    id: str
    name: str
    description: str
    rule_type: RuleType
    sensor_id: str
    enabled: bool = True
    config: Dict[str, Any] = None

    def __post_init__(self):
        if self.config is None:
            self.config = {}


@dataclass
class PredictiveAlert:
    """Alert genererad av regelmotorn"""
    id: str
    rule_id: str
    rule_name: str
    priority: AlertPriority
    title: str
    description: str
    sensor_id: str
    current_value: Optional[float]
    predicted_issue: str
    recommended_action: str
    confidence: float  # 0-1
    timestamp: datetime
    expires: Optional[datetime] = None


class PredictiveEngine:
    """
    Regelmotor för prediktiv underhållsanalys.

    Funktioner:
    1. Definiera regler för olika sensorer
    2. Analysera trender och mönster
    3. Generera prediktiva alerts
    4. Beräkna konfidensnivåer
    """

    # Fördefinierade regler
    DEFAULT_RULES = [
        Rule(
            id="co2-rising-trend",
            name="CO2 stigande trend",
            description="Detekterar om CO2 stiger över tid",
            rule_type=RuleType.TREND,
            sensor_id="co2sensor/co2",
            config={
                "window_hours": 4,
                "min_samples": 20,
                "trend_threshold": 50,  # ppm ökning
                "warning_level": 800,
            }
        ),
        Rule(
            id="humidity-degradation",
            name="Luftfuktighet avvikelse",
            description="Varnar om luftfuktigheten är för låg/hög under längre tid",
            rule_type=RuleType.THRESHOLD,
            sensor_id="htsensor/humidity",
            config={
                "low_threshold": 25,
                "high_threshold": 70,
                "duration_minutes": 30,
            }
        ),
        Rule(
            id="temperature-instability",
            name="Temperaturinstabilitet",
            description="Detekterar oregelbunden temperatur",
            rule_type=RuleType.RATE_OF_CHANGE,
            sensor_id="htsensor/ctemp",
            config={
                "max_change_per_hour": 3,  # grader
                "window_hours": 2,
            }
        ),
        Rule(
            id="pm25-accumulation",
            name="PM2.5 ackumulering",
            description="Varnar om partikelnivåer ökar över tid",
            rule_type=RuleType.TREND,
            sensor_id="pmsensor/pm2p5conc",
            config={
                "window_hours": 6,
                "min_samples": 30,
                "trend_threshold": 10,  # µg/m³
                "warning_level": 15,
            }
        ),
        Rule(
            id="tvoc-spike-pattern",
            name="TVOC-spikmönster",
            description="Identifierar återkommande TVOC-spikar",
            rule_type=RuleType.PATTERN,
            sensor_id="co2sensor/tvoc",
            config={
                "spike_threshold": 500,
                "min_spikes": 3,
                "window_hours": 24,
            }
        ),
    ]

    def __init__(self):
        self.rules = {rule.id: rule for rule in self.DEFAULT_RULES}
        self.sensor_history: Dict[str, List[Dict]] = {}
        self.active_alerts: Dict[str, PredictiveAlert] = {}
        self._alert_counter = 0

    def add_sensor_reading(self, sensor_id: str, value: float, timestamp: Optional[datetime] = None):
        """Lägg till en sensoravläsning i historiken"""
        if sensor_id not in self.sensor_history:
            self.sensor_history[sensor_id] = []

        if timestamp is None:
            timestamp = datetime.now()

        self.sensor_history[sensor_id].append({
            'value': value,
            'timestamp': timestamp
        })

        # Begränsa historikstorlek (max 24h)
        cutoff = datetime.now() - timedelta(hours=24)
        self.sensor_history[sensor_id] = [
            r for r in self.sensor_history[sensor_id]
            if r['timestamp'] > cutoff
        ]

    def analyze(self, sensor_data: Dict[str, float]) -> List[PredictiveAlert]:
        """
        Analysera sensordata och generera prediktiva alerts.

        Args:
            sensor_data: Dict med sensor_id -> värde

        Returns:
            Lista med genererade alerts
        """
        alerts = []
        now = datetime.now()

        # Lägg till alla avläsningar i historik
        for sensor_id, value in sensor_data.items():
            self.add_sensor_reading(sensor_id, value, now)

        # Kör alla aktiva regler
        for rule in self.rules.values():
            if not rule.enabled:
                continue

            if rule.sensor_id not in sensor_data:
                continue

            try:
                alert = self._evaluate_rule(rule, sensor_data[rule.sensor_id], now)
                if alert:
                    alerts.append(alert)
            except Exception as e:
                logger.error(f"Error evaluating rule {rule.id}: {e}")

        return alerts

    def _evaluate_rule(
        self,
        rule: Rule,
        current_value: float,
        now: datetime
    ) -> Optional[PredictiveAlert]:
        """Utvärdera en specifik regel"""

        if rule.rule_type == RuleType.THRESHOLD:
            return self._evaluate_threshold_rule(rule, current_value, now)
        elif rule.rule_type == RuleType.TREND:
            return self._evaluate_trend_rule(rule, current_value, now)
        elif rule.rule_type == RuleType.RATE_OF_CHANGE:
            return self._evaluate_rate_of_change_rule(rule, current_value, now)
        elif rule.rule_type == RuleType.PATTERN:
            return self._evaluate_pattern_rule(rule, current_value, now)

        return None

    def _evaluate_threshold_rule(
        self,
        rule: Rule,
        current_value: float,
        now: datetime
    ) -> Optional[PredictiveAlert]:
        """Utvärdera tröskelregel"""
        config = rule.config
        low = config.get('low_threshold')
        high = config.get('high_threshold')

        issue = None
        action = None

        if low and current_value < low:
            issue = f"Värde under minimum ({current_value:.1f} < {low})"
            action = "Kontrollera ventilation och eventuella läckor"
        elif high and current_value > high:
            issue = f"Värde över maximum ({current_value:.1f} > {high})"
            action = "Kontrollera klimatanläggning och ventilation"

        if issue:
            return self._create_alert(
                rule=rule,
                priority=AlertPriority.MEDIUM,
                title=f"{rule.name} - Avvikelse",
                description=issue,
                current_value=current_value,
                predicted_issue=issue,
                recommended_action=action,
                confidence=0.8,
                now=now
            )

        return None

    def _evaluate_trend_rule(
        self,
        rule: Rule,
        current_value: float,
        now: datetime
    ) -> Optional[PredictiveAlert]:
        """Utvärdera trendregel"""
        config = rule.config
        window_hours = config.get('window_hours', 4)
        min_samples = config.get('min_samples', 10)
        trend_threshold = config.get('trend_threshold', 0)
        warning_level = config.get('warning_level')

        history = self._get_history_window(rule.sensor_id, window_hours)

        if len(history) < min_samples:
            return None

        # Beräkna trend (linjär regression - förenklad)
        values = [h['value'] for h in history]
        first_half = statistics.mean(values[:len(values)//2])
        second_half = statistics.mean(values[len(values)//2:])
        trend = second_half - first_half

        if trend > trend_threshold:
            # Beräkna predikterat värde om 2 timmar
            predicted = current_value + (trend * 0.5)  # Förenklad prediktion

            issue = f"Stigande trend detekterad (+{trend:.1f} under {window_hours}h)"

            if warning_level and predicted > warning_level:
                action = f"Förväntas nå varningsnivå ({warning_level}) inom 2 timmar"
                priority = AlertPriority.HIGH
            else:
                action = "Övervaka utvecklingen"
                priority = AlertPriority.LOW

            confidence = min(0.9, 0.5 + (trend / trend_threshold) * 0.2)

            return self._create_alert(
                rule=rule,
                priority=priority,
                title=f"{rule.name} - Stigande trend",
                description=issue,
                current_value=current_value,
                predicted_issue=f"Predikterat värde om 2h: {predicted:.1f}",
                recommended_action=action,
                confidence=confidence,
                now=now
            )

        return None

    def _evaluate_rate_of_change_rule(
        self,
        rule: Rule,
        current_value: float,
        now: datetime
    ) -> Optional[PredictiveAlert]:
        """Utvärdera ändringstaktsregel"""
        config = rule.config
        max_change = config.get('max_change_per_hour', 5)
        window_hours = config.get('window_hours', 2)

        history = self._get_history_window(rule.sensor_id, window_hours)

        if len(history) < 5:
            return None

        # Beräkna standardavvikelse
        values = [h['value'] for h in history]
        try:
            stdev = statistics.stdev(values)
        except statistics.StatisticsError:
            return None

        # Beräkna max förändring
        max_diff = max(values) - min(values)

        if max_diff > max_change:
            return self._create_alert(
                rule=rule,
                priority=AlertPriority.MEDIUM,
                title=f"{rule.name} - Instabilitet",
                description=f"Stor variation detekterad: {max_diff:.1f} under {window_hours}h",
                current_value=current_value,
                predicted_issue="Möjligt problem med reglering eller sensor",
                recommended_action="Kontrollera klimatanläggning och sensorernas funktion",
                confidence=0.7,
                now=now
            )

        return None

    def _evaluate_pattern_rule(
        self,
        rule: Rule,
        current_value: float,
        now: datetime
    ) -> Optional[PredictiveAlert]:
        """Utvärdera mönsterregel"""
        config = rule.config
        spike_threshold = config.get('spike_threshold', 100)
        min_spikes = config.get('min_spikes', 3)
        window_hours = config.get('window_hours', 24)

        history = self._get_history_window(rule.sensor_id, window_hours)

        if len(history) < 10:
            return None

        # Räkna spikar
        values = [h['value'] for h in history]
        median = statistics.median(values)
        spikes = sum(1 for v in values if v > spike_threshold)

        if spikes >= min_spikes:
            return self._create_alert(
                rule=rule,
                priority=AlertPriority.MEDIUM,
                title=f"{rule.name} - Återkommande spikar",
                description=f"{spikes} spikar detekterade över {window_hours}h",
                current_value=current_value,
                predicted_issue="Möjlig källa till periodiska utsläpp",
                recommended_action="Undersök ventilationsschema och potentiella föroreningskällor",
                confidence=0.6 + (spikes / (min_spikes * 2)) * 0.2,
                now=now
            )

        return None

    def _get_history_window(self, sensor_id: str, hours: float) -> List[Dict]:
        """Hämta historikfönster för sensor"""
        if sensor_id not in self.sensor_history:
            return []

        cutoff = datetime.now() - timedelta(hours=hours)
        return [
            r for r in self.sensor_history[sensor_id]
            if r['timestamp'] > cutoff
        ]

    def _create_alert(
        self,
        rule: Rule,
        priority: AlertPriority,
        title: str,
        description: str,
        current_value: float,
        predicted_issue: str,
        recommended_action: str,
        confidence: float,
        now: datetime
    ) -> PredictiveAlert:
        """Skapa en alert"""
        self._alert_counter += 1

        return PredictiveAlert(
            id=f"pred-{self._alert_counter}",
            rule_id=rule.id,
            rule_name=rule.name,
            priority=priority,
            title=title,
            description=description,
            sensor_id=rule.sensor_id,
            current_value=current_value,
            predicted_issue=predicted_issue,
            recommended_action=recommended_action,
            confidence=min(1.0, max(0.0, confidence)),
            timestamp=now,
            expires=now + timedelta(hours=1)
        )

    def get_rules(self) -> List[Dict]:
        """Hämta alla regler som dict"""
        return [
            {
                'id': rule.id,
                'name': rule.name,
                'description': rule.description,
                'type': rule.rule_type.value,
                'sensor_id': rule.sensor_id,
                'enabled': rule.enabled,
                'config': rule.config
            }
            for rule in self.rules.values()
        ]

    def get_status(self) -> Dict:
        """Hämta status för regelmotorn"""
        return {
            'active': True,
            'rules_count': len(self.rules),
            'enabled_rules': sum(1 for r in self.rules.values() if r.enabled),
            'sensors_tracked': len(self.sensor_history),
            'alerts_generated': self._alert_counter,
        }


# Global instance
_engine: Optional[PredictiveEngine] = None


def get_predictive_engine() -> PredictiveEngine:
    """Hämta eller skapa global predictive engine"""
    global _engine
    if _engine is None:
        _engine = PredictiveEngine()
    return _engine
