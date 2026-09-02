from fastapi import APIRouter
from typing import List, Dict, Any
from ..services.hazard_api_service import fetch_flood_risk, fetch_landslide_risk
from ..engines.ml_priority_engine import calculate_priority_score

router = APIRouter(prefix="/api/ml", tags=["ML Priority Engine"])

@router.post("/evaluate-habitations")
def evaluate_habitations(habitations: List[Dict[str, Any]]):
    """
    Receives a list of habitations, computes hazard scores and vulnerability,
    and returns a JSON payload with Red Zone status and Priority Scores.
    Does not write to the database.
    """
    results = []
    
    for hab in habitations:
        # 1. Ingest Hazard Data
        lat = float(hab.get("latitude", 0.0))
        lng = float(hab.get("longitude", 0.0))
        
        flood_score = fetch_flood_risk(lat, lng)
        landslide_score = fetch_landslide_risk(lat, lng)
        
        # Mocking static vulnerability data if not present in input
        pop_density = float(hab.get("population_density", 300.0))
        pct_elderly = float(hab.get("percentage_elderly", 15.0))
        history_count = int(hab.get("historical_disaster_count", 2))
        
        # 2. Run through ML Priority Engine
        priority_result = calculate_priority_score(
            flood_score=flood_score,
            landslide_score=landslide_score,
            population_density=pop_density,
            percentage_elderly=pct_elderly,
            historical_disaster_count=history_count
        )
        
        results.append({
            "habitation_id": hab.get("id"),
            "name": hab.get("name"),
            "hazard_scores": {
                "flood": flood_score,
                "landslide": landslide_score
            },
            "Relocation_Priority_Score": priority_result["Relocation_Priority_Score"],
            "Zone_Category": priority_result["Zone_Category"]
        })
        
    return {"status": "success", "data": results}
