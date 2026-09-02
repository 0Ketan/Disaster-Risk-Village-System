from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any


class ScoreBreakdown(BaseModel):
    slope_score: float = Field(..., ge=0.0, le=10.0, description="Normalized slope factor score (0-10)")
    rainfall_score: float = Field(..., ge=0.0, le=10.0, description="Normalized rainfall factor score (0-10)")
    landslide_score: float = Field(..., ge=0.0, le=10.0, description="Normalized landslide factor score (0-10)")
    flood_score: float = Field(..., ge=0.0, le=10.0, description="Normalized flood risk factor score (0-10)")
    road_score: float = Field(..., ge=0.0, le=10.0, description="Normalized road isolation score (0-10)")


    model_config = ConfigDict(from_attributes=True)


class Village(BaseModel):
    id: int
    name: str
    district: str
    state: str = "Uttarakhand"
    latitude: float
    longitude: float
    population: int = Field(..., ge=0)
    slope_degrees: float = Field(..., ge=0)
    annual_rainfall_mm: float = Field(..., ge=0)
    past_landslides: int = Field(..., ge=0)
    flood_risk_index: float = Field(..., ge=0)
    road_access_score: float = Field(..., ge=0, le=10)
    vulnerability_index: float = 5.0
    elevation_m: Optional[float] = None
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: str  # "Critical" | "High" | "Moderate" | "Low"
    priority: str    # "Immediate" | "Short-term" | "Medium-term" | "Monitor"
    relocation_required: bool = False
    score_breakdown: ScoreBreakdown
    # Additional fields from risk_engine output
    vulnerability_score: float = Field(ge=0.0, le=10.0, default=5.0)
    landslide_zone: str = Field(default="Green")  # "Red" | "Orange" | "Green"
    flood_zone: str = Field(default="Green")      # "Red" | "Orange" | "Green"
    cloudburst_zone: str = Field(default="Green") # "Red" | "Orange" | "Green"
    coastal_erosion_zone: str = Field(default="Green") # "Red" | "Orange" | "Green"
    composite_hazard_label: str = Field(default="Low Multi-Hazard Exposure")
    hazard_zones: Optional[Dict[str, str]] = None
    # Dynamic weather fields
    live_rainfall_mm: Optional[float] = None
    rainfall_source: Optional[str] = None
    weather_timestamp: Optional[str] = None
    dynamic_risk_score: Optional[float] = None
    dynamic_modifier_applied: bool = False
    dynamic_zone: Optional[str] = None  # "Red" | "Orange" | "Green" after live rain
    relocation_precomputed: Optional[Any] = None
    _source: Optional[str] = None  # "live" | "fallback"

    model_config = ConfigDict(from_attributes=True, populate_by_name=True, extra='allow')


class RelocationSiteBreakdown(BaseModel):
    safety: float = Field(..., ge=0.0, le=100.0)
    capacity: float = Field(..., ge=0.0, le=100.0)
    road: float = Field(..., ge=0.0, le=100.0)
    water: float = Field(..., ge=0.0, le=100.0)
    healthcare: float = Field(..., ge=0.0, le=100.0)
    distance: float = Field(..., ge=0.0, le=100.0)

    model_config = ConfigDict(from_attributes=True)


class RelocationSite(BaseModel):
    id: int
    name: str
    district: str
    latitude: float
    longitude: float
    total_capacity: int = Field(..., ge=0)
    current_population: int = Field(..., ge=0)
    available_capacity: int = Field(..., ge=0)
    safety_score: float = Field(..., ge=0.0, le=100.0)
    road_connectivity_score: float = Field(..., ge=0.0, le=10.0)
    water_availability_score: float = Field(..., ge=0.0, le=10.0)
    healthcare_score: float = Field(..., ge=0.0, le=100.0)
    distance_km: float = Field(..., ge=0.0)
    overall_score: float = Field(..., ge=0.0, le=100.0)
    score_breakdown: RelocationSiteBreakdown
    explanation: str

    model_config = ConfigDict(from_attributes=True)


class APIHealthItem(BaseModel):
    service: str
    status: str  # "healthy" | "degraded" | "offline"
    mode: str    # "live" | "fallback"
    latency_ms: Optional[float] = None
    message: str

    model_config = ConfigDict(from_attributes=True)


class SystemHealthResponse(BaseModel):
    status: str
    timestamp: str
    services: List[APIHealthItem]

    model_config = ConfigDict(from_attributes=True)


class RiskDistribution(BaseModel):
    critical: int = 0
    high: int = 0
    moderate: int = 0
    low: int = 0

    model_config = ConfigDict(from_attributes=True)


class DashboardSummaryResponse(BaseModel):
    total_villages: int
    high_risk_villages: int
    critical_villages: int
    total_population_at_risk: int
    relocations_needed_count: int
    risk_distribution: RiskDistribution
    api_health: Dict[str, str]
    _source: str = "live"

    model_config = ConfigDict(from_attributes=True)


class VillageListResponse(BaseModel):
    villages: List[Village]
    _source: str = "live"

    model_config = ConfigDict(from_attributes=True)


class VillageDetailResponse(BaseModel):
    village: Village
    _source: str = "live"

    model_config = ConfigDict(from_attributes=True)


class RelocationResponse(BaseModel):
    village_id: int
    village_name: str
    risk_score: float
    relocation_required: bool
    sites: List[RelocationSite]
    _source: str = "live"

    model_config = ConfigDict(from_attributes=True)


class DashboardPriorityItem(BaseModel):
    id: int
    name: str
    district: str
    population: int
    risk_score: float
    risk_level: str
    priority: str

    model_config = ConfigDict(from_attributes=True)


class DashboardPriorityResponse(BaseModel):
    priority_list: List[DashboardPriorityItem]

    model_config = ConfigDict(from_attributes=True)


class DynamicVillage(Village):
    """Village enriched with live weather and dynamic risk data."""
    live_rainfall_mm: Optional[float] = None
    rainfall_source: Optional[str] = None
    weather_timestamp: Optional[str] = None
    dynamic_risk_score: Optional[float] = None
    dynamic_modifier_applied: bool = False
    relocation_precomputed: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class DynamicVillageListResponse(BaseModel):
    villages: List[DynamicVillage]
    last_sync: Optional[str] = None
    critical_count: int = 0
    sync_source: str = "dynamic"

    model_config = ConfigDict(from_attributes=True)


class SyncWeatherResponse(BaseModel):
    status: str  # "success" | "partial" | "fallback"
    sync_timestamp: str
    villages_updated: int
    critical_villages: int
    red_zone_villages: List[Dict[str, Any]] = []
    api_sources: Dict[str, str] = {}
    message: str = "Sync completed"

    model_config = ConfigDict(from_attributes=True)


class SyncStatusResponse(BaseModel):
    last_sync_timestamp: Optional[str] = None
    sync_age_minutes: Optional[float] = None
    is_stale: bool = True
    critical_village_count: int = 0
    total_synced_villages: int = 0
    weather_api_status: str = "fallback"  # "live" | "fallback"
    api_health: Dict[str, str] = {}
    status: str = "unknown"

    model_config = ConfigDict(from_attributes=True)