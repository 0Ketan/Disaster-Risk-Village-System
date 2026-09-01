import requests
import datetime

# In-memory 30-minute cache per village_id
# We'll use a simple dict if cachetools isn't installed, but cachetools is standard for TTL.
# Since cachetools might not be in requirements.txt, I'll implement a simple manual TTL cache.

class SimpleTTLCache:
    def __init__(self, ttl_seconds):
        self.ttl = ttl_seconds
        self.cache = {}
        
    def get(self, key):
        if key in self.cache:
            entry = self.cache[key]
            if (datetime.datetime.now() - entry['time']).total_seconds() < self.ttl:
                return entry['value']
            else:
                del self.cache[key]
        return None
        
    def set(self, key, value):
        self.cache[key] = {'value': value, 'time': datetime.datetime.now()}

_cache = SimpleTTLCache(ttl_seconds=1800)

def compute_flood_risk(village_id: str, lat: float, lon: float) -> dict:
    cached_result = _cache.get(village_id)
    if cached_result:
        return cached_result
        
    # API A: Open-Meteo Flood API
    flood_hub_score = 0.5
    flood_gauge_status = "NO_DATA"
    try:
        url_a = f"https://flood-api.open-meteo.com/v1/flood?latitude={lat}&longitude={lon}&daily=river_discharge&forecast_days=3"
        res_a = requests.get(url_a, timeout=10)
        res_a.raise_for_status()
        data_a = res_a.json()
        discharges = data_a.get("daily", {}).get("river_discharge", [])
        max_discharge = max((d for d in discharges if d is not None), default=0.0)
        
        if max_discharge >= 2000:
            flood_hub_score = 1.0
            flood_gauge_status = "EMERGENCY"
        elif max_discharge >= 1000:
            flood_hub_score = 0.8
            flood_gauge_status = "WARNING"
        elif max_discharge >= 500:
            flood_hub_score = 0.6
            flood_gauge_status = "WATCH"
        elif max_discharge >= 250:
            flood_hub_score = 0.4
            flood_gauge_status = "RISING"
        else:
            flood_hub_score = 0.2
            flood_gauge_status = "NORMAL"
    except Exception as e:
        print(f"Error fetching API A: {e}")

    # API B: Open-Meteo Forecast API
    rainfall_score = 0.05
    today_rainfall_mm = 0.0
    next_24hr_rainfall_mm = 0.0
    soil_moisture = 0.0
    try:
        url_b = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=precipitation,soil_moisture_0_to_1cm&daily=precipitation_sum&forecast_days=3&timezone=Asia/Kolkata"
        res_b = requests.get(url_b, timeout=10)
        res_b.raise_for_status()
        data_b = res_b.json()
        
        daily_precip = data_b.get("daily", {}).get("precipitation_sum", [])
        if len(daily_precip) >= 3:
            today_rainfall_mm = daily_precip[0]
            next_24hr_rainfall_mm = daily_precip[1]
            total_3_day = sum(d for d in daily_precip if d is not None)
            
            if total_3_day > 200:
                rainfall_score = 1.0
            elif total_3_day > 100:
                rainfall_score = 0.85
            elif total_3_day > 50:
                rainfall_score = 0.65
            elif total_3_day > 20:
                rainfall_score = 0.40
            elif total_3_day > 5:
                rainfall_score = 0.20
            else:
                rainfall_score = 0.05
                
        hourly_soil = data_b.get("hourly", {}).get("soil_moisture_0_to_1cm", [])
        if hourly_soil and hourly_soil[0] is not None:
            soil_moisture = hourly_soil[0]
            if soil_moisture > 0.8:
                rainfall_score = min(rainfall_score + 0.15, 1.0)
                
    except Exception as e:
        print(f"Error fetching API B: {e}")
        
    # API C: Open-Meteo Elevation API
    elevation_score = 0.05
    elevation_m = 0.0
    try:
        url_c = f"https://api.open-meteo.com/v1/elevation?latitude={lat}&longitude={lon}"
        res_c = requests.get(url_c, timeout=10)
        res_c.raise_for_status()
        data_c = res_c.json()
        elevations = data_c.get("elevation", [])
        if elevations and elevations[0] is not None:
            elevation_m = elevations[0]
            if elevation_m < 5:
                elevation_score = 1.0
            elif elevation_m < 10:
                elevation_score = 0.85
            elif elevation_m < 20:
                elevation_score = 0.65
            elif elevation_m < 35:
                elevation_score = 0.40
            elif elevation_m < 60:
                elevation_score = 0.20
            else:
                elevation_score = 0.05
    except Exception as e:
        print(f"Error fetching API C: {e}")

    # Composite Calculation
    final_flood_risk_score = (flood_hub_score * 0.40) + (rainfall_score * 0.40) + (elevation_score * 0.20)
    
    if final_flood_risk_score >= 0.75:
        risk_level = "CRITICAL"
    elif final_flood_risk_score >= 0.55:
        risk_level = "HIGH"
    elif final_flood_risk_score >= 0.35:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"
        
    summary = f"Flood risk is {risk_level} ({final_flood_risk_score:.2f}). River status is {flood_gauge_status}. Today's rain: {today_rainfall_mm}mm. Elevation: {elevation_m}m."
    
    result = {
        "village_id": village_id,
        "raw_data": {
            "today_rainfall_mm": today_rainfall_mm,
            "next_24hr_rainfall_mm": next_24hr_rainfall_mm,
            "soil_moisture": soil_moisture,
            "elevation_m": elevation_m,
        },
        "components": {
            "flood_hub_score": flood_hub_score,
            "rainfall_score": rainfall_score,
            "elevation_score": elevation_score
        },
        "final_flood_risk_score": round(final_flood_risk_score, 3),
        "risk_level": risk_level,
        "flood_gauge_status": flood_gauge_status,
        "summary": summary,
        "data_timestamp": datetime.datetime.now().isoformat()
    }
    
    _cache.set(village_id, result)
    return result
