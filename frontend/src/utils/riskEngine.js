import { fetchLiveCoastalConditions } from '../services/liveMarineAPI';

const MAX_EROSION_AREA = 4494576.08; // Satabhaya's area as the 100% baseline

export const fetchLiveElevation = async (lat, lng) => {
  try {
    const res = await fetch(`https://api.opentopodata.org/v1/test-dataset?locations=${lat},${lng}`);
    const data = await res.json();
    return data?.results?.[0]?.elevation || 5; // fallback to 5m if error
  } catch (err) {
    console.warn("Elevation fetch failed, using fallback", err);
    return 5;
  }
};

export const calculateCoastalRisk = async (village, liveConditions = null) => {
  // 1. Historical Baseline Factor (30%) - normalized from CSV erosion area
  const area = village.erosion_area_sq_m || 0;
  const baseRisk = Math.min(100, (area / MAX_EROSION_AREA) * 100);
  const baselineScore = baseRisk * 0.30;

  // 2. Sea Level Rise & Inundation Factor (20%) - Factoring local coastal elevation trends
  const elevation = await fetchLiveElevation(village.latitude, village.longitude);
  const elevRisk = Math.max(0, Math.min(100, 100 - (elevation * 10)));
  const slrScore = elevRisk * 0.20;

  // 3. Mitigation Decay Factor (10%) - Account for degrading protections
  let mitigationRisk = 50; // default medium decay
  const mitigationStr = (village.mitigation_status || "").toLowerCase();
  if (mitigationStr.includes("relocated") || mitigationStr.includes("no active")) {
    mitigationRisk = 100; // no mitigation, full risk
  } else if (mitigationStr.includes("geo-synthetic") || mitigationStr.includes("sea wall")) {
    mitigationRisk = 80; // degrading over time
  } else if (mitigationStr.includes("mangrove")) {
    mitigationRisk = 30; // natural protection is more resilient
  }
  const mitigationScore = mitigationRisk * 0.10;

  let conditions = liveConditions;
  if (!conditions) {
    try {
      conditions = await fetchLiveCoastalConditions(village.latitude, village.longitude);
    } catch (err) {
      console.warn("Live marine fetch failed, using fallbacks", err);
    }
  }

  let waveHeight = 0;
  let swellHeight = 0;
  let windSpeed = 0;
  let rainfall = 0;

  let maxForecastWave = 0;
  let maxForecastSwell = 0;
  let forecastRiskScore = 0;

  if (conditions) {
    if (conditions.nowcast) {
      waveHeight = conditions.nowcast.wave_height || 0;
      swellHeight = conditions.nowcast.swell_wave_height || 0;
      windSpeed = conditions.nowcast.wind_speed_10m || 0;
      rainfall = conditions.nowcast.rain || conditions.nowcast.precipitation || 0;
    }

    if (conditions.forecast && conditions.forecast.wave_height) {
      // 4. Live 7-Day Marine Wave Forecast (40%)
      const waves = conditions.forecast.wave_height.filter(n => !isNaN(n) && n !== null);
      const swells = conditions.forecast.swell_wave_height.filter(n => !isNaN(n) && n !== null);
      maxForecastWave = waves.length ? Math.max(...waves) : 0;
      maxForecastSwell = swells.length ? Math.max(...swells) : 0;

      const combinedForecastWave = maxForecastWave + (maxForecastSwell * 0.5);
      const forecastRisk = Math.min(100, (combinedForecastWave / 6) * 100);
      forecastRiskScore = forecastRisk * 0.40;
    }
  }

  // Final Composite Score (Projected)
  const totalScore = Math.round(baselineScore + forecastRiskScore + slrScore + mitigationScore);
  
  let riskLevel = "Low";
  let hazardZone = "Green";
  if (totalScore >= 81) {
    riskLevel = "Critical";
    hazardZone = "Red";
  } else if (totalScore >= 61) {
    riskLevel = "High";
    hazardZone = "Orange";
  } else if (totalScore >= 31) {
    riskLevel = "Moderate";
    hazardZone = "Yellow";
  }

  // Estimate annual shoreline retreat based on score
  const retreatRate = ((totalScore / 100) * 15).toFixed(1); // up to 15m/yr

  return {
    risk_score: totalScore,
    risk_level: riskLevel,
    hazard_zones: {
      coastal_erosion: hazardZone,
      landslide: "Green",
      flood: "Green",
      cloudburst: "Green"
    },
    live_elevation_m: Math.round(elevation * 10) / 10,
    live_rainfall_mm: rainfall,
    live_wave_height: waveHeight,
    live_swell_height: swellHeight,
    live_wind_speed: windSpeed,
    max_forecast_wave: maxForecastWave,
    max_forecast_swell: maxForecastSwell,
    projected_retreat_m_yr: retreatRate,
    historical_baseline_score: Math.round(baseRisk), // for comparison
    live_conditions: conditions, 
    score_breakdown: {
      baselineScore,
      forecastRiskScore,
      slrScore,
      mitigationScore
    }
  };
};
