import logging
from typing import Dict, Any, Tuple, Optional
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

def get_oceansat_telemetry(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetches real-time OceanSat-2 wind vector stress and storm intensity parameters.
    Uses NOAA CoastWatch ERDDAP dataset `erdQCwindproducts1day`.
    Returns fallback synthetic data if live fetch fails.
    """
    fallback_telemetry = {
        "wind_speed_ms": round(12.5 + (lat % 5), 2),
        "wind_stress_u": 0.05,
        "wind_stress_v": 0.08,
        "storm_intensity_index": round(14.2 + (lon % 3), 2),
        "status": "Fallback"
    }

    if not fetch_oceansat2_via_api:
        logger.error("fetch_oceansat2_via_api not available. Returning fallback.")
        return fallback_telemetry

    try:
        from datetime import datetime, timezone
        target_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00Z")
        # Use erdQCwindproducts1day for wind speed and vectors
        ds = fetch_oceansat2_via_api("erdQCwindproducts1day", lat, lon, target_date)
        
        if ds is None:
            # Fallback to older data if current day is not yet available
            from datetime import timedelta
            target_date = (datetime.now(timezone.utc) - timedelta(days=2)).strftime("%Y-%m-%dT00:00:00Z")
            ds = fetch_oceansat2_via_api("erdQCwindproducts1day", lat, lon, target_date)
            
        if ds is None:
            logger.warning(f"Could not fetch OceanSat telemetry for ({lat}, {lon}). Using fallback.")
            return fallback_telemetry
            
        # Extract variables. ds variable values might be arrays.
        def _get_val(var_name):
            if var_name in ds:
                val = ds[var_name].values
                try:
                    import numpy as np
                    if np.size(val) > 0:
                        v = float(np.nanmean(val))
                        return v if not np.isnan(v) else 0.0
                except:
                    pass
            return 0.0

        wind_speed = _get_val('wind_speed')
        stress_u = _get_val('stress_u')
        stress_v = _get_val('stress_v')
        
        # Calculate derived magnitude of wind stress vector
        import math
        stress_magnitude = math.sqrt(stress_u**2 + stress_v**2)
        
        telemetry = {
            "wind_speed_ms": round(wind_speed, 2),
            "wind_stress_u": round(stress_u, 4),
            "wind_stress_v": round(stress_v, 4),
            "storm_intensity_index": round(stress_magnitude * 100.0, 2), # Scale up for readability
            "status": "Active"
        }
        return telemetry
    except Exception as e:
        logger.error(f"Error extracting oceansat telemetry: {e}. Using fallback.", exc_info=True)
        return fallback_telemetry

