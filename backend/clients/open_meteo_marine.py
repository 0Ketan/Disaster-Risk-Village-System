import time
import httpx
from ..models.schemas import APIHealthItem

def probe_open_meteo_marine() -> APIHealthItem:
    """
    Probes the Open-Meteo Marine API endpoint to determine health and latency.
    """
    start_time = time.perf_counter()
    url = "https://marine-api.open-meteo.com/v1/marine?latitude=20.65&longitude=86.83&current=wave_height"
    
    try:
        with httpx.Client(timeout=3.0) as client:
            response = client.get(url)
            latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
            
            if response.status_code == 200:
                return APIHealthItem(
                    service="OpenMeteoMarine",
                    name="Open-Meteo Marine (Wave & Swell)",
                    status="healthy",
                    mode="live",
                    latency_ms=latency_ms,
                    message="Live ocean data stream active"
                )
            else:
                return APIHealthItem(
                    service="OpenMeteoMarine",
                    name="Open-Meteo Marine (Wave & Swell)",
                    status="degraded",
                    mode="fallback",
                    latency_ms=latency_ms,
                    message=f"HTTP {response.status_code} - Using local baselines"
                )
    except Exception as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 1)
        return APIHealthItem(
            service="OpenMeteoMarine",
            name="Open-Meteo Marine (Wave & Swell)",
            status="degraded",
            mode="fallback",
            latency_ms=latency_ms,
            message="Connection failed - Using local baselines"
        )
