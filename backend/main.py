"""
Disaster Risk Village System (VillageShield) -- Root Entry Point.
Executes startup health diagnostics across OpenTopoData, OpenWeatherMap, and Meteostat,
displays diagnostic summary, and boots the FastAPI server via uvicorn.
"""

import os
import sys
import uvicorn

# Ensure the parent directory (project root) is in sys.path so 'backend.*' imports work
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.clients.opentopodata import probe_opentopodata
from backend.clients.openweathermap import probe_openweathermap
from backend.clients.meteostat_client import probe_meteostat


def run_startup_diagnostics():
    """
    Performs startup health checks on all external APIs and prints a clean diagnostic banner.
    """
    print("======================================================================")
    print("           DISASTER RISK VILLAGE SYSTEM -- API HEALTH PROBE           ")
    print("======================================================================")

    topo_health = probe_opentopodata()
    mode_str = f"[{topo_health.mode.upper()}]"
    lat_str = f"{topo_health.latency_ms:.0f}ms" if topo_health.latency_ms is not None else "N/A"
    print(f" [1/4] OpenTopoData (Elevation):   {mode_str:<10} ({topo_health.message}, {lat_str})")

    weather_health = probe_openweathermap(30.4934, 79.0547)
    mode_str = f"[{weather_health.mode.upper()}]"
    lat_str = f"{weather_health.latency_ms:.0f}ms" if weather_health.latency_ms is not None else "N/A"
    print(f" [2/4] OpenWeatherMap (Weather):   {mode_str:<10} ({weather_health.message}, {lat_str})")

    meteo_health = probe_meteostat()
    mode_str = f"[{meteo_health.mode.upper()}]"
    lat_str = f"{meteo_health.latency_ms:.0f}ms" if meteo_health.latency_ms is not None else "N/A"
    print(f" [3/4] Meteostat (Climate Data):   {mode_str:<10} ({meteo_health.message}, {lat_str})")

    from backend.clients.open_meteo_marine import probe_open_meteo_marine
    marine_health = probe_open_meteo_marine()
    mode_str = f"[{marine_health.mode.upper()}]"
    lat_str = f"{marine_health.latency_ms:.0f}ms" if marine_health.latency_ms is not None else "N/A"
    print(f" [4/4] OpenMeteo (Wave & Swell):   {mode_str:<10} ({marine_health.message}, {lat_str})")

    print("----------------------------------------------------------------------")
    print(" Status: OPERATIONAL (Resilient Fallbacks Active)")
    print(" Server running on http://127.0.0.1:8000 (Swagger docs at /docs)")
    print("======================================================================")


def main():
    run_startup_diagnostics()
    # Changed port to 8000 to fix Windows Errno 10048 phantom port bug and match Vite proxy
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=False)


if __name__ == "__main__":
    main()
