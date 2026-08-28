import React from 'react';
import { Mountain, CloudRain, AlertTriangle, Waves, Compass, HelpCircle } from 'lucide-react';

/**
 * FactorBreakdown Component
 * Displays visual progress bars for the 5 hazard scoring factors:
 * 1. Terrain Slope (Degrees)
 * 2. Rainfall Intensity (mm/year)
 * 3. Past Landslide History (Incidents)
 * 4. Flood Exposure Index (1-10)
 * 5. Road Access & Isolation (Index 1-10)
 */
export const FactorBreakdown = ({ village }) => {
  if (!village) return null;

  // Extract raw and normalized score values
  const factors = [
    {
      id: 'slope',
      label: 'Terrain Slope',
      icon: Mountain,
      rawValue: village.slope_degrees !== undefined ? `${village.slope_degrees}°` : 'N/A',
      score: village.slope_score !== undefined ? village.slope_score : (village.slope_degrees ? (village.slope_degrees / 45) * 10 : 5),
      weight: '25%',
      description: 'Steepness increases landslide and rockfall velocity'
    },
    {
      id: 'rainfall',
      label: 'Rainfall Intensity',
      icon: CloudRain,
      rawValue: village.annual_rainfall_mm !== undefined ? `${village.annual_rainfall_mm} mm` : 'N/A',
      score: village.rainfall_score !== undefined ? village.rainfall_score : (village.annual_rainfall_mm ? (village.annual_rainfall_mm / 3500) * 10 : 5),
      weight: '25%',
      description: 'Monsoon saturation triggers debris flows'
    },
    {
      id: 'landslides',
      label: 'Past Landslides',
      icon: AlertTriangle,
      rawValue: village.past_landslides !== undefined ? `${village.past_landslides} events` : '0 events',
      score: village.landslide_score !== undefined ? village.landslide_score : (village.past_landslides ? Math.min(10, village.past_landslides * 2) : 0),
      weight: '20%',
      description: 'Historical soil instability and active slide scars'
    },
    {
      id: 'flood',
      label: 'Flood Exposure',
      icon: Waves,
      rawValue: village.flood_risk_index !== undefined ? `${village.flood_risk_index} / 10` : 'N/A',
      score: village.flood_score !== undefined ? village.flood_score : (village.flood_risk_index || 5),
      weight: '20%',
      description: 'Proximity to glacial runoff & flash-flood basins'
    },
    {
      id: 'road',
      label: 'Road Access & Isolation',
      icon: Compass,
      rawValue: village.road_access_score !== undefined ? `${village.road_access_score} / 10` : 'N/A',
      score: village.road_score !== undefined ? village.road_score : (10 - (village.road_access_score || 5)),
      weight: '10%',
      description: 'Vulnerability due to single-access road cutoffs'
    }
  ];

  const getBarColor = (score) => {
    const s = Number(score);
    if (s >= 7.5) return 'bg-rose-500';
    if (s >= 5.0) return 'bg-orange-500';
    if (s >= 3.0) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getScoreTextColor = (score) => {
    const s = Number(score);
    if (s >= 7.5) return 'text-rose-600 font-bold';
    if (s >= 5.0) return 'text-orange-600 font-bold';
    if (s >= 3.0) return 'text-amber-600 font-semibold';
    return 'text-emerald-600 font-semibold';
  };

  return (
    <div className="bg-surface-lowest rounded-xl border border-outline-variant/60 overflow-hidden shadow-xs">
      <div className="px-4 py-3 bg-surface-low border-b border-outline-variant/60 flex items-center justify-between">
        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Multi-Factor Hazard Breakdown
        </span>
        <span className="text-[10px] text-on-surface-variant font-medium">
          5 Weighted Criteria
        </span>
      </div>

      <div className="p-4 space-y-4">
        {factors.map((f) => {
          const Icon = f.icon;
          const normalizedScore = Math.max(0, Math.min(10, Number(f.score) || 0));
          const percent = Math.round((normalizedScore / 10) * 100);

          return (
            <div key={f.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-surface-container flex items-center justify-center text-primary">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">{f.label}</span>
                    <span className="text-[10px] text-on-surface-variant ml-1.5">({f.rawValue})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-on-surface-variant bg-surface px-1.5 py-0.5 rounded border border-outline-variant/40">
                    wt: {f.weight}
                  </span>
                  <span className={`text-xs ${getScoreTextColor(f.score)}`}>
                    {percent}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(f.score)}`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="text-[10px] text-on-surface-variant/80 pl-7">
                {f.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FactorBreakdown;
