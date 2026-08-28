"""
Resilient OpenTopoData Client for Elevation and Topography.
"""

import logging
from typing import Dict, Any, Tuple
from .base import resilient_fetch, resilient_fetch_sync
from ..models.schemas import APIHealthItem

logger = logging.getLogger("villageshield.clients.opentopodata")

OPENTOPODATA_BASE_URL = "https://api.opentopodata.org/v1/srtm30m"


def mock_elevation_generator(lat: float = 30.4934, lon: float = 79.0547) -> Dict[str, Any]:
    """
    Generates deterministic, geographically realistic elevation for the Uttarakhand Himalayan region.
    """
    lat_diff = max(0.0, lat - 30.2)
    lon_diff = abs(lon - 79.0)
    calculated_elev = 890.0 + (lat_diff * 5100.0) + (lon_diff * 450.0)
    elevation_m = round(min(max(calculated_elev, 700.0), 3800.0), 1)

    return {
        "results": [
            {
                "dataset": "srtm30m",
                "elevation": elevation_m,
                "location": {"lat": lat, "lng": lon}
            }
        ],
        "status": "OK"
    }


async def get_elevation_async(lat: float, lon: float) -> Tuple[float, str]:
    """
    Asynchronously queries OpenTopoData for elevation with fallback.
    Returns (elevation_m, source).
    """
    url = f"{OPENTOPODATA_BASE_URL}?locations={lat},{lon}"
    data, source, _ = await resilient_fetch(
        url=url,
        fallback_generator=lambda: mock_elevation_generator(lat, lon),
        timeout=8.0,
        retries=1
    )
    try:
        elev = float(data["results"][0]["elevation"])
        return elev, source
    except Exception:
        fallback = mock_elevation_generator(lat, lon)
        return float(fallback["results"][0]["elevation"]), "fallback"


def get_elevation_sync(lat: float, lon: float) -> Tuple[float, str]:
    """
    Synchronous elevation query with fallback.
    """
    url = f"{OPENTOPODATA_BASE_URL}?locations={lat},{lon}"
    data, source, _ = resilient_fetch_sync(
        url=url,
        fallback_generator=lambda: mock_elevation_generator(lat, lon),
        timeout=8.0,
        retries=1
    )
    try:
        elev = float(data["results"][0]["elevation"])
        return elev, source
    except Exception:
        fallback = mock_elevation_generator(lat, lon)
        return float(fallback["results"][0]["elevation"]), "fallback"


def probe_opentopodata() -> APIHealthItem:
    """
    Probes OpenTopoData availability for startup diagnostics and health endpoint.
    """
    url = f"{OPENTOPODATA_BASE_URL}?locations=30.4934,79.0547"
    data, source, latency = resilient_fetch_sync(
        url=url,
        fallback_generator=lambda: mock_elevation_generator(30.4934, 79.0547),
        timeout=8.0,
        retries=1
    )
    if source == "live":
        return APIHealthItem(
            service="OpenTopoData",
            status="healthy",
            mode="live",
            latency_ms=latency,
            message="Elevation API reachable (200 OK)"
        )
    else:
        return APIHealthItem(
            service="OpenTopoData",
            status="degraded",
            mode="fallback",
            latency_ms=latency,
            message="Live API unavailable - Resilient synthetic elevation active"
        )
