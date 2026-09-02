"""
Multi-Factor Disaster Risk Scoring Engine for VillageShield.
Computes calibrated 0-100 composite risk scores from 5 normalized environmental factors:
- Slope / Terrain (25%)
- Annual Rainfall (25%)
- Past Landslides (20%)
- Flood Risk Index (20%)
- Road Isolation (10%)

Supports dynamic real-time risk recalculation with live precipitation modifiers:
dynamic_risk = min(max(base_risk_score + (live_precipitation * 2.0), 0.0), 100.0)
"""

import math
from typing import Dict, Any, List, Optional


def _clean_metric(val: Any, default: float = 0.0) -> float:
    """
    Safely converts input value to a finite float.
    Returns default if value is None, invalid type/string, NaN, or infinite.
    """
    try:
        if val is None:
            return default
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (ValueError, TypeError, OverflowError):
        return default


def calculate_risk_score(
    village: Dict[str, Any],
    live_precipitation: Optional[float] = None
) -> Dict[str, Any]:
    """
    Calculates normalized base risk score and dynamic risk score (if live precipitation provided)
    along with priority classification and relocation triggers for a village.

    Args:
        village: Dictionary containing village metrics.
        live_precipitation: Optional real-time precipitation reading in mm. If provided,
            applies dynamic risk modifier: dynamic_risk = base_risk + (live_precipitation * 2.0) capped at 100.

    Returns:
        Enhanced dictionary containing:
        - risk_score: Active composite risk score (dynamic_risk if live precip provided, else base)
        - base_risk_score: Static baseline score from historical CSV metrics
        - dynamic_risk_score: Dynamic score if live precip provided, else None
        - live_precipitation_mm: Applied precipitation in mm if provided, else None
        - dynamic_modifier_applied: Boolean indicating if dynamic adjustment was made
        - risk_level: "Critical" | "High" | "Moderate" | "Low"
        - priority: "Immediate" | "Short-term" | "Medium-term" | "Monitor"
        - relocation_required: True if risk_score >= 70.0, else False
        - score_breakdown: Dict of normalized factor scores (0.0 - 10.0)
    """
    scored = village.copy()

    # Safely extract and parse metrics with resilient defaults
    slope_raw = _clean_metric(village.get('slope_degrees'), default=0.0)
    rain_raw = _clean_metric(village.get('annual_rainfall_mm'), default=0.0)
    landslides_raw = _clean_metric(village.get('past_landslides'), default=0.0)
    flood_raw = _clean_metric(village.get('flood_risk_index'), default=0.0)
    road_raw = _clean_metric(village.get('road_access_score'), default=5.0)

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

    # Base Static Risk Score (0.0 - 100.0)
    base_risk_score = round(min(max(weighted_sum * 10.0, 0.0), 100.0), 1)

    # Dynamic Modifier Calculation
    if live_precipitation is not None:
        try:
            live_precip = float(live_precipitation)
            if math.isnan(live_precip) or math.isinf(live_precip):
                live_precip = 0.0
        except (ValueError, TypeError):
            live_precip = 0.0

        live_precip = max(0.0, live_precip)
        dynamic_risk = round(min(max(base_risk_score + (live_precip * 2.0), 0.0), 100.0), 1)
        risk_score = dynamic_risk
        dynamic_risk_score = dynamic_risk
        live_precipitation_mm = round(live_precip, 2)
        dynamic_modifier_applied = bool(live_precip > 0.0)
    else:
        risk_score = base_risk_score
        dynamic_risk_score = None
        live_precipitation_mm = None
        dynamic_modifier_applied = False

    # Risk Tier Classification (Evaluated on active risk_score)
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

    # Relocation Trigger Rule: Active Risk Score >= 70.0 mandates relocation
    relocation_required = bool(risk_score >= 70.0)

    score_breakdown = {
        'slope_score': round(slope_score, 1),
        'rainfall_score': round(rainfall_score, 1),
        'landslide_score': round(landslide_score, 1),
        'flood_score': round(flood_score, 1),
        'road_score': round(road_score, 1)
    }

    # --- Multi-Hazard Red Zone Logic ---
    landslide_subscore = (slope_score * 0.45 + landslide_score * 0.35 + rainfall_score * 0.20) * 10.0
    flood_subscore = (flood_score * 0.55 + rainfall_score * 0.45) * 10.0

    cloudburst_base = (rainfall_score * 0.70 + slope_score * 0.15 + road_score * 0.15) * 10.0
    cloudburst_subscore = min(cloudburst_base + (10.0 if rain_raw >= 2800 else 0.0), 100.0)

    coastal_erosion_subscore = min((flood_score * 0.60 + rainfall_score * 0.40) * 10.0, 100.0)

    # Live Open-Meteo rain is combined with CSV slope_degrees + past_landslides
    # so villages can shift Red / Orange / Green on Refresh.
    if live_precipitation is not None:
        live_boost = live_precip * 2.5
        terrain_factor = 1.0 + max(0.0, (slope_raw - 20.0) / 50.0)
        history_factor = 1.0 + min(landslides_raw, 8.0) * 0.12
        landslide_live = live_boost * terrain_factor * history_factor
        if live_precip >= 8.0 and slope_raw >= 30.0:
            landslide_live += 12.0
        if live_precip >= 15.0 and landslides_raw >= 3.0:
            landslide_live += 10.0
        landslide_subscore = min(landslide_subscore + landslide_live, 100.0)
        flood_subscore = min(flood_subscore + live_precip * 2.0, 100.0)
        cloudburst_subscore = min(cloudburst_subscore + live_precip * 3.0, 100.0)
        coastal_erosion_subscore = min(coastal_erosion_subscore + live_precip * 1.2, 100.0)

    def get_zone(score):
        if score >= 75.0:
            return "Red"
        if score >= 50.0:
            return "Orange"
        return "Green"

    # Static zones (baseline from CSV factors only, before live weather escalation)
    static_landslide_zone = get_zone(landslide_subscore)
    static_flood_zone = get_zone(flood_subscore)
    static_cloudburst_zone = get_zone(cloudburst_subscore)

    # Rainfall-driven hazards escalate with live precipitation (same 2.0 pts/mm
    # scale as the composite dynamic modifier, capped at +30 to stay bounded).
    live_zone_boost = round(min(live_precipitation_mm * 2.0, 30.0), 1) if live_precipitation_mm else 0.0
    if live_zone_boost > 0.0:
        landslide_subscore = min(landslide_subscore + live_zone_boost, 100.0)
        flood_subscore = min(flood_subscore + live_zone_boost, 100.0)
        cloudburst_subscore = min(cloudburst_subscore + live_zone_boost, 100.0)

    landslide_zone = get_zone(landslide_subscore)
    flood_zone = get_zone(flood_subscore)
    cloudburst_zone = get_zone(cloudburst_subscore)
    coastal_erosion_zone = get_zone(coastal_erosion_subscore)

