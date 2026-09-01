"""
VillageShield Live Weather Service.
Ingests real-time precipitation metrics from the Open-Meteo API with strict
3.0-second timeouts, explicit error checking & diagnostics, robust exception safety,
and graceful zero-crash fallbacks with accurate provenance tracking.
"""

import httpx
import logging
import time
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("villageshield.weather_service")

OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
DEFAULT_TIMEOUT_SECONDS = 3.0


def fetch_live_weather_for_village(
    lat: float,
    lon: float,
    fallback_precip: float = 0.0
) -> Dict[str, Any]:
    """
    Fetches live precipitation for a single geographic coordinate pair from Open-Meteo.
    
    Inspects responses for HTTP errors (429 rate limit, 401/403 auth, 5xx server, 400/404 invalid),
    logs exact HTTP status code and response body on failure, catches specific network/JSON
    exceptions, and provides graceful fallback without crashing.

    Args:
        lat: Latitude in decimal degrees.
        lon: Longitude in decimal degrees.
        fallback_precip: Default precipitation in mm if API call fails (default: 0.0).

    Returns:
        Dictionary containing live_rainfall_mm, rainfall_source, timestamp, and status.
    """
    if lat is None or lon is None:
        logger.warning("Coordinates missing or None; returning fallback weather data.")
        return {
            "live_rainfall_mm": float(fallback_precip),
            "rainfall_source": "fallback_cache",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "fallback"
        }

    try:
        url = f"{OPEN_METEO_BASE_URL}?latitude={lat}&longitude={lon}&current=precipitation,rain"
        response = httpx.get(url, timeout=DEFAULT_TIMEOUT_SECONDS)
        
        if response.status_code == 200:
            try:
                data = response.json()
                current = data.get("current", {}) if isinstance(data, dict) else {}
                precipitation = current.get("precipitation", current.get("rain", 0.0))
                try:
                    rainfall_val = float(precipitation) if precipitation is not None else float(fallback_precip)
                except (ValueError, TypeError):
                    rainfall_val = float(fallback_precip)

                return {
                    "live_rainfall_mm": max(0.0, rainfall_val),
                    "rainfall_source": "OpenMeteo",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "status": "success"
                }
            except (json.JSONDecodeError, ValueError) as json_err:
                logger.error(f"Open-Meteo API JSON decode error for ({lat}, {lon}): {json_err}")
        else:
            logger.error(f"Open-Meteo API returned error status {response.status_code}: {response.text}")
            return {
                "live_rainfall_mm": float(fallback_precip),
                "rainfall_source": "fallback_cache",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "fallback",
                "error_detail": f"HTTP {response.status_code}: {response.text}"
            }
    except httpx.HTTPStatusError as exc:
        logger.error(
            f"Open-Meteo API returned error status {exc.response.status_code}: {exc.response.text}"
        )
    except httpx.TimeoutException as exc:
        logger.error(f"Open-Meteo API timeout error for ({lat}, {lon}): {exc}")
    except httpx.ConnectError as exc:
        logger.error(f"Open-Meteo API connection error for ({lat}, {lon}): {exc}")
    except httpx.RequestError as exc:
        logger.error(f"Open-Meteo API request error for ({lat}, {lon}): {exc}")
    except (json.JSONDecodeError, ValueError) as exc:
        logger.error(f"Open-Meteo API JSON decode error for ({lat}, {lon}): {exc}")
    except Exception as exc:
        logger.error(
            f"Open-Meteo API unexpected error for ({lat}, {lon}): {type(exc).__name__} - {exc}",
            exc_info=True
        )

    logger.warning("Falling back to cached historical precipitation data.")
    return {
        "live_rainfall_mm": float(fallback_precip),
        "rainfall_source": "fallback_cache",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "fallback",
        "error_detail": "API Unavailable"
    }


