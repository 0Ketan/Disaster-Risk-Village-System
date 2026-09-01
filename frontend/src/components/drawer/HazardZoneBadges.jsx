import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * HazardZoneBadges Component
 * Displays individual hazard classifications (Landslide, Flood, Cloudburst).
 */
export const HazardZoneBadges = ({ village }) => {
  if (!village) return null;

  const zones = village.hazard_zones || {};
  const landslide = zones.landslide || 'Unknown';
  const flood = zones.flood || 'Unknown';
  const cloudburst = zones.cloudburst || 'Unknown';

  const getBadgeColor = (zone) => {
    switch (zone) {
      case 'Red': return 'bg-red-500 text-white border-red-600';
      case 'Orange': return 'bg-orange-500 text-white border-orange-600';
      case 'Green': return 'bg-green-500 text-white border-green-600';
      default: return 'bg-slate-300 text-slate-800 border-slate-400';
    }
  };

  return (
    <div className="bg-surface-lowest rounded-xl border border-outline-variant/60 overflow-hidden shadow-xs">
      <div className="px-4 py-3 bg-surface-low border-b border-outline-variant/60 flex items-center justify-between">
        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Hazard Zone Classification
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base" role="img" aria-label="Landslide">🌋</span>
            <span className="text-xs font-semibold text-on-surface">Landslide</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getBadgeColor(landslide)}`}>
            {landslide === 'Unknown' ? 'Unknown' : `${landslide} Zone`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base" role="img" aria-label="Flood">🌊</span>
            <span className="text-xs font-semibold text-on-surface">Flood</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getBadgeColor(flood)}`}>
            {flood === 'Unknown' ? 'Unknown' : `${flood} Zone`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base" role="img" aria-label="Cloudburst">⛈️</span>
            <span className="text-xs font-semibold text-on-surface">Cloudburst</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getBadgeColor(cloudburst)}`}>
            {cloudburst === 'Unknown' ? 'Unknown' : `${cloudburst} Zone`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base" role="img" aria-label="Coastal Erosion">🏖️</span>
            <span className="text-xs font-semibold text-on-surface">Coastal Erosion</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getBadgeColor(zones.coastal_erosion)}`}>
            {zones.coastal_erosion ? `${zones.coastal_erosion} Zone` : 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HazardZoneBadges;
