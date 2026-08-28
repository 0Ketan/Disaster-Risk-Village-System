import apiClient from './client.js';

// Comprehensive fallback dataset adhering to GEMINI.md resilient fallback mandate
export const FALLBACK_VILLAGES = [
  {
    id: 1,
    name: "Ukhimath",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.4934,
    longitude: 79.0547,
    population: 2100,
    slope_degrees: 35,
    slope_score: 7.0,
    annual_rainfall_mm: 2800,
    rainfall_score: 8.0,
    past_landslides: 4,
    landslide_score: 8.0,
    flood_risk_index: 8,
    flood_score: 8.0,
    road_access_score: 3,
    road_score: 7.0,
    risk_score: 87.5,
    risk_level: "Critical",
    priority: "Immediate",
    _source: "fallback"
  },
  {
    id: 2,
    name: "Kedarnath",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.7352,
    longitude: 79.0669,
    population: 600,
    slope_degrees: 42,
    slope_score: 8.4,
    annual_rainfall_mm: 3100,
    rainfall_score: 9.0,
    past_landslides: 5,
    landslide_score: 10.0,
    flood_risk_index: 9,
    flood_score: 9.0,
    road_access_score: 1,
    road_score: 9.0,
    risk_score: 95.0,
    risk_level: "Critical",
    priority: "Immediate",
    _source: "fallback"
  },
  {
    id: 3,
    name: "Gaurikund",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.5833,
    longitude: 79.0333,
    population: 1400,
    slope_degrees: 38,
    slope_score: 7.6,
    annual_rainfall_mm: 2950,
    rainfall_score: 8.5,
    past_landslides: 4,
    landslide_score: 8.0,
    flood_risk_index: 8,
    flood_score: 8.0,
    road_access_score: 2,
    road_score: 8.0,
    risk_score: 91.0,
    risk_level: "Critical",
    priority: "Immediate",
    _source: "fallback"
  },
  {
    id: 4,
    name: "Phata",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.5400,
    longitude: 79.0300,
    population: 1850,
    slope_degrees: 28,
    slope_score: 5.6,
    annual_rainfall_mm: 2400,
    rainfall_score: 7.0,
    past_landslides: 3,
    landslide_score: 6.0,
    flood_risk_index: 6,
    flood_score: 6.0,
    road_access_score: 4,
    road_score: 6.0,
    risk_score: 72.0,
    risk_level: "High",
    priority: "Short-term",
    _source: "fallback"
  },
  {
    id: 5,
    name: "Sonprayag",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.6300,
    longitude: 78.9900,
    population: 1200,
    slope_degrees: 36,
    slope_score: 7.2,
    annual_rainfall_mm: 2900,
    rainfall_score: 8.5,
    past_landslides: 4,
    landslide_score: 8.0,
    flood_risk_index: 9,
    flood_score: 9.0,
    road_access_score: 3,
    road_score: 7.0,
    risk_score: 88.0,
    risk_level: "Critical",
    priority: "Immediate",
    _source: "fallback"
  },
  {
    id: 6,
    name: "Guptkashi",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.5267,
    longitude: 79.0743,
    population: 3800,
    slope_degrees: 16,
    slope_score: 3.2,
    annual_rainfall_mm: 1900,
    rainfall_score: 5.0,
    past_landslides: 1,
    landslide_score: 2.0,
    flood_risk_index: 3,
    flood_score: 3.0,
    road_access_score: 8,
    road_score: 2.0,
    risk_score: 35.0,
    risk_level: "Moderate",
    priority: "Medium-term",
    _source: "fallback"
  },
  {
    id: 7,
    name: "Agastyamuni",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.3920,
    longitude: 78.9850,
    population: 5200,
    slope_degrees: 12,
    slope_score: 2.4,
    annual_rainfall_mm: 1750,
    rainfall_score: 4.5,
    past_landslides: 0,
    landslide_score: 0.0,
    flood_risk_index: 4,
    flood_score: 4.0,
    road_access_score: 7,
    road_score: 3.0,
    risk_score: 28.0,
    risk_level: "Low",
    priority: "Monitor",
    _source: "fallback"
  },
  {
    id: 8,
    name: "Rudraprayag Town",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.2844,
    longitude: 78.9811,
    population: 9300,
    slope_degrees: 10,
    slope_score: 2.0,
    annual_rainfall_mm: 1600,
    rainfall_score: 4.0,
    past_landslides: 0,
    landslide_score: 0.0,
    flood_risk_index: 3,
    flood_score: 3.0,
    road_access_score: 9,
    road_score: 1.0,
    risk_score: 22.0,
    risk_level: "Low",
    priority: "Monitor",
    _source: "fallback"
  },
  {
    id: 9,
    name: "Tilwara",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.3450,
    longitude: 78.9720,
    population: 2400,
    slope_degrees: 14,
    slope_score: 2.8,
    annual_rainfall_mm: 1800,
    rainfall_score: 4.8,
    past_landslides: 1,
    landslide_score: 2.0,
    flood_risk_index: 5,
    flood_score: 5.0,
    road_access_score: 7,
    road_score: 3.0,
    risk_score: 38.0,
    risk_level: "Moderate",
    priority: "Medium-term",
    _source: "fallback"
  },
  {
    id: 10,
    name: "Chandrapuri",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.4280,
    longitude: 79.0150,
    population: 1700,
    slope_degrees: 26,
    slope_score: 5.2,
    annual_rainfall_mm: 2250,
    rainfall_score: 6.5,
    past_landslides: 2,
    landslide_score: 4.0,
    flood_risk_index: 7,
    flood_score: 7.0,
    road_access_score: 5,
    road_score: 5.0,
    risk_score: 65.0,
    risk_level: "High",
    priority: "Short-term",
    _source: "fallback"
  },
  {
    id: 11,
    name: "Syalsaur",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.4560,
    longitude: 79.0340,
    population: 1100,
    slope_degrees: 20,
    slope_score: 4.0,
    annual_rainfall_mm: 2100,
    rainfall_score: 6.0,
    past_landslides: 1,
    landslide_score: 2.0,
    flood_risk_index: 5,
    flood_score: 5.0,
    road_access_score: 6,
    road_score: 4.0,
    risk_score: 48.0,
    risk_level: "Moderate",
    priority: "Medium-term",
    _source: "fallback"
  },
  {
    id: 12,
    name: "Kalimath",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.5670,
    longitude: 79.0980,
    population: 1600,
    slope_degrees: 33,
    slope_score: 6.6,
    annual_rainfall_mm: 2600,
    rainfall_score: 7.5,
    past_landslides: 3,
    landslide_score: 6.0,
    flood_risk_index: 6,
    flood_score: 6.0,
    road_access_score: 3,
    road_score: 7.0,
    risk_score: 78.0,
    risk_level: "High",
    priority: "Short-term",
    _source: "fallback"
  },
  {
    id: 13,
    name: "Mansuna",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.5120,
    longitude: 79.1100,
    population: 2150,
    slope_degrees: 30,
    slope_score: 6.0,
    annual_rainfall_mm: 2500,
    rainfall_score: 7.2,
    past_landslides: 3,
    landslide_score: 6.0,
    flood_risk_index: 5,
    flood_score: 5.0,
    road_access_score: 4,
    road_score: 6.0,
    risk_score: 71.0,
    risk_level: "High",
    priority: "Short-term",
    _source: "fallback"
  },
  {
    id: 14,
    name: "Ransi",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.5560,
    longitude: 79.1430,
    population: 950,
    slope_degrees: 37,
    slope_score: 7.4,
    annual_rainfall_mm: 2850,
    rainfall_score: 8.2,
    past_landslides: 4,
    landslide_score: 8.0,
    flood_risk_index: 7,
    flood_score: 7.0,
    road_access_score: 2,
    road_score: 8.0,
    risk_score: 89.0,
    risk_level: "Critical",
    priority: "Immediate",
    _source: "fallback"
  },
  {
    id: 15,
    name: "Triyuginarayan",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.6410,
    longitude: 78.9770,
    population: 1350,
    slope_degrees: 24,
    slope_score: 4.8,
    annual_rainfall_mm: 2200,
    rainfall_score: 6.2,
    past_landslides: 1,
    landslide_score: 2.0,
    flood_risk_index: 4,
    flood_score: 4.0,
    road_access_score: 5,
    road_score: 5.0,
    risk_score: 55.0,
    risk_level: "Moderate",
    priority: "Medium-term",
    _source: "fallback"
  },
  {
    id: 16,
    name: "Sari",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.5050,
    longitude: 79.1300,
    population: 850,
    slope_degrees: 31,
    slope_score: 6.2,
    annual_rainfall_mm: 2550,
    rainfall_score: 7.4,
    past_landslides: 3,
    landslide_score: 6.0,
    flood_risk_index: 5,
    flood_score: 5.0,
    road_access_score: 3,
    road_score: 7.0,
    risk_score: 74.0,
    risk_level: "High",
    priority: "Short-term",
    _source: "fallback"
  },
  {
    id: 17,
    name: "Chopta",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.4850,
    longitude: 79.1760,
    population: 450,
    slope_degrees: 22,
    slope_score: 4.4,
    annual_rainfall_mm: 2300,
    rainfall_score: 6.6,
    past_landslides: 1,
    landslide_score: 2.0,
    flood_risk_index: 3,
    flood_score: 3.0,
    road_access_score: 6,
    road_score: 4.0,
    risk_score: 50.0,
    risk_level: "Moderate",
    priority: "Medium-term",
    _source: "fallback"
  },
  {
    id: 18,
    name: "Sumari",
    district: "Rudraprayag",
    state: "Uttarakhand",
    latitude: 30.2500,
    longitude: 78.8500,
    population: 3100,
    slope_degrees: 8,
    slope_score: 1.6,
    annual_rainfall_mm: 1500,
    rainfall_score: 3.5,
    past_landslides: 0,
    landslide_score: 0.0,
    flood_risk_index: 2,
    flood_score: 2.0,
    road_access_score: 8,
    road_score: 2.0,
    risk_score: 18.0,
    risk_level: "Low",
    priority: "Monitor",
    _source: "fallback"
  }
];

