import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Known inland regions where coastal erosion is not applicable.
 */
const INLAND_STATES = new Set([
  'uttarakhand', 'himachal pradesh', 'ladakh', 'jammu and kashmir',
  'sikkim', 'meghalaya', 'mizoram', 'nagaland', 'manipur', 'tripura',
  'chhattisgarh', 'jharkhand', 'madhya pradesh',
]);

const INLAND_DISTRICTS = new Set([
  'wayanad', 'idukki', 'darjeeling', 'rudraprayag', 'chamoli',
  'tehri garhwal', 'pauri garhwal', 'pithoragarh', 'bageshwar',
  'almora', 'nainital', 'champawat', 'udham singh nagar',
  'kalimpong', 'jalpaiguri',
]);

function isCoastalVillage(village) {
  const dist = village.distance_to_coast_km;
  if (dist !== undefined && dist !== null) {
    return parseFloat(dist) < 50.0;
  }
  const state = (village.state || '').trim().toLowerCase();
  const district = (village.district || '').trim().toLowerCase();
  if (INLAND_STATES.has(state)) return false;
  if (INLAND_DISTRICTS.has(district)) return false;
  return true;
}

/**
 * Computes hazard zone classifications from village factor scores,
 * replicating the backend risk_engine.py logic so zones render correctly
 * even when using cached/fallback data that lacks pre-computed hazard_zones.
 */
function computeHazardZones(village) {
  // Normalize factor scores (0-10 scale) from raw metrics if individual scores aren't present
  const slopeDeg = parseFloat(village.slope_degrees) || 0;
  const rainMm = parseFloat(village.annual_rainfall_mm) || 0;
  const pastLandslides = parseFloat(village.past_landslides) || 0;
  const floodIdx = parseFloat(village.flood_risk_index) || 0;
  const roadAccess = parseFloat(village.road_access_score) || 5;

  const slopeScore = Math.min(Math.max((slopeDeg / 45.0) * 10.0, 0), 10);
  const rainfallScore = Math.min(Math.max((rainMm / 3000.0) * 10.0, 0), 10);
  const landslideScore = Math.min(Math.max(pastLandslides * 2.0, 0), 10);
  const floodScore = Math.min(Math.max(floodIdx, 0), 10);
  const roadScore = 10.0 - Math.min(Math.max(roadAccess, 0), 10);

  // Subscore formulas from backend risk_engine.py
  const landslideSubscore = (slopeScore * 0.45 + landslideScore * 0.35 + rainfallScore * 0.20) * 10.0;
  const floodSubscore = (floodScore * 0.55 + rainfallScore * 0.45) * 10.0;

  let cloudburstBase = (rainfallScore * 0.70 + slopeScore * 0.15 + roadScore * 0.15) * 10.0;
  const cloudburstSubscore = Math.min(cloudburstBase + (rainMm >= 2800 ? 10.0 : 0.0), 100.0);

  // Coastal erosion: only for coastal villages
  const isCostal = isCoastalVillage(village);
  const coastalErosionSubscore = isCostal
    ? Math.min((floodScore * 0.60 + rainfallScore * 0.40) * 10.0, 100.0)
    : 0.0;

  const getZone = (score) => {
    if (score >= 75.0) return 'Red';
    if (score >= 50.0) return 'Orange';
    return 'Green';
  };

  return {
    landslide: getZone(landslideSubscore),
    flood: getZone(floodSubscore),
    cloudburst: getZone(cloudburstSubscore),
    coastal_erosion: isCostal ? getZone(coastalErosionSubscore) : 'N/A',
    _subscores: {
      landslide: Math.round(landslideSubscore * 10) / 10,
      flood: Math.round(floodSubscore * 10) / 10,
      cloudburst: Math.round(cloudburstSubscore * 10) / 10,
      coastal_erosion: Math.round(coastalErosionSubscore * 10) / 10,
    }
  };
}

/**
 * Determines whether pre-computed hazard_zones from the backend are meaningful
 * (not all-Green placeholder data).
 */
function hasRealHazardZones(zones) {
  if (!zones || typeof zones !== 'object') return false;
  const values = [zones.landslide, zones.flood, zones.cloudburst, zones.coastal_erosion];
  // If every zone is Green or missing, treat as placeholder
  return values.some(v => v && v !== 'Green');
}

/**
 * HazardZoneBadges Component
 * Displays individual hazard classifications (Landslide, Flood, Cloudburst, Coastal Erosion).
 * Computes zones client-side from factor scores when backend-provided zones are missing/placeholder.
 */
export const HazardZoneBadges = ({ village }) => {
  if (!village) return null;

  // Use backend-provided zones if they contain real data; otherwise compute from scores
  let zones;
  if (hasRealHazardZones(village.hazard_zones)) {
    zones = village.hazard_zones;
  } else {
    zones = computeHazardZones(village);
  }

  const landslide = zones.landslide || 'Green';
  const flood = zones.flood || 'Green';
  const cloudburst = zones.cloudburst || 'Green';
  const coastalErosion = zones.coastal_erosion || 'Green';

  const getBadgeColor = (zone) => {
    switch (zone) {
      case 'Red': return 'bg-red-500 text-white border-red-600';
      case 'Orange': return 'bg-orange-500 text-white border-orange-600';
      case 'Green': return 'bg-green-500 text-white border-green-600';
      case 'N/A': return 'bg-slate-400 text-white border-slate-500';
      default: return 'bg-slate-300 text-slate-800 border-slate-400';
    }
  };

  const getZoneLabel = (zone) => {
    if (zone === 'N/A') return 'N/A (Inland)';
    return `${zone} Zone`;
  };

  const hazards = [
    { key: 'landslide', label: 'Landslide', emoji: '🌋', zone: landslide },
    { key: 'flood', label: 'Flood', emoji: '🌊', zone: flood },
    { key: 'cloudburst', label: 'Cloudburst', emoji: '⛈️', zone: cloudburst },
    { key: 'coastal_erosion', label: 'Coastal Erosion', emoji: '🏖️', zone: coastalErosion },
  ];

  return (
    <div className="bg-surface-lowest rounded-xl border border-outline-variant/60 overflow-hidden shadow-xs">
      <div className="px-4 py-3 bg-surface-low border-b border-outline-variant/60 flex items-center justify-between">
        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Hazard Zone Classification
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {hazards.map(({ key, label, emoji, zone }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base" role="img" aria-label={label}>{emoji}</span>
              <span className="text-xs font-semibold text-on-surface">{label}</span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getBadgeColor(zone)}`}>
              {getZoneLabel(zone)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HazardZoneBadges;