<<<<<<< Updated upstream
    zones_shifted_by_live_weather = (
        landslide_zone != static_landslide_zone
        or flood_zone != static_flood_zone
        or cloudburst_zone != static_cloudburst_zone
    )
=======
    if risk_score >= 75.0:
        dynamic_zone = "Red"
    elif risk_score >= 50.0:
        dynamic_zone = "Orange"
    else:
        dynamic_zone = "Green"
>>>>>>> Stashed changes

    hazard_zones = {
        'landslide': landslide_zone,
        'flood': flood_zone,
        'cloudburst': cloudburst_zone,
        'coastal_erosion': coastal_erosion_zone
    }
    
    red_count = list(hazard_zones.values()).count("Red")
    if red_count >= 2:
        composite_hazard_label = "Multi-Hazard Critical"
    elif red_count == 1:
        composite_hazard_label = "Single-Hazard Critical"
    else:
        composite_hazard_label = "Low Multi-Hazard Exposure"

    scored.update({
        'risk_score': risk_score,
        'base_risk_score': base_risk_score,
        'dynamic_risk_score': dynamic_risk_score,
        'live_precipitation_mm': live_precipitation_mm,
        'dynamic_modifier_applied': dynamic_modifier_applied,
        'risk_level': risk_level,
        'priority': priority,
        'relocation_required': relocation_required,
        'score_breakdown': score_breakdown,
        'landslide_subscore': round(landslide_subscore, 1),
        'flood_subscore': round(flood_subscore, 1),
        'cloudburst_subscore': round(cloudburst_subscore, 1),
        'coastal_erosion_subscore': round(coastal_erosion_subscore, 1),
        'live_zone_boost': live_zone_boost,
        'zones_shifted_by_live_weather': zones_shifted_by_live_weather,
        'landslide_zone': landslide_zone,
        'flood_zone': flood_zone,
        'cloudburst_zone': cloudburst_zone,
        'coastal_erosion_zone': coastal_erosion_zone,
        'dynamic_zone': dynamic_zone,
        'composite_hazard_label': composite_hazard_label,
        'hazard_zones': hazard_zones,
        # Flat legacy keys for backward compatibility
        'slope_score': round(slope_score, 1),
        'rainfall_score': round(rainfall_score, 1),
        'landslide_score': round(landslide_score, 1),
        'flood_score': round(flood_score, 1),
        'road_score': round(road_score, 1)
    })

    return scored


def score_all_villages(
    villages: List[Dict[str, Any]],
    live_precipitations: Optional[Dict[int, float]] = None
) -> List[Dict[str, Any]]:
    """
    Scores all villages and returns them sorted by active risk score in descending order.

    Args:
        villages: List of village metric dictionaries.
        live_precipitations: Optional mapping from village ID (int) to live precipitation (float in mm).

    Returns:
        List of scored village dictionaries sorted descending by risk_score.
    """
    scored_villages = []
    for v in villages:
        v_id = v.get('id')
        precip = None
        if live_precipitations is not None and v_id is not None:
            try:
                precip = live_precipitations.get(int(v_id), live_precipitations.get(v_id))
            except (TypeError, ValueError):
                precip = live_precipitations.get(v_id)
        scored_villages.append(calculate_risk_score(v, live_precipitation=precip))

    scored_villages.sort(key=lambda x: x['risk_score'], reverse=True)
    return scored_villages
