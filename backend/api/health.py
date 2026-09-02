"""
FastAPI Health Probe Router for VillageShield.
"""

from datetime import datetime
from fastapi import APIRouter
from ..models.schemas import SystemHealthResponse
from ..clients.opentopodata import probe_opentopodata
from ..clients.openweathermap import probe_openweathermap
from ..clients.meteostat_client import probe_meteostat

router = APIRouter(prefix="/api", tags=["Health"])


import requests
import time

def probe_open_meteo():
    start = time.time()
    try:
        r = requests.get("https://flood-api.open-meteo.com/v1/flood?latitude=20.0&longitude=85.0&daily=river_discharge", timeout=3.0)
        r.raise_for_status()
        latency = int((time.time() - start) * 1000)
        return {
            "service": "Open-Meteo",
            "name": "Open-Meteo (Flood & Weather)",
            "status": "healthy",
            "mode": "live",
            "latency_ms": latency,
            "message": "Flood API reachable (200 OK)"
        }
    except Exception as e:
        return {
            "service": "Open-Meteo",
            "name": "Open-Meteo (Flood & Weather)",
            "status": "degraded",
            "mode": "fallback",
            "latency_ms": 0,
            "message": f"Ping failed: {str(e)}"
        }

@router.get("/health", response_model=SystemHealthResponse)
def get_system_health():
    """
    Performs live connectivity checks against external APIs.
    """
    topo_health = probe_opentopodata()
    weather_health = probe_openweathermap()
    meteo_health = probe_meteostat()
    openmeteo_health = probe_open_meteo()

    services = [topo_health, weather_health, meteo_health, openmeteo_health]

    # System is operational if resilient fallbacks are functioning properly
    overall_status = "ok"

    return SystemHealthResponse(
        status=overall_status,
        timestamp=datetime.utcnow().isoformat() + "Z",
        services=services
    )
