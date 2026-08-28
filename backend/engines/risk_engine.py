"""
Multi-Factor Disaster Risk Scoring Engine for VillageShield.
Computes calibrated 0-100 composite risk scores from 5 normalized environmental factors:
- Slope / Terrain (25%)
- Annual Rainfall (25%)
- Past Landslides (20%)
- Flood Risk Index (20%)
- Road Isolation (10%)
"""

import math
from typing import Dict, Any, List


def calculate_risk_score(village: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculates normalized risk score and priority classification for a village.

    Args:
        village: Dictionary containing village metrics.

    Returns:
        Enhanced dictionary with composite risk score, risk level, priority,
        relocation trigger flag, and full score breakdown.
    """
    scored = village.copy()

    slope_raw = float(village.get('slope_degrees', 0.0))
    rain_raw = float(village.get('annual_rainfall_mm', 0.0))
    landslides_raw = float(village.get('past_landslides', 0.0))
    flood_raw = float(village.get('flood_risk_index', 0.0))
    road_raw = float(village.get('road_access_score', 5.0))

    # Factor 1: Slope normalization (0 - 10 scale, max reference 45 degrees for steep Himalayan slopes)
    slope_score = min(max((slope_raw / 45.0) * 10.0, 0.0), 10.0)

    # Factor 2: Rainfall normalization (0 - 10 scale, max reference 3000 mm for heavy monsoon corridor)
    rainfall_score = min(max((rain_raw / 3000.0) * 10.0, 0.0), 10.0)

    # Factor 3: Landslides history (0 - 10 scale, 5+ landslides represents maximum historical hazard)
    landslide_score = min(max(landslides_raw * 2.0, 0.0), 10.0)

    # Factor 4: Flood risk index (0 - 10 scale)
    flood_score = min(max(flood_raw, 0.0), 10.0)

    # Factor 5: Road access isolation (0 - 10 scale, inverted: 10 good access -> 0 risk, 0 poor access -> 10 risk)
    road_score = 10.0 - min(max(road_raw, 0.0), 10.0)

    # Weighted Composite Calculation (Weights: 25%, 25%, 20%, 20%, 10%)
    weighted_sum = (
        slope_score * 0.25 +
        rainfall_score * 0.25 +
        landslide_score * 0.20 +
        flood_score * 0.20 +
        road_score * 0.10
    )

    # Convert to 0 - 100 composite scale
    risk_score = round(min(max(weighted_sum * 10.0, 0.0), 100.0), 1)

    # Risk Tier Classification
    if risk_score >= 75.0:
        risk_level = "Critical"
        priority = "Immediate"
    elif risk_score >= 50.0:
        risk_level = "High"
        priority = "Short-term"
    elif risk_score >= 30.0:
        risk_level = "Moderate"
        priority = "Medium-term"
    else:
        risk_level = "Low"
        priority = "Monitor"

    # Relocation Trigger Rule: Risk Score >= 70.0 mandates relocation
    relocation_required = bool(risk_score >= 70.0)

    score_breakdown = {
        'slope_score': round(slope_score, 1),
        'rainfall_score': round(rainfall_score, 1),
        'landslide_score': round(landslide_score, 1),
        'flood_score': round(flood_score, 1),
        'road_score': round(road_score, 1)
    }

    scored.update({
        'risk_score': risk_score,
        'risk_level': risk_level,
        'priority': priority,
        'relocation_required': relocation_required,
        'score_breakdown': score_breakdown,
        # Flat legacy keys for backward compatibility
        'slope_score': round(slope_score, 1),
        'rainfall_score': round(rainfall_score, 1),
        'landslide_score': round(landslide_score, 1),
        'flood_score': round(flood_score, 1),
        'road_score': round(road_score, 1)
    })

    return scored


def score_all_villages(villages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Scores all villages and returns them sorted by risk score in descending order.
    """
    scored_villages = [calculate_risk_score(v) for v in villages]
    scored_villages.sort(key=lambda x: x['risk_score'], reverse=True)
    return scored_villages
