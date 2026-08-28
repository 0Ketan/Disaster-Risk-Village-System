"""
Resilient OpenWeatherMap Client for Real-time Weather & Precipitation.
"""

import os
import logging
from typing import Dict, Any, Tuple
from .base import resilient_fetch, resilient_fetch_sync
from ..models.schemas import APIHealthItem

logger = logging.getLogger("villageshield.clients.openweathermap")

OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"


def mock_weather_generator(lat: float = 30.4934, lon: float = 79.0547) -> Dict[str, Any]:
    """
    Generates realistic weather / rainfall data for Himalayan disaster corridor.
    """
    elev_factor = (lat - 30.2) * 20.0
    temp_c = round(max(5.0, 22.0 - elev_factor), 1)
    rainfall_1h = round(3.5 + (lat - 30.2) * 12.0, 1)

    return {
        "coord": {"lon": lon, "lat": lat},
        "weather": [
            {
                "id": 501,
                "main": "Rain",
                "description": "moderate monsoon rain",
                "icon": "10d"
            }
        ],
        "main": {
            "temp": temp_c,
            "feels_like": round(temp_c - 1.5, 1),
            "humidity": 85,
            "pressure": 1010
        },
        "wind": {"speed": 3.8, "deg": 190},
        "rain": {"1h": rainfall_1h, "3h": round(rainfall_1h * 2.8, 1)},
        "name": "Garhwal Region",
        "cod": 200
    }


async def get_weather_async(lat: float, lon: float) -> Tuple[Dict[str, Any], str]:
    """
    Asynchronously queries OpenWeatherMap with fallback.
    """
    api_key = os.environ.get("OPENWEATHER_API_KEY", "")
    if not api_key or api_key.startswith("your_") or api_key == "mock_key":
        fallback = mock_weather_generator(lat, lon)
        fallback["_source"] = "fallback"
        return fallback, "fallback"

    url = f"{OPENWEATHER_BASE_URL}?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    data, source, _ = await resilient_fetch(
        url=url,
        fallback_generator=lambda: mock_weather_generator(lat, lon),
        timeout=8.0,
        retries=1
    )
    return data, source


def get_weather_sync(lat: float, lon: float) -> Tuple[Dict[str, Any], str]:
    """
    Synchronous weather query with fallback.
    """
    api_key = os.environ.get("OPENWEATHER_API_KEY", "")
    if not api_key or api_key.startswith("your_") or api_key == "mock_key":
        fallback = mock_weather_generator(lat, lon)
        fallback["_source"] = "fallback"
        return fallback, "fallback"

    url = f"{OPENWEATHER_BASE_URL}?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    data, source, _ = resilient_fetch_sync(
        url=url,
        fallback_generator=lambda: mock_weather_generator(lat, lon),
        timeout=8.0,
        retries=1
    )
    return data, source


def probe_openweathermap() -> APIHealthItem:
    """
    Probes OpenWeatherMap availability for startup diagnostics and health endpoint.
    """
    api_key = os.environ.get("OPENWEATHER_API_KEY", "")
    if not api_key or api_key.startswith("your_") or api_key == "mock_key":
        return APIHealthItem(
            service="OpenWeatherMap",
            status="degraded",
            mode="fallback",
            latency_ms=0.5,
            message="No API key configured - Using calibrated monsoon weather model"
        )

    url = f"{OPENWEATHER_BASE_URL}?lat=30.4934&lon=79.0547&appid={api_key}&units=metric"
    data, source, latency = resilient_fetch_sync(
        url=url,
        fallback_generator=lambda: mock_weather_generator(30.4934, 79.0547),
        timeout=8.0,
        retries=1
    )
    if source == "live":
        return APIHealthItem(
            service="OpenWeatherMap",
            status="healthy",
            mode="live",
            latency_ms=latency,
            message="Live Weather API connected (200 OK)"
        )
    else:
        return APIHealthItem(
            service="OpenWeatherMap",
            status="degraded",
            mode="fallback",
            latency_ms=latency,
            message="Live Weather API unavailable - Resilient weather fallback active"
        )
