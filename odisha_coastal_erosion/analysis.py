from typing import List, Dict, Any

def analyze_data(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyzes real data and returns actual calculated metrics without fabrication."""
    erosion_locations = 0
    accretion_locations = 0
    total_erosion_area = 0.0
    total_accretion_area = 0.0
    
    largest_erosion = None
    largest_accretion = None
    
    district_erosion = {}
    
    for row in data:
        hazard = row.get("hazard_type", "").lower()
        area = row.get("erosion_area_sq_m", 0.0)
        if area is None:
            continue
            
        dist = row.get("district", "Unknown")
        name = row.get("village_name", "Unknown")
        
        if hazard == "coastal erosion":
            erosion_locations += 1
            total_erosion_area += area
            
            if dist not in district_erosion:
                district_erosion[dist] = {"count": 0, "total_area": 0.0}
            district_erosion[dist]["count"] += 1
            district_erosion[dist]["total_area"] += area
            
            if largest_erosion is None or area > largest_erosion["area"]:
                largest_erosion = {"name": name, "area": area}
                
        elif hazard == "accretion":
            accretion_locations += 1
            total_accretion_area += abs(area)
            
            if largest_accretion is None or abs(area) > largest_accretion["area"]:
                largest_accretion = {"name": name, "area": abs(area)}
                
    total_locations = erosion_locations + accretion_locations
    pct_erosion = (erosion_locations / total_locations * 100) if total_locations > 0 else 0
    pct_accretion = (accretion_locations / total_locations * 100) if total_locations > 0 else 0
    
    return {
        "total_locations": len(data),
        "erosion_locations": erosion_locations,
        "accretion_locations": accretion_locations,
        "total_erosion_area": total_erosion_area,
        "total_accretion_area": total_accretion_area,
        "largest_erosion": largest_erosion,
        "largest_accretion": largest_accretion,
        "district_erosion": district_erosion,
        "pct_erosion": pct_erosion,
        "pct_accretion": pct_accretion
    }
