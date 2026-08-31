"""
FastAPI Sync Router for Dynamic Weather & Risk Recalculation.
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter
from ..models.schemas import (
    SyncWeatherResponse,
    SyncStatusResponse,
    DynamicVillageListResponse,
    DynamicVillage,
)
from ..engines.dynamic_risk_engine import (
    recalculate_all_villages_dynamic,
    refresh_dynamic_state,
    get_dynamic_state,
    get_last_updated_time,
    LAST_UPDATED_TIME,
)

logger = logging.getLogger("villageshield.api.sync")

router = APIRouter(prefix="/api", tags=["Live Sync & Dynamic Risk"])


@router.post("/refresh")
@router.get("/refresh")
def refresh_data():
    """
    On-Demand Live Weather Fetch and Dynamic Risk Recalculation Endpoint.
    - Calls refresh_dynamic_state() from dynamic_risk_engine.
    - Returns updated payload matching DynamicVillageListResponse schema.
    - Returns HTTP 200 with fallback data if external API fails (zero server crash).
    """
    try:
        return refresh_dynamic_state()
    except Exception as exc:
        logger.error(f"Refresh data failed: {exc}", exc_info=True)
        state = get_dynamic_state()
        now_iso = datetime.now(timezone.utc).isoformat()
        return {
            "villages": state.get("villages", []),
            "total_villages": len(state.get("villages", [])),
            "critical_count": state.get("critical_count", 0),
            "last_updated": now_iso,
            "last_sync": state.get("last_sync_timestamp", now_iso),
            "_source": "fallback_cache",
            "weather_status": "unavailable",
            "status": "partial_failure",
            "warning": "Weather API unavailable. Using cached data.",
        }


@router.post("/sync-weather", response_model=SyncWeatherResponse)
def trigger_sync_weather():
    """
    Triggers an immediate live weather fetch and dynamic risk recalculation
    for all monitored villages. Returns updated risk levels and affected Red Zones.
    """
    try:
        state = recalculate_all_villages_dynamic()
        villages = state.get('villages', [])
        critical_villages = [v for v in villages if v.get('risk_level') == 'Critical']

        red_zones = []
        for v in critical_villages:
            red_zones.append({
                'id': v.get('id'),
                'name': v.get('name'),
                'risk_score': v.get('risk_score'),
                'live_rainfall_mm': v.get('live_rainfall_mm', 0),
                'dynamic_modifier_applied': v.get('dynamic_modifier_applied', False),
                'relocation_precomputed': bool(v.get('relocation_precomputed')),
            })

        # Determine overall source quality
        sources = {}
        for v in villages:
            src = v.get('rainfall_source', 'unknown')
            sources[src] = sources.get(src, 0) + 1

        has_live = any(s in sources for s in ['OpenWeatherMap', 'OpenMeteo'])
        has_fallback = 'fallback_cache' in sources
        if has_live and not has_fallback:
            status = 'success'
        elif has_live and has_fallback:
            status = 'partial'
        else:
            status = 'fallback'

        return SyncWeatherResponse(
            status=status,
            sync_timestamp=state.get('last_sync_timestamp', datetime.now(timezone.utc).isoformat()),
            villages_updated=len(villages),
            critical_villages=len(critical_villages),
            red_zone_villages=red_zones,
            api_sources={k: str(v) for k, v in sources.items()},
            message=f"Dynamic sync complete. {len(critical_villages)} critical villages identified."
        )
    except Exception as exc:
        logger.error(f"Sync weather failed: {exc}", exc_info=True)
        return SyncWeatherResponse(
            status='fallback',
            sync_timestamp=datetime.now(timezone.utc).isoformat(),
            villages_updated=0,
            critical_villages=0,
            red_zone_villages=[],
            api_sources={},
            message=f"Sync encountered error, using baseline data: {str(exc)}"
        )


@router.get("/sync-status", response_model=SyncStatusResponse)
def get_sync_status():
    """
    Returns the last sync timestamp, API health status, and count of critical villages.
    """
    try:
        state = get_dynamic_state()
        last_ts = state.get('last_sync_timestamp')
        sync_in_progress = state.get('sync_in_progress', False)

        sync_age = None
        is_stale = True
        if last_ts:
            try:
                last_dt = datetime.fromisoformat(last_ts.replace('Z', '+00:00'))
                age = (datetime.now(timezone.utc) - last_dt).total_seconds() / 60.0
                sync_age = round(age, 1)
                is_stale = age > 120  # Stale if older than 2 hours
            except Exception:
                pass

        # Determine weather API status from dynamic state
        weather_api_status = "live" if state.get('weather_status') == 'available' else "fallback"

        return SyncStatusResponse(
            last_sync=last_ts,
            sync_in_progress=sync_in_progress,
            sync_age_minutes=sync_age,
            is_stale=is_stale,
            critical_villages_count=state.get('critical_count', 0),
            total_synced_villages=len(state.get('villages', [])),
            weather_api_status=weather_api_status,
            api_health=state.get('api_health', {}),
            status='active' if not is_stale else 'stale'
        )
    except Exception as exc:
        logger.error(f"Sync status check failed: {exc}", exc_info=True)
        return SyncStatusResponse(
            status='error',
            last_sync=None,
            sync_in_progress=False,
            sync_age_minutes=None,
            is_stale=True,
            critical_villages_count=0,
            total_synced_villages=0,
            weather_api_status='fallback',
            api_health={},
        )


@router.get("/villages/dynamic", response_model=DynamicVillageListResponse)
def get_dynamic_villages():
    """
    Returns villages with their latest dynamic risk score, active weather readings,
    and relocation recommendation status.
    """
    try:
        state = get_dynamic_state()
        villages_data = state.get('villages', [])

        if not villages_data:
            # No sync has run yet — trigger one
            state = recalculate_all_villages_dynamic()
            villages_data = state.get('villages', [])

        dynamic_villages = []
        for v in villages_data:
            try:
                dv = DynamicVillage.model_validate(v)
                dynamic_villages.append(dv)
            except Exception as e:
                logger.warning(f"Skipping village {v.get('name', '?')}: {e}")
                continue

        return DynamicVillageListResponse(
            villages=dynamic_villages,
            last_sync=state.get('last_sync_timestamp'),
            critical_count=state.get('critical_count', 0),
            sync_source='dynamic'
        )
    except Exception as exc:
        logger.error(f"Dynamic villages fetch failed: {exc}", exc_info=True)
        return DynamicVillageListResponse(
            villages=[],
            last_sync=None,
            critical_count=0,
            sync_source='fallback'
        )