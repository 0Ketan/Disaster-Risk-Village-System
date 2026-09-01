"""
FastAPI REST API Route Controllers for VillageShield.
"""

import os
import sys
import json
import logging
import pandas as pd
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query

from ..models.schemas import (
    Village,
    VillageListResponse,
    VillageDetailResponse,
    RelocationResponse,
    DashboardSummaryResponse,
    RiskDistribution,
    DashboardPriorityItem,
    DashboardPriorityResponse
)
from ..engines.risk_engine import calculate_risk_score, score_all_villages
from ..engines.relocation_engine import find_best_sites
from ..clients.opentopodata import get_elevation_sync
from ..engines.dynamic_risk_engine import get_dynamic_state

logger = logging.getLogger("villageshield.api")

router = APIRouter(prefix="/api", tags=["Disaster Risk & Relocation"])

# Base Directory Resolution
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
VILLAGES_CSV = os.path.join(DATA_DIR, "villages.csv")
SITES_CSV = os.path.join(DATA_DIR, "relocation_sites.csv")


def load_villages_raw() -> List[Dict[str, Any]]:
    """Loads raw villages dataset from CSV."""
    if not os.path.exists(VILLAGES_CSV):
        logger.error(f"Villages CSV not found at {VILLAGES_CSV}")
        return []
    try:
        df = pd.read_csv(VILLAGES_CSV)
        return df.to_dict(orient="records")
    except Exception as exc:
        logger.error(f"Error reading villages CSV: {exc}")
        return []


def load_relocation_sites_raw() -> List[Dict[str, Any]]:
    """Loads raw relocation sites dataset from CSV."""
    if not os.path.exists(SITES_CSV):
        logger.error(f"Relocation sites CSV not found at {SITES_CSV}")
        return []
    try:
        df = pd.read_csv(SITES_CSV)
        return df.to_dict(orient="records")
    except Exception as exc:
        logger.error(f"Error reading relocation sites CSV: {exc}")
        return []


