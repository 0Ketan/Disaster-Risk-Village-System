"""
Baseline village dataset loader.

Always reads the exact project-root file `data/villages.csv` so every engine,
API route, and startup path shares one source of truth.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

import pandas as pd

logger = logging.getLogger("villageshield.data_loader")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
VILLAGES_CSV = os.path.join(DATA_DIR, "villages.csv")
SITES_CSV = os.path.join(DATA_DIR, "relocation_sites.csv")

_NUMERIC_INT_FIELDS = ("id", "population", "past_landslides")
_NUMERIC_FLOAT_FIELDS = (
    "latitude",
    "longitude",
    "slope_degrees",
    "annual_rainfall_mm",
    "flood_risk_index",
    "road_access_score",
    "vulnerability_index",
)


def villages_csv_path() -> str:
    return VILLAGES_CSV


def _to_int(value: Any, default: Optional[int] = None) -> Optional[int]:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_float(value: Any, default: Optional[float] = None) -> Optional[float]:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize_village_record(row: Dict[str, Any]) -> Dict[str, Any]:
    """Coerce CSV/pandas types so village ids match Open-Meteo weather maps."""
    record = dict(row)
    for field in _NUMERIC_INT_FIELDS:
        if field in record:
            record[field] = _to_int(record.get(field), default=0 if field != "id" else None)
    for field in _NUMERIC_FLOAT_FIELDS:
        if field in record:
            record[field] = _to_float(record.get(field), default=0.0)
    return record


def load_villages_csv() -> List[Dict[str, Any]]:
    """Load and normalize `data/villages.csv`. Returns [] if the file is missing."""
    path = VILLAGES_CSV
    if not os.path.exists(path):
        logger.error("Villages CSV not found at %s", path)
        return []
    try:
        df = pd.read_csv(path)
        villages = [normalize_village_record(row) for row in df.to_dict(orient="records")]
        
        # Merge coastal erosion dataset natively to prevent vanishing on refresh
        coastal = load_coastal_erosion_json()
        for c in coastal:
            villages.append({
                "id": c.get("village_id"),
                "name": c.get("village_name"),
                "district": c.get("district", "Odisha Coastal"),
                "state": c.get("state", "Odisha"),
                "latitude": c.get("latitude"),
                "longitude": c.get("longitude"),
                "population": 0,
                "slope_degrees": 0.0,
                "annual_rainfall_mm": 0.0,
                "past_landslides": 0,
                "flood_risk_index": 0.0,
                "road_access_score": 10.0,
                "risk_score_suggested": c.get("risk_score_suggested", 0.0),
                "is_coastal_erosion": True,
                "erosion_area_sq_m": c.get("erosion_area_sq_m"),
                "mitigation_status": c.get("mitigation_status"),
                "data_year": c.get("data_year")
            })

        logger.info("Loaded %s villages (incl. coastal) from %s", len(villages), os.path.abspath(path))
        return villages
    except Exception as exc:
        logger.error("Error reading villages CSV at %s: %s", path, exc)
        return []


def load_relocation_sites_csv() -> List[Dict[str, Any]]:
    path = SITES_CSV
    if not os.path.exists(path):
        logger.error("Relocation sites CSV not found at %s", path)
        return []
    try:
        df = pd.read_csv(path)
        return df.to_dict(orient="records")
    except Exception as exc:
        logger.error("Error reading relocation sites CSV at %s: %s", path, exc)
        return []

COASTAL_EROSION_JSON = os.path.join(DATA_DIR, "odisha_coastal_erosion_villages.json")

def load_coastal_erosion_json() -> List[Dict[str, Any]]:
    import json
    path = COASTAL_EROSION_JSON
    if not os.path.exists(path):
        logger.error("Coastal Erosion JSON not found at %s", path)
        return []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
            
        validated_data = []
        seen_ids = set()
        required_fields = ["village_id", "village_name", "latitude", "longitude", "erosion_area_sq_m", "trend", "risk_level"]
        
        for row in raw_data:
            # required fields
            if any(row.get(f) is None for f in required_fields):
                continue
                
            # coordinates
            lat, lon = row.get("latitude"), row.get("longitude")
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                continue
                
            # duplicate IDs
            vid = row.get("village_id")
            if vid in seen_ids:
                continue
            seen_ids.add(vid)
            
            # erosion area logically consistent with hazard_type
            hazard = row.get("hazard_type", "")
            area = row.get("erosion_area_sq_m", 0)
            if hazard == "Coastal Erosion" and area < 0:
                continue
            if hazard == "Accretion" and area > 0:
                continue
                
            validated_data.append(row)
            
        logger.info("Loaded %s coastal erosion locations from %s", len(validated_data), path)
        return validated_data
    except Exception as exc:
        logger.error("Error reading coastal erosion JSON at %s: %s", path, exc)
        return []
