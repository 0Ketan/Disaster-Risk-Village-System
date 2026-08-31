import pandas as pd
import logging
from datetime import datetime, timezone
import os

from backend.engines.risk_engine import calculate_risk_score, score_all_villages
from backend.engines.relocation_engine import find_best_sites
from backend.services.weather_service import (
    fetch_openweathermap_weather,
    fetch_openweathermap_weather_with_metadata,
    fetch_openweathermap_weather_for_village,
    fetch_live_weather,
    fetch_live_weather_with_metadata,
    fetch_live_weather_for_village,
)
from backend.services.elevation_service import get_cached_elevation

logger = logging.getLogger("villageshield.dynamic_risk_engine")

LAST_UPDATED_TIME = None

_dynamic_state = {
    'last_sync_timestamp': None,
    'villages': [],
    'critical_count': 0,
    'api_health': {},
    'sync_in_progress': False
}

def get_dynamic_state():
    return _dynamic_state.copy()

def get_last_updated_time():
    global LAST_UPDATED_TIME
    return LAST_UPDATED_TIME

def recalculate_dynamic_risk(village, live_rainfall_mm, elevation_m=None):
    """
    Recalculates risk score dynamically using live rainfall data.
    Returns an enriched village dict with dynamic risk fields.
    """
    # calculate_risk_score returns an enriched dict with 'risk_score' key
    scored = calculate_risk_score(village)
    baseline_risk = float(scored.get('risk_score', 0.0))

    annual_rainfall_mm = float(village.get('annual_rainfall_mm', 0))
    hourly_baseline = annual_rainfall_mm / 8760.0 if annual_rainfall_mm > 0 else 0.0
    spike = max(0.0, live_rainfall_mm - hourly_baseline)

    slope_degrees = float(village.get('slope_degrees', 0))
    modifier_applied = False

    if live_rainfall_mm > 15 and slope_degrees > 30:
        dynamic_risk_score = round(min(100.0, baseline_risk + (spike * 1.5)), 1)
        modifier_applied = (dynamic_risk_score != baseline_risk)
    else:
        dynamic_risk_score = baseline_risk

    # Reclassify based on dynamic score
    if dynamic_risk_score >= 75:
        risk_level = "Critical"
        priority = "Immediate"
    elif dynamic_risk_score >= 50:
        risk_level = "High"
        priority = "Short-term"
    elif dynamic_risk_score >= 30:
        risk_level = "Moderate"
        priority = "Medium-term"
    else:
        risk_level = "Low"
        priority = "Monitor"

    rainfall_source = village.get('rainfall_source', 'unknown')

    # Build enriched result from the scored baseline
    scored['dynamic_risk_score'] = dynamic_risk_score
    scored['live_rainfall_mm'] = live_rainfall_mm
    scored['rainfall_source'] = rainfall_source
    scored['weather_timestamp'] = datetime.now(timezone.utc).isoformat()
    scored['risk_score'] = dynamic_risk_score
    scored['risk_level'] = risk_level
    scored['priority'] = priority
    scored['dynamic_modifier_applied'] = modifier_applied
    scored['relocation_required'] = bool(dynamic_risk_score >= 70.0)
    scored['_source'] = "live" if rainfall_source == "OpenMeteo" else "fallback"
    if elevation_m is not None:
        scored['elevation_m'] = elevation_m

    return scored

