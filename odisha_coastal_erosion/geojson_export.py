import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def export_geojson(data: List[Dict[str, Any]], output_path: str) -> None:
    """Exports data to GeoJSON format preserving coordinate order [longitude, latitude]."""
    features = []
    
    for row in data:
        lat = row.get("latitude")
        lon = row.get("longitude")
        
        if lat is None or lon is None:
            continue
            
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]  # GeoJSON standard
            },
            "properties": {
                "id": row.get("village_id"),
                "name": row.get("village_name"),
                "district": row.get("district"),
                "state": row.get("state"),
                "hazard_type": row.get("hazard_type"),
                "trend": row.get("trend"),
                "erosion_area_sq_m": row.get("erosion_area_sq_m"),
                "source_risk_score": row.get("risk_score_suggested"),
                "data_year": row.get("data_year"),
                "source": row.get("source")
            }
        }
        features.append(feature)
        
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to export GeoJSON: {e}")
