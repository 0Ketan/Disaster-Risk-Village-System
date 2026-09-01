import json
import os
import httpx
import logging
import time
import math

logger = logging.getLogger("villageshield.elevation_service")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE_PATH = os.path.join(BASE_DIR, "data", "elevation_cache.json")

def _load_cache():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load elevation cache: {e}")
    return {}

def _save_cache(cache):
    try:
        os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
        with open(CACHE_PATH, "w") as f:
            json.dump(cache, f)
    except Exception as e:
        logger.error(f"Failed to save elevation cache: {e}")

def get_cached_elevation(lat, lon):
    cache = _load_cache()
    key = f"{lat:.4f},{lon:.4f}"
    if key in cache:
        return cache[key]["elevation_m"], cache[key]["source"]
        
    try:
        url = f"https://api.opentopodata.org/v1/srtm30m?locations={lat},{lon}"
        response = httpx.get(url, timeout=8.0)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        if results and "elevation" in results[0]:
            elevation = results[0]["elevation"]
            cache[key] = {"elevation_m": elevation, "source": "OpenTopoData"}
            _save_cache(cache)
            return elevation, "OpenTopoData"
    except Exception as e:
        logger.error(f"Failed to fetch elevation from OpenTopoData: {e}")
        try:
            from backend.clients.opentopodata import mock_elevation_generator
            mock_data = mock_elevation_generator(lat, lon)
            elevation = float(mock_data["results"][0]["elevation"])
            return elevation, "mock_elevation_generator"
        except (ImportError, KeyError, IndexError, TypeError, ValueError):
            pass
            
    return 0.0, "fallback"

def get_batch_elevations(coords_list):
    cache = _load_cache()
    results = {}
    
    # Process in batches of 100
    for i in range(0, len(coords_list), 100):
        batch = coords_list[i:i+100]
        batch_keys = [f"{lat:.4f},{lon:.4f}" for lat, lon in batch]
        
        locations = "|".join([f"{lat},{lon}" for lat, lon in batch])
        try:
            url = f"https://api.opentopodata.org/v1/srtm30m?locations={locations}"
            response = httpx.get(url, timeout=8.0)
            response.raise_for_status()
            data = response.json()
            
            api_results = data.get("results", [])
            for j, res in enumerate(api_results):
                if "elevation" in res:
                    cache[batch_keys[j]] = {"elevation_m": res["elevation"], "source": "OpenTopoData"}
                    results[batch[j]] = (res["elevation"], "OpenTopoData")
                    
        except Exception as e:
            logger.error(f"Failed to fetch batch elevations: {e}")
            
    _save_cache(cache)
    return results

def compute_slope_steepness(village):
    lat = village.get("latitude")
    lon = village.get("longitude")
    if lat is not None and lon is not None:
        try:
            return village.get('slope_degrees', 0)
        except Exception as e:
            logger.error(f"Failed to compute slope: {e}")
            
    return village.get('slope_degrees', 0)
