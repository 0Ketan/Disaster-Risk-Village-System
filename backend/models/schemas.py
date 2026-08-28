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
    elevation_m: Optional[float] = None
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: str  # "Critical" | "High" | "Moderate" | "Low"
    priority: str    # "Immediate" | "Short-term" | "Medium-term" | "Monitor"
    score_breakdown: ScoreBreakdown
    relocation_required: bool = False
    _source: str = "live"  # "live" | "fallback"

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


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
    healthcare_score: float = Field(..., ge=0.0, le=10.0)
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



