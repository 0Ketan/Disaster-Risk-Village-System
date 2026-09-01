import logging
import requests

logger = logging.getLogger("villageshield.hazard_api")

def fetch_flood_risk(latitude: float, longitude: float) -> float:
    """
    Fetches flood risk from Open-Meteo API.
    Returns a normalized score (0.0 to 1.0).
    """
    url = "https://flood-api.open-meteo.com/v1/flood"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": "river_discharge",
        "past_days": 7,
        "forecast_days": 3
    }
    try:
        response = requests.get(url, params=params, timeout=3.0)
        response.raise_for_status()
        data = response.json()
        
        # Simple normalization based on discharge logic
        discharge = data.get("daily", {}).get("river_discharge", [])
        if not discharge:
            return 0.1 # Fallback low risk if no data
            
        max_discharge = max((d for d in discharge if d is not None), default=0.0)
        # Assuming max discharge of 1000 for normalization cap
        score = min(max_discharge / 1000.0, 1.0)
        return float(score)
        
    except (requests.Timeout, requests.ConnectionError, requests.exceptions.JSONDecodeError, requests.HTTPError) as exc:
        logger.error(f"Error fetching flood risk from Open-Meteo for lat={latitude}, lng={longitude}: {exc}")
        return 0.2  # Graceful fallback: Default low/medium risk

def fetch_landslide_risk(latitude: float, longitude: float) -> float:
    """
    Fetches landslide risk from NASA LHASA.
    Currently using a mock JSON response as requested.
    Returns a normalized score (0.0 to 1.0).
    """
    try:
        # Mocking NASA LHASA response
        mock_response = {
            "status": "success",
            "data": {
                "nowcast_probability": 0.65,
                "exposure_level": "High"
            }
        }
        
        score = mock_response["data"]["nowcast_probability"]
        return float(score)
    except Exception as exc:
        logger.error(f"Error fetching mock landslide risk: {exc}")
        return 0.3 # Graceful fallback
