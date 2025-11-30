"""
Predictive Maintenance API Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime
import logging

from services.predictive import get_predictive_engine, PredictiveAlert
from api.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status")
async def get_predictive_status(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Hämta status för den prediktiva motorn.

    Requires authentication.

    Returns:
        Status för regelmotorn
    """
    try:
        engine = get_predictive_engine()
        return {
            **engine.get_status(),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get predictive status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rules")
async def get_predictive_rules(
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Hämta alla prediktiva regler.

    Requires authentication.

    Returns:
        Lista med regler
    """
    try:
        engine = get_predictive_engine()
        return engine.get_rules()
    except Exception as e:
        logger.error(f"Failed to get predictive rules: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts")
async def get_predictive_alerts(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Hämta aktiva prediktiva alerts.

    Requires authentication.

    Returns:
        Lista med aktiva alerts
    """
    try:
        engine = get_predictive_engine()

        # Filtrera bort utgångna alerts
        now = datetime.now()
        active_alerts = [
            {
                "id": alert.id,
                "rule_id": alert.rule_id,
                "rule_name": alert.rule_name,
                "priority": alert.priority.value,
                "title": alert.title,
                "description": alert.description,
                "sensor_id": alert.sensor_id,
                "current_value": alert.current_value,
                "predicted_issue": alert.predicted_issue,
                "recommended_action": alert.recommended_action,
                "confidence": alert.confidence,
                "timestamp": alert.timestamp.isoformat(),
                "expires": alert.expires.isoformat() if alert.expires else None
            }
            for alert in engine.active_alerts.values()
            if alert.expires is None or alert.expires > now
        ]

        return {
            "alerts": active_alerts,
            "count": len(active_alerts),
            "timestamp": now.isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get predictive alerts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_current_data(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Kör prediktiv analys på aktuell sensordata.

    Requires authentication.

    Returns:
        Analysresultat med nya alerts
    """
    try:
        from services.sensors import SensorService

        # Hämta aktuella sensorvärden
        sensor_service = SensorService()
        latest = sensor_service.get_latest_sensor_values()

        # Konvertera till format för predictive engine
        sensor_data = {}
        for sensor in latest.get('sensors', []):
            sensor_id = sensor.get('sensor_id')
            values = sensor.get('values', {})
            if sensor_id and values:
                # Ta första värdet
                value = list(values.values())[0]
                if isinstance(value, (int, float)):
                    sensor_data[sensor_id] = float(value)

        # Kör analys
        engine = get_predictive_engine()
        new_alerts = engine.analyze(sensor_data)

        # Lägg till i aktiva alerts
        for alert in new_alerts:
            engine.active_alerts[alert.id] = alert

        return {
            "analyzed_sensors": len(sensor_data),
            "new_alerts": len(new_alerts),
            "alerts": [
                {
                    "id": alert.id,
                    "title": alert.title,
                    "priority": alert.priority.value,
                    "confidence": alert.confidence
                }
                for alert in new_alerts
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to analyze data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
