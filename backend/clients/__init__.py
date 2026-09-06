"""
Resilient External API Clients for OpenTopoData and Meteostat.
"""

from .base import resilient_fetch, resilient_fetch_sync
from .opentopodata import get_elevation_async, get_elevation_sync, probe_opentopodata
from .meteostat_client import get_climate_normals, probe_meteostat

__all__ = [
    "resilient_fetch",
    "resilient_fetch_sync",
    "get_elevation_async",
    "get_elevation_sync",
    "probe_opentopodata",
    "get_climate_normals",
    "probe_meteostat",
]
