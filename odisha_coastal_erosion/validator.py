import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

def validate_data(data: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Validates the coastal erosion data based on strict real-data rules.
    """
    errors = []
    seen_ids = set()
    
    required_fields = [
        "village_id", "village_name", "district", "state", "latitude", "longitude",
        "hazard_type", "erosion_area_sq_m", "trend", "risk_level",
        "risk_score_suggested", "context", "mitigation_status", "data_year",
        "source", "source_url"
    ]
    
    for i, row in enumerate(data):
        row_id = row.get("village_id", f"Row_{i}")
        
        # Check required fields
        for field in required_fields:
            if field not in row or row[field] is None:
                errors.append(f"{row_id}: Missing required field '{field}'")
                
        # Check duplicate IDs
        if "village_id" in row and row["village_id"] is not None:
            if row["village_id"] in seen_ids:
                errors.append(f"{row_id}: Duplicate village_id found")
            seen_ids.add(row["village_id"])
            
        # Check coordinates
        lat = row.get("latitude")
        lon = row.get("longitude")
        if isinstance(lat, (int, float)) and (lat < -90 or lat > 90):
            errors.append(f"{row_id}: Invalid latitude {lat}")
        if isinstance(lon, (int, float)) and (lon < -180 or lon > 180):
            errors.append(f"{row_id}: Invalid longitude {lon}")
            
        # Check hazard type and erosion area consistency
        hazard = row.get("hazard_type")
        area = row.get("erosion_area_sq_m")
        if isinstance(hazard, str) and isinstance(area, (int, float)):
            if hazard.lower() == "coastal erosion" and area < 0:
                errors.append(f"{row_id}: Hazard type is Erosion but area is negative ({area})")
            elif hazard.lower() == "accretion" and area > 0:
                errors.append(f"{row_id}: Hazard type is Accretion but area is positive ({area})")
                
    is_valid = len(errors) == 0
    return is_valid, errors