export const FALLBACK_RELOCATION_SITES = [
  {
    id: 1,
    name: "Guptkashi Safe Enclave",
    district: "Rudraprayag",
    distance_km: 7.2,
    total_capacity: 5000,
    available_capacity: 3800,
    overall_score: 92.5,
    explanation: "Secure elevated plateau outside active landslide corridors with high road connectivity and primary healthcare center within 3 km.",
    score_breakdown: {
      safety: 92,
      capacity: 85,
      road: 88,
      water: 90,
      healthcare: 82,
      distance: 85
    },
    _source: "fallback"
  },
  {
    id: 2,
    name: "Agastyamuni Relief Center",
    district: "Rudraprayag",
    distance_km: 14.5,
    total_capacity: 9000,
    available_capacity: 4800,
    overall_score: 88.0,
    explanation: "Broad river valley terrace with established emergency supply lines, all-weather helipad, and municipal potable water storage.",
    score_breakdown: {
      safety: 88,
      capacity: 90,
      road: 92,
      water: 85,
      healthcare: 88,
      distance: 75
    },
    _source: "fallback"
  },
  {
    id: 3,
    name: "Gauchar Safe Shelter",
    district: "Chamoli",
    distance_km: 22.1,
    total_capacity: 8000,
    available_capacity: 4600,
    overall_score: 84.5,
    explanation: "Strategic staging area with airstrip access, gentle terrain gradient (<8°), and comprehensive multi-hazard emergency shelter infrastructure.",
    score_breakdown: {
      safety: 94,
      capacity: 82,
      road: 85,
      water: 80,
      healthcare: 78,
      distance: 65
    },
    _source: "fallback"
  }
];