def recalculate_all_villages_dynamic():
    global _dynamic_state, LAST_UPDATED_TIME
    _dynamic_state['sync_in_progress'] = True
    
    try:
        # Load villages from CSV
        BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        villages_path = os.path.join(BASE_DIR, "data", "villages.csv")
        sites_path = os.path.join(BASE_DIR, "data", "relocation_sites.csv")
        
        villages = []
        if os.path.exists(villages_path):
            df = pd.read_csv(villages_path)
            villages = df.to_dict('records')
            
        relocation_sites = []
        if os.path.exists(sites_path):
            df_sites = pd.read_csv(sites_path)
            relocation_sites = df_sites.to_dict('records')
            
        critical_count = 0
        updated_villages = []
        
        for village in villages:
            lat = village.get('latitude', 0)
            lon = village.get('longitude', 0)
            
            weather_data = fetch_openweathermap_weather_for_village(lat, lon)
            elevation_m, elev_source = get_cached_elevation(lat, lon)
            
            village['rainfall_source'] = weather_data.get('rainfall_source', 'fallback_cache')
            live_rainfall_mm = weather_data.get('live_rainfall_mm', 0.0)
            
            enriched = recalculate_dynamic_risk(village, live_rainfall_mm, elevation_m)
            
            if enriched.get('risk_score', 0) >= 75:
                enriched['relocation_precomputed'] = find_best_sites(enriched, relocation_sites)
                critical_count += 1
            else:
                enriched['relocation_precomputed'] = None
                
            updated_villages.append(enriched)
            
        updated_villages.sort(key=lambda x: x.get('risk_score', 0), reverse=True)
        
        now_iso = datetime.now(timezone.utc).isoformat()
        _dynamic_state['villages'] = updated_villages
        _dynamic_state['critical_count'] = critical_count
        _dynamic_state['last_sync_timestamp'] = now_iso
        LAST_UPDATED_TIME = now_iso
        
    except Exception as e:
        logger.error(f"Error in recalculate_all_villages_dynamic: {e}")
    finally:
        _dynamic_state['sync_in_progress'] = False
        
    return get_dynamic_state()


