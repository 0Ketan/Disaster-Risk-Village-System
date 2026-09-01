import logging
from typing import Dict, Any, Tuple
from .base import resilient_fetch_sync
from ..models.schemas import APIHealthItem
import sys
import os

# Add root directory to path to import dataset.py
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
try:
    from dataset import fetch_oceansat2_via_api
except ImportError:
    fetch_oceansat2_via_api = None

logger = logging.getLogger("villageshield.clients.oceansat")

def mock_oceansat_generator() -> Dict[str, Any]:
    return {"status": "mocked", "message": "Synthetic ocean data"}

def probe_oceansat() -> APIHealthItem:
    url = "https://coastwatch.pfeg.noaa.gov/erddap/info/jplMURSST41/index.json"
    data, source, latency = resilient_fetch_sync(
        url=url,
        fallback_generator=mock_oceansat_generator,
        timeout=8.0,
        retries=1
    )
    if source == "live":
        return APIHealthItem(
            service="OceanSat",
            status="healthy",
            mode="live",
            latency_ms=latency,
            message="Oceanographic API reachable"
        )
    else:
        return APIHealthItem(
            service="OceanSat",
            status="degraded",
            mode="fallback",
            latency_ms=latency,
            message="Live API unavailable - using synthetic baseline"
        )