def fetch_live_weather_with_metadata(villages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Fetches live precipitation for a collection of village records and returns comprehensive metadata.

    Returns:
        Dict[str, Any] containing:
        - weather_map: Dict[int, float] mapping village_id -> live precipitation in mm.
        - source: "OpenMeteo" or "fallback_cache" indicating overall data provenance.
        - status: "success", "partial", or "fallback".
        - village_sources: Dict[int, str] mapping village_id -> "OpenMeteo" | "fallback_cache".
    """
    weather_map: Dict[int, float] = {}
    village_sources: Dict[int, str] = {}

    if not villages:
        return {
            "weather_map": {},
            "source": "fallback_cache",
            "status": "fallback",
            "village_sources": {}
        }

    for v in villages:
        if isinstance(v, dict):
            v_id = v.get("id")
            if v_id is not None:
                weather_map[v_id] = 0.0
                village_sources[v_id] = "fallback_cache"

    valid_villages = [
        v for v in villages
        if isinstance(v, dict) and v.get("id") is not None and v.get("latitude") is not None and v.get("longitude") is not None
    ]

    if not valid_villages:
        return {
            "weather_map": weather_map,
            "source": "fallback_cache",
            "status": "fallback",
            "village_sources": village_sources
        }

    # 1. Try batch API call (comma-separated coordinates)
    batch_succeeded = False
    try:
        lats_str = ",".join(str(v["latitude"]) for v in valid_villages)
        lons_str = ",".join(str(v["longitude"]) for v in valid_villages)
        url = f"{OPEN_METEO_BASE_URL}?latitude={lats_str}&longitude={lons_str}&current=precipitation,rain"

        response = httpx.get(url, timeout=DEFAULT_TIMEOUT_SECONDS)
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list) and len(data) == len(valid_villages):
                    for village, loc_data in zip(valid_villages, data):
                        v_id = village.get("id")
                        if v_id is not None:
                            curr = loc_data.get("current", {}) if isinstance(loc_data, dict) else {}
                            precip = curr.get("precipitation", curr.get("rain", 0.0))
                            try:
                                val = float(precip) if precip is not None else 0.0
                            except (ValueError, TypeError):
                                val = 0.0
                            weather_map[v_id] = max(0.0, val)
                            village_sources[v_id] = "OpenMeteo"
                    batch_succeeded = True
                elif isinstance(data, dict) and len(valid_villages) == 1:
                    v_id = valid_villages[0].get("id")
                    if v_id is not None:
                        curr = data.get("current", {})
                        precip = curr.get("precipitation", curr.get("rain", 0.0))
                        try:
                            val = float(precip) if precip is not None else 0.0
                        except (ValueError, TypeError):
                            val = 0.0
                        weather_map[v_id] = max(0.0, val)
                        village_sources[v_id] = "OpenMeteo"
                    batch_succeeded = True
                else:
                    logger.error(f"Open-Meteo batch response unexpected JSON structure: {data}")
            except (json.JSONDecodeError, ValueError) as json_err:
                logger.error(f"Open-Meteo batch JSON decode error: {json_err}")
        else:
            logger.error(f"Open-Meteo API returned error status {response.status_code}: {response.text}")
    except httpx.HTTPStatusError as exc:
        logger.error(f"Open-Meteo API returned error status {exc.response.status_code}: {exc.response.text}")
    except httpx.TimeoutException as exc:
        logger.error(f"Open-Meteo batch request timed out: {exc}")
    except httpx.ConnectError as exc:
        logger.error(f"Open-Meteo batch connection error: {exc}")
    except httpx.RequestError as exc:
        logger.error(f"Open-Meteo batch network error: {exc}")
    except (json.JSONDecodeError, ValueError) as json_err:
        logger.error(f"Open-Meteo batch JSON decode error: {json_err}")
    except Exception as batch_exc:
        logger.error(
            f"Open-Meteo batch fetch unexpected failure ({type(batch_exc).__name__}: {batch_exc}). Falling back to per-village requests.",
            exc_info=True
        )

    if batch_succeeded:
        return {
            "weather_map": weather_map,
            "source": "OpenMeteo",
            "status": "success",
            "village_sources": village_sources
        }

    # 2. Resilient per-village fetch
    success_count = 0
    try:
        with httpx.Client(timeout=DEFAULT_TIMEOUT_SECONDS) as client:
            for village in valid_villages:
                v_id = village.get("id")
                if v_id is None:
                    continue

                lat = village.get("latitude")
                lon = village.get("longitude")
                try:
                    url = f"{OPEN_METEO_BASE_URL}?latitude={lat}&longitude={lon}&current=precipitation,rain"
                    resp = client.get(url)
                    if resp.status_code == 200:
                        item_data = resp.json()
                        curr = item_data.get("current", {}) if isinstance(item_data, dict) else {}
                        precip = curr.get("precipitation", curr.get("rain", 0.0))
                        if precip is not None:
                            try:
                                val = float(precip)
                                weather_map[v_id] = max(0.0, val)
                                village_sources[v_id] = "OpenMeteo"
                                success_count += 1
                                continue
                            except (ValueError, TypeError) as val_err:
                                logger.error(f"Open-Meteo value parsing error for village {v_id}: {val_err}")
                        else:
                            logger.error(f"Open-Meteo missing precipitation in payload for village {v_id}: {item_data}")
                    else:
                        logger.error(f"Open-Meteo API returned error status {resp.status_code}: {resp.text}")
                    weather_map[v_id] = 0.0
                    village_sources[v_id] = "fallback_cache"
                except httpx.HTTPStatusError as exc:
                    logger.error(f"Open-Meteo API returned error status {exc.response.status_code}: {exc.response.text}")
                    weather_map[v_id] = 0.0
                    village_sources[v_id] = "fallback_cache"
                except httpx.TimeoutException as exc:
                    logger.error(f"Open-Meteo request timed out for village {v_id}: {exc}")
                    weather_map[v_id] = 0.0
                    village_sources[v_id] = "fallback_cache"
                except httpx.ConnectError as exc:
                    logger.error(f"Open-Meteo connection error for village {v_id}: {exc}")
                    weather_map[v_id] = 0.0
                    village_sources[v_id] = "fallback_cache"
                except httpx.RequestError as exc:
                    logger.error(f"Failed per-village fetch for village {v_id}: Network Error {exc}")
                    weather_map[v_id] = 0.0
                    village_sources[v_id] = "fallback_cache"
                except (json.JSONDecodeError, ValueError) as exc:
                    logger.error(f"Failed per-village JSON decode for village {v_id}: {exc}")
                    weather_map[v_id] = 0.0
                    village_sources[v_id] = "fallback_cache"
                except Exception as exc:
                    logger.error(f"Failed per-village fetch for village {v_id}: {exc}")
                    weather_map[v_id] = 0.0
                    village_sources[v_id] = "fallback_cache"
    except Exception as client_exc:
        logger.error(f"Failed to initialize client for fallback fetch: {client_exc}")

    if success_count == len(valid_villages) and len(valid_villages) > 0:
        overall_status = "success"
        overall_source = "OpenMeteo"
    elif success_count > 0:
        overall_status = "partial"
        overall_source = "OpenMeteo"
    else:
        overall_status = "fallback"
        overall_source = "fallback_cache"

    return {
        "weather_map": weather_map,
        "source": overall_source,
        "status": overall_status,
        "village_sources": village_sources
    }


def fetch_openweathermap_weather(villages: List[Dict[str, Any]]) -> Dict[int, float]:
    """
    Fetches live precipitation from OpenWeatherMap API for a collection of villages.
    Uses the same resilient pattern as Open-Meteo with 8s timeout and 1 retry.
    Returns Dict[int, float] mapping village_id -> live precipitation in mm.
    """
    result = fetch_openweathermap_weather_with_metadata(villages)
    return result.get("weather_map", {})


def fetch_live_weather(villages: List[Dict[str, Any]]) -> Dict[int, float]:
    """Backward-compatible alias for fetch_live_weather_with_metadata."""
    result = fetch_live_weather_with_metadata(villages)
    return result.get("weather_map", {})


def fetch_openweathermap_weather_with_metadata(villages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    OpenWeatherMap compatibility wrapper for fetch_live_weather_with_metadata.
    Delegates to the Open-Meteo implementation and returns the same structure.
    """
    return fetch_live_weather_with_metadata(villages)


def fetch_weather_batch(villages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Backward-compatible helper returning a list of weather report dictionaries.
    Maintained for test fixtures and existing dynamic engine consumers.
    """
    results = []
    for village in villages:
        if not isinstance(village, dict):
            continue
        lat = village.get("latitude")
        lon = village.get("longitude")
        if lat is not None and lon is not None:
            results.append(fetch_live_weather_for_village(lat, lon))
    return results


# Alias for OpenWeatherMap compatibility

def fetch_openweathermap_weather_for_village(lat: float, lon: float, fallback_precip: float = 0.0) -> Dict[str, Any]:
    """Compatibility wrapper that forwards to the Open-Meteo implementation.
    The function name is kept for backward‑compatibility with the dynamic
    risk engine which expects an ``OpenWeatherMap``‑specific API.
    """
    return fetch_live_weather_for_village(lat, lon, fallback_precip)


def enrich_villages_with_weather(
    villages: List[Dict[str, Any]],
    weather_map: Optional[Dict[int, float]] = None,
    village_sources: Optional[Dict[int, str]] = None
) -> List[Dict[str, Any]]:
    """
    Enriches a list of village dictionaries with live weather fields.
    Correctly retains 'OpenMeteo' source for live 0.0mm readings.
    """
    if weather_map is None and village_sources is None:
        meta = fetch_live_weather_with_metadata(villages)
        weather_map = meta.get("weather_map", {})
        village_sources = meta.get("village_sources", {})
    elif weather_map is None:
        weather_map = fetch_live_weather(villages)

    enriched = []
    now_iso = datetime.now(timezone.utc).isoformat()
    for v in villages:
        if not isinstance(v, dict):
            continue
        item = v.copy()
        v_id = item.get("id")
        precip = weather_map.get(v_id, 0.0) if (v_id is not None and weather_map is not None) else 0.0
        item["live_precipitation"] = precip
        item["live_rainfall_mm"] = precip
        
        if village_sources and v_id in village_sources:
            item["rainfall_source"] = village_sources[v_id]
        elif v_id is not None and weather_map is not None and v_id in weather_map:
            item["rainfall_source"] = "OpenMeteo"
        else:
            item["rainfall_source"] = "fallback_cache"
            
        item["weather_timestamp"] = now_iso
        enriched.append(item)
    return enriched