/**
 * Fetch all villages from backend or fallback gracefully
 */
export async function getVillages() {
  try {
    const response = await apiClient.get('/api/villages');
    if (response.data && Array.isArray(response.data.villages)) {
      return {
        villages: response.data.villages,
        _source: response.data._source || 'live'
      };
    }
    throw new Error('Invalid response structure from /api/villages');
  } catch (err) {
    console.warn('Using fallback villages data due to API error:', err.message);
    return {
      villages: FALLBACK_VILLAGES,
      _source: 'fallback'
    };
  }
}

/**
 * Fetch a single village by ID
 */
export async function getVillageById(id) {
  try {
    const response = await apiClient.get(`/api/villages/${id}`);
    if (response.data && response.data.village) {
      return {
        village: response.data.village,
        _source: response.data._source || response.data.village._source || 'live'
      };
    }
    throw new Error(`Village ${id} not found in live API`);
  } catch (err) {
    console.warn(`Using fallback for village ID ${id}:`, err.message);
    const found = FALLBACK_VILLAGES.find(v => Number(v.id) === Number(id)) || FALLBACK_VILLAGES[0];
    return {
      village: found,
      _source: 'fallback'
    };
  }
}

/**
 * Fetch safe relocation recommendations for a village
 */
export async function getRelocationSites(villageId) {
  try {
    const response = await apiClient.get(`/api/villages/${villageId}/relocation`);
    if (response.data && Array.isArray(response.data.sites)) {
      return {
        village_id: response.data.village_id || villageId,
        village_name: response.data.village_name || 'Village',
        risk_score: response.data.risk_score,
        relocation_required: response.data.relocation_required !== undefined ? response.data.relocation_required : true,
        sites: response.data.sites,
        _source: response.data._source || 'live'
      };
    }
    throw new Error('Invalid response structure from relocation API');
  } catch (err) {
    console.warn(`Using fallback relocation sites for village ${villageId}:`, err.message);
    const village = FALLBACK_VILLAGES.find(v => Number(v.id) === Number(villageId));
    return {
      village_id: villageId,
      village_name: village ? village.name : 'Unknown Village',
      risk_score: village ? village.risk_score : 85.0,
      relocation_required: village ? (village.risk_score >= 70) : true,
      sites: FALLBACK_RELOCATION_SITES,
      _source: 'fallback'
    };
  }
}