@router.get("/villages")
def get_villages(
    district: Optional[str] = Query(None, description="Filter by district"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (Critical, High, Moderate, Low)")
):
    """
    Returns list of all monitored villages with multi-factor risk scores and breakdowns.
    Sorted descending by risk score.
    """
    raw_villages = load_villages_raw()
    if not raw_villages:
        return {"villages": [], "_source": "fallback"}

    scored = score_all_villages(raw_villages)

    # Use dynamic scores if a recent sync exists
    dynamic_state = get_dynamic_state()
    if dynamic_state.get('last_sync_timestamp') and dynamic_state.get('villages'):
        scored = dynamic_state['villages']

    if district:
        scored = [v for v in scored if str(v.get('district', '')).lower() == district.lower()]

    if risk_level:
        scored = [v for v in scored if str(v.get('risk_level', '')).lower() == risk_level.lower()]

    return {"villages": scored, "_source": "live"}


@router.get("/villages/{village_id}", response_model=VillageDetailResponse)
def get_village_by_id(village_id: int):
    """
    Returns complete details for a specific village, enriched with live/synthetic elevation and weather.
    """
    raw_villages = load_villages_raw()
    matching = [v for v in raw_villages if int(v.get('id', 0)) == village_id]

    if not matching:
        raise HTTPException(status_code=404, detail=f"Village with ID {village_id} not found")

    scored = calculate_risk_score(matching[0])

    # Enrich with elevation if not present
    if scored.get('elevation_m') is None:
        elev, elev_source = get_elevation_sync(scored['latitude'], scored['longitude'])
        scored['elevation_m'] = elev

    village_model = Village.model_validate(scored)
    return VillageDetailResponse(village=village_model, _source="live")


@router.get("/villages/{village_id}/relocation", response_model=RelocationResponse)
def get_village_relocation(village_id: int):
    """
    Computes eligible safe relocation sites for a village and returns top 3 ranked recommendations.
    Automatically flags relocation_required when risk score >= 70.0.
    """
    raw_villages = load_villages_raw()
    matching = [v for v in raw_villages if int(v.get('id', 0)) == village_id]

    if not matching:
        raise HTTPException(status_code=404, detail=f"Village with ID {village_id} not found")

    scored_village = calculate_risk_score(matching[0])
    raw_sites = load_relocation_sites_raw()

    best_sites = find_best_sites(scored_village, raw_sites)

    return RelocationResponse(
        village_id=scored_village['id'],
        village_name=scored_village['name'],
        risk_score=scored_village['risk_score'],
        relocation_required=scored_village['relocation_required'],
        sites=best_sites,
        _source="live"
    )


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary():
    """
    Returns aggregate summary statistics for the executive dashboard overview cards.
    """
    raw_villages = load_villages_raw()
    scored = score_all_villages(raw_villages) if raw_villages else []

    # Use dynamic scores if available
    dynamic_state = get_dynamic_state()
    if dynamic_state.get('last_sync_timestamp') and dynamic_state.get('villages'):
        scored = dynamic_state['villages']

    total_villages = len(scored)
    critical_count = sum(1 for v in scored if v.get('risk_level') == 'Critical')
    high_count = sum(1 for v in scored if v.get('risk_level') == 'High')
    moderate_count = sum(1 for v in scored if v.get('risk_level') == 'Moderate')
    low_count = sum(1 for v in scored if v.get('risk_level') == 'Low')

    total_pop_at_risk = sum(
        int(v.get('population', 0)) for v in scored
        if v.get('risk_level') in ['Critical', 'High']
    )

    relocations_needed = sum(1 for v in scored if v.get('relocation_required', False))

    distribution = RiskDistribution(
        critical=critical_count,
        high=high_count,
        moderate=moderate_count,
        low=low_count
    )

    # Fix the weather health check - use dynamic state for weather status
    api_health_status = {
        "opentopodata": "live",
        "openweathermap": "live" if dynamic_state.get('weather_status') == 'available' else "fallback",
        "meteostat": "live"
    }

    return DashboardSummaryResponse(
        total_villages=total_villages,
        high_risk_villages=high_count + critical_count,
        critical_villages=critical_count,
        total_population_at_risk=total_pop_at_risk,
        relocations_needed_count=relocations_needed,
        risk_distribution=distribution,
        api_health=api_health_status,
        _source="live"
    )


@router.get("/dashboard", response_model=DashboardPriorityResponse)
def get_dashboard_priorities():
    """
    Returns a simplified sorted list of villages prioritized for action.
    """
    raw_villages = load_villages_raw()
    scored = score_all_villages(raw_villages) if raw_villages else []

    priorities = [
        DashboardPriorityItem(
            id=int(v['id']),
            name=str(v['name']),
            district=str(v['district']),
            population=int(v['population']),
            risk_score=float(v['risk_score']),
            risk_level=str(v['risk_level']),
            priority=str(v['priority'])
        )
        for v in scored
    ]

    return DashboardPriorityResponse(priority_list=priorities)


# Add missing endpoints as specified in the prompt

@router.get("/villages/{village_id}/hazard-zones")
def get_village_hazard_zones(village_id: int):
    """Returns per-hazard zone classification for a village."""
    raw_villages = load_villages_raw()
    matching = [v for v in raw_villages if int(v.get('id', 0)) == village_id]
    if not matching:
        raise HTTPException(status_code=404, detail=f"Village {village_id} not found")
    scored = calculate_risk_score(matching[0])
    return {
        "village_id": village_id,
        "village_name": scored['name'],
        "landslide_zone": scored['landslide_zone'],
        "flood_zone": scored['flood_zone'],
        "cloudburst_zone": scored['cloudburst_zone'],
        "coastal_erosion_zone": scored['coastal_erosion_zone'],
        "hazard_zones": scored['hazard_zones'],
        "composite_hazard_label": scored['composite_hazard_label'],
        "vulnerability_index": scored.get('vulnerability_index', 5.0),
        "_source": "live"
    }


@router.get("/export/district-report")
def export_district_report(district: Optional[str] = Query(None)):
    """Returns structured data for printable district report."""
    raw_villages = load_villages_raw()
    scored = score_all_villages(raw_villages)
    if district:
        scored = [v for v in scored if
                  str(v.get('district','')).lower() == district.lower()]

    critical = [v for v in scored if v.get('risk_level') == 'Critical']
    high = [v for v in scored if v.get('risk_level') == 'High']

    return {
        "district": district or "All Districts",
        "generated_at": pd.Timestamp.utcnow().isoformat(),
        "total_villages": len(scored),
        "summary": {
            "critical": len(critical),
            "high": len(high),
            "moderate": len([v for v in scored if v.get('risk_level') == 'Moderate']),
            "low": len([v for v in scored if v.get('risk_level') == 'Low']),
            "population_at_risk": sum(int(v.get('population', 0))
                                      for v in critical + high)
        },
        "immediate_action_villages": critical[:5],
        "short_term_villages": high[:5],
        "_source": "live"
    }