def refresh_dynamic_state():
    """
    On-Demand Live Weather Fetch and Dynamic Risk Recalculation for /api/refresh.
    1. Loads villages and relocation sites from CSV.
    2. Calls fetch_live_weather_with_metadata(villages) from weather_service (batching with 3.0s timeout & fallback).
    3. Calculates dynamic risk scores using calculate_risk_score(village, live_precipitation=precip).
    4. Enriches with elevation and computes safe relocation recommendations for critical villages.
    5. Updates in-memory _dynamic_state and global LAST_UPDATED_TIME.
    6. Returns updated payload matching VillageListResponse / DynamicVillageListResponse schema.
       On external weather API outage, gracefully falls back and explicitly signals fallback provenance.
    """
    global _dynamic_state, LAST_UPDATED_TIME
    _dynamic_state['sync_in_progress'] = True
    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        villages_path = os.path.join(BASE_DIR, "data", "villages.csv")
        sites_path = os.path.join(BASE_DIR, "data", "relocation_sites.csv")

        villages = []
        if os.path.exists(villages_path):
            try:
                df = pd.read_csv(villages_path)
                villages = df.to_dict('records')
            except Exception as read_err:
                logger.error(f"Error reading villages CSV: {read_err}")

        relocation_sites = []
        if os.path.exists(sites_path):
            try:
                df_sites = pd.read_csv(sites_path)
                relocation_sites = df_sites.to_dict('records')
            except Exception as sites_err:
                logger.error(f"Error reading relocation sites CSV: {sites_err}")

        if not villages:
            LAST_UPDATED_TIME = now_iso
            _dynamic_state['last_sync_timestamp'] = now_iso
            _dynamic_state['villages'] = []
            _dynamic_state['critical_count'] = 0
            return {
                "villages": [],
                "total_villages": 0,
                "critical_count": 0,
                "last_updated": now_iso,
                "last_sync": now_iso,
                "_source": "fallback_cache",
                "sync_source": "fallback",
                "status": "partial_failure",
                "weather_status": "unavailable",
                "warning": "Weather API unavailable. Using cached data.",
            }

        # Step 1: Call fetch_live_weather_with_metadata(villages)
        weather_map = {}
        village_sources = {}
        fetch_status = "fallback"
        fetch_succeeded = False
        try:
            fetch_result = fetch_live_weather_with_metadata(villages)
            if isinstance(fetch_result, dict):
                weather_map = fetch_result.get("weather_map", {})
                village_sources = fetch_result.get("village_sources", {})
                fetch_status = fetch_result.get("status", "fallback")
                fetch_succeeded = (fetch_status in ["success", "partial"])
        except Exception as weather_err:
            logger.error(f"fetch_live_weather_with_metadata failed ({weather_err}). Falling back to baseline.", exc_info=True)
            fetch_succeeded = False
            fetch_status = "fallback"
            weather_map = {v.get("id"): 0.0 for v in villages if v.get("id") is not None}
            village_sources = {v.get("id"): "fallback_cache" for v in villages if v.get("id") is not None}

        # Step 2 & 3: Recalculate dynamic risk scores
        updated_villages = []
        critical_count = 0

        for village in villages:
            v_id = village.get('id')
            lat = village.get('latitude', 0.0)
            lon = village.get('longitude', 0.0)

            precip = float(weather_map.get(v_id, 0.0)) if (v_id is not None and v_id in weather_map) else 0.0
            elevation_m, elev_source = get_cached_elevation(lat, lon)

            # Use calculate_risk_score with live_precipitation modifier
            scored = calculate_risk_score(village, live_precipitation=precip)

            # Determine village-level source
            v_src = village_sources.get(v_id, "OpenMeteo" if fetch_succeeded else "fallback_cache")

            # Enrich with additional schema fields
            scored['elevation_m'] = elevation_m
            scored['live_rainfall_mm'] = precip
            scored['rainfall_source'] = v_src
            scored['weather_timestamp'] = now_iso
            scored['_source'] = "live" if v_src == "OpenMeteo" else "fallback"

            if scored.get('risk_score', 0.0) >= 70.0 or scored.get('risk_level') == 'Critical':
                scored['relocation_precomputed'] = find_best_sites(scored, relocation_sites)
            else:
                scored['relocation_precomputed'] = None

            if scored.get('risk_level') == 'Critical':
                critical_count += 1

            updated_villages.append(scored)

        # Sort descending by active risk_score
        updated_villages.sort(key=lambda x: x.get('risk_score', 0.0), reverse=True)

        # Step 4: Update in-memory dynamic state and global LAST_UPDATED_TIME
        _dynamic_state['villages'] = updated_villages
        _dynamic_state['critical_count'] = critical_count
        _dynamic_state['last_sync_timestamp'] = now_iso
        _dynamic_state['last_updated_time'] = now_iso
        LAST_UPDATED_TIME = now_iso

        if fetch_succeeded:
            return {
                "villages": updated_villages,
                "total_villages": len(updated_villages),
                "critical_count": critical_count,
                "last_updated": now_iso,
                "last_sync": now_iso,
                "_source": "live_refresh",
                "sync_source": "dynamic",
                "status": "success" if fetch_status == "success" else "partial_success",
                "weather_status": "available",
            }
        else:
            return {
                "villages": updated_villages,
                "total_villages": len(updated_villages),
                "critical_count": critical_count,
                "last_updated": now_iso,
                "last_sync": now_iso,
                "_source": "fallback_cache",
                "sync_source": "fallback",
                "status": "partial_failure",
                "weather_status": "unavailable",
                "warning": "Weather API unavailable. Using cached data.",
            }

    except Exception as exc:
        logger.error(f"Error during refresh_dynamic_state: {exc}", exc_info=True)
        # Fallback to static CSV scoring without crashing
        raw_scored = score_all_villages(villages) if villages else []
        for v in raw_scored:
            v['rainfall_source'] = "fallback_cache"
            v['_source'] = "fallback"
        critical_count = sum(1 for v in raw_scored if v.get('risk_level') == 'Critical')
        LAST_UPDATED_TIME = now_iso
        _dynamic_state['villages'] = raw_scored
        _dynamic_state['critical_count'] = critical_count
        _dynamic_state['last_sync_timestamp'] = now_iso
        _dynamic_state['last_updated_time'] = now_iso
        return {
            "villages": raw_scored,
            "total_villages": len(raw_scored),
            "critical_count": critical_count,
            "last_updated": now_iso,
            "last_sync": now_iso,
            "_source": "fallback_cache",
            "sync_source": "fallback",
            "status": "partial_failure",
            "weather_status": "unavailable",
            "warning": "Weather API unavailable. Using cached data.",
        }
    finally:
        _dynamic_state['sync_in_progress'] = False