/**
 * Fetch dashboard summary statistics
 */
export async function getDashboardSummary() {
  try {
    const response = await apiClient.get('/api/dashboard/summary');
    if (response.data && response.data.total_villages !== undefined) {
      return {
        ...response.data,
        _source: response.data._source || 'live'
      };
    }
    // Check if older /api/dashboard endpoint format is used
    const altResponse = await apiClient.get('/api/dashboard');
    if (altResponse.data && Array.isArray(altResponse.data.priority_list)) {
      const list = altResponse.data.priority_list;
      const critical = list.filter(v => v.risk_level === 'Critical').length;
      const high = list.filter(v => v.risk_level === 'High').length;
      const moderate = list.filter(v => v.risk_level === 'Moderate').length;
      const low = list.filter(v => v.risk_level === 'Low').length;
      const popAtRisk = list.reduce((sum, v) => sum + (v.population || 0), 0);
      return {
        total_villages: list.length,
        critical_villages: critical,
        high_risk_villages: high,
        total_population_at_risk: popAtRisk,
        relocations_needed_count: list.filter(v => v.risk_score >= 70).length,
        risk_distribution: { critical, high, moderate, low },
        api_health: { opentopodata: "live", openweathermap: "live", meteostat: "live" },
        _source: 'live'
      };
    }
    throw new Error('Invalid dashboard summary format');
  } catch (err) {
    console.warn('Using fallback dashboard summary:', err.message);
    const critical = FALLBACK_VILLAGES.filter(v => v.risk_level === 'Critical').length;
    const high = FALLBACK_VILLAGES.filter(v => v.risk_level === 'High').length;
    const moderate = FALLBACK_VILLAGES.filter(v => v.risk_level === 'Moderate').length;
    const low = FALLBACK_VILLAGES.filter(v => v.risk_level === 'Low').length;
    const totalPop = FALLBACK_VILLAGES.reduce((sum, v) => sum + (v.population || 0), 0);
    return {
      total_villages: FALLBACK_VILLAGES.length,
      critical_villages: critical,
      high_risk_villages: high,
      total_population_at_risk: totalPop,
      relocations_needed_count: FALLBACK_VILLAGES.filter(v => v.risk_score >= 70).length,
      risk_distribution: { critical, high, moderate, low },
      api_health: { opentopodata: "fallback", openweathermap: "fallback", meteostat: "fallback" },
      _source: 'fallback'
    };
  }
}
