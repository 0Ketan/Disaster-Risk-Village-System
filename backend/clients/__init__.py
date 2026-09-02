"""
Resilient External API Clients for OpenTopoData, openmeteo, and Meteostat.
"""

from .base import resilient_fetch, resilient_fetch_sync
from .opentopodata import get_elevation_async, get_elevation_sync, probe_opentopodata
from .openmeteo import get_weather_async, get_weather_sync, probe_openmeteo
from .meteostat_client import get_climate_normals, probe_meteostat
from .oceansat import probe_oceansat, get_oceansat_telemetry

__all__ = [
    "resilient_fetch",
    "resilient_fetch_sync",
    "get_elevation_async",
    "get_elevation_sync",
    "probe_opentopodata",
    "get_weather_async",
    "get_weather_sync",
    "probe_openmeteo",
    "get_climate_normals",
    "probe_meteostat",
    "probe_oceansat",
    "get_oceansat_telemetry",
]
