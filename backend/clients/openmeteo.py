"""
Resilient Open-Meteo Client for Real-time Weather & Precipitation.
No API key required.
"""

import logging
from typing import Dict, Any, Tuple
from .base import resilient_fetch, resilient_fetch_sync
from ..models.schemas import APIHealthItem

logger = logging.getLogger("villageshield.clients.openmeteo")

OPENMETEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"


def mock_weather_generator(lat: float = 30.4934, lon: float = 79.0547) -> Dict[str, Any]:
    return {
        "hourly": {
            "precipitation": [0.0] * 72,
            "windspeed_10m": [0.0] * 72
        }
    }


async def get_weather_async(lat: float, lon: float) -> Tuple[Dict[str, Any], str]:
    url = f"{OPENMETEO_BASE_URL}?latitude={lat}&longitude={lon}&hourly=precipitation,windspeed_10m&timezone=auto&forecast_days=3"
    try:
        data, source, _ = await resilient_fetch(
            url=url,
            fallback_generator=lambda: mock_weather_generator(lat, lon),
            timeout=8.0,
            retries=1
        )
        return data, source
    except Exception as exc:
        logger.error(f"Open-Meteo async request failed: {exc}")
        fallback = mock_weather_generator(lat, lon)
        fallback["_source"] = "fallback"
        return fallback, "fallback"


def get_weather_sync(lat: float, lon: float) -> Tuple[Dict[str, Any], str]:
    url = f"{OPENMETEO_BASE_URL}?latitude={lat}&longitude={lon}&hourly=precipitation,windspeed_10m&timezone=auto&forecast_days=3"
    try:
        data, source, _ = resilient_fetch_sync(
            url=url,
            fallback_generator=lambda: mock_weather_generator(lat, lon),
            timeout=8.0,
            retries=1
        )
        return data, source
    except Exception as exc:
        logger.error(f"Open-Meteo sync request failed: {exc}")
        fallback = mock_weather_generator(lat, lon)
        fallback["_source"] = "fallback"
        return fallback, "fallback"


def probe_openmeteo(lat: float = 30.4934, lon: float = 79.0547) -> APIHealthItem:
    url = f"{OPENMETEO_BASE_URL}?latitude={lat}&longitude={lon}&hourly=precipitation,windspeed_10m&timezone=auto&forecast_days=1"
    try:
        data, source, latency = resilient_fetch_sync(
            url=url,
            fallback_generator=lambda: mock_weather_generator(lat, lon),
            timeout=8.0,
            retries=1
        )
        if source == "live":
            return APIHealthItem(
                service="Open-Meteo (Rainfall & Storm Forecast)",
                status="healthy",
                mode="live",
                latency_ms=latency,
                message="Live Weather API connected (200 OK)"
            )
        else:
            return APIHealthItem(
                service="Open-Meteo (Rainfall & Storm Forecast)",
                status="degraded",
                mode="fallback",
                latency_ms=latency,
                message="Live Weather API unavailable - Resilient weather fallback active"
            )
    except Exception as exc:
        logger.error(f"Open-Meteo probe failed: {exc}")
        return APIHealthItem(
            service="Open-Meteo (Rainfall & Storm Forecast)",
            status="degraded",
            mode="fallback",
            latency_ms=0.5,
            message=f"Probe error: {exc}"
        )
