"""
Resilient Meteostat Client for Climate Normals & Precipitation History.
"""

import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional
from ..models.schemas import APIHealthItem

logger = logging.getLogger("villageshield.clients.meteostat")


def mock_climate_generator(lat: float = 30.4934, lon: float = 79.0547) -> Dict[str, Any]:
    """
    Generates historical climate normals and monthly precipitation for Himalayan region.
    """
    return {
        "station": "HIMALAYAN_SYNTHETIC_STN",
        "annual_rainfall_mm": 2450.0,
        "monsoon_peak_mm": 680.0,
        "avg_temp_c": 16.5,
        "monthly_rainfall_mm": [
            {"month": "Jan", "rainfall": 65.0},
            {"month": "Feb", "rainfall": 80.0},
            {"month": "Mar", "rainfall": 95.0},
            {"month": "Apr", "rainfall": 70.0},
            {"month": "May", "rainfall": 110.0},
            {"month": "Jun", "rainfall": 380.0},
            {"month": "Jul", "rainfall": 680.0},
            {"month": "Aug", "rainfall": 590.0},
            {"month": "Sep", "rainfall": 290.0},
            {"month": "Oct", "rainfall": 45.0},
            {"month": "Nov", "rainfall": 15.0},
            {"month": "Dec", "rainfall": 30.0}
        ],
        "_source": "fallback"
    }


def get_climate_normals(lat: float, lon: float) -> Tuple[Dict[str, Any], str]:
    """
    Queries Meteostat library for climate history with resilient fallback.
    """
    start_time = time.perf_counter()
    try:
        import meteostat
        end_dt = datetime.now()
        start_dt = end_dt - timedelta(days=30)
        loc = meteostat.Point(lat, lon)
        
        # In Meteostat 2.x, daily function or Daily class can be used
        if hasattr(meteostat, 'daily'):
            ts = meteostat.daily(loc, start_dt, end_dt)
            df = ts.fetch() if hasattr(ts, 'fetch') else None
        elif hasattr(meteostat, 'Daily'):
            ts = meteostat.Daily(loc, start_dt, end_dt)
            df = ts.fetch() if hasattr(ts, 'fetch') else None
        else:
            df = None

        if df is not None and not df.empty and 'prcp' in df.columns:
            total_30d_prcp = float(df['prcp'].sum())
            avg_temp = float(df['tavg'].mean()) if 'tavg' in df.columns and not df['tavg'].isna().all() else 17.0
            latency = round((time.perf_counter() - start_time) * 1000, 1)
            result = {
                "station": "Meteostat Regional Station",
                "30_day_precipitation_mm": round(total_30d_prcp, 1),
                "avg_temp_c": round(avg_temp, 1),
                "records_count": len(df),
                "_source": "live"
            }
            return result, "live"
    except Exception as exc:
        logger.warning(f"Meteostat query fallback invoked: {exc}")

    fallback = mock_climate_generator(lat, lon)
    fallback["_source"] = "fallback"
    return fallback, "fallback"


def probe_meteostat() -> APIHealthItem:
    """
    Probes Meteostat library availability for startup diagnostics.
    """
    start_time = time.perf_counter()
    try:
        import meteostat
        # Verify Point creation and library functionality
        p = meteostat.Point(30.4934, 79.0547)
        latency = round((time.perf_counter() - start_time) * 1000, 1)
        return APIHealthItem(
            service="Meteostat",
            status="healthy",
            mode="live",
            latency_ms=max(0.5, latency),
            message="Library active (Point spatial index OK)"
        )
    except Exception as exc:
        latency = round((time.perf_counter() - start_time) * 1000, 1)
        return APIHealthItem(
            service="Meteostat",
            status="degraded",
            mode="fallback",
            latency_ms=latency,
            message=f"Meteostat fallback active ({type(exc).__name__})"
        )
