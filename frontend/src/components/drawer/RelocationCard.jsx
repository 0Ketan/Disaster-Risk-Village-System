import React from 'react';
import { Star, MapPin, Users, ShieldCheck, Navigation, Droplets, HeartPulse, Sparkles } from 'lucide-react';
import WarningBadge from '../common/WarningBadge';

/**
 * RelocationCard Component
 * Displays ranked safe relocation shelter site recommendation.
 */
export const RelocationCard = ({ site, rank = 0 }) => {
  if (!site) return null;

  const isRecommended = rank === 0;
  const score = Math.round(site.overall_score || 85);
  const breakdown = site.score_breakdown || {};
  const isFallback = site._source === 'fallback';

  return (
    <div 
      className={`rounded-xl p-4 transition-all relative border ${
        isRecommended 
          ? 'bg-emerald-50/40 border-emerald-300 shadow-sm ring-1 ring-emerald-200' 
          : 'bg-surface-lowest border-outline-variant/60 shadow-2xs hover:border-outline-variant'
      }`}
      data-testid="relocation-card"
    >
      {/* Top Header with Recommended Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-on-surface">
              {site.name}
            </h4>
          </div>
          <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-on-surface-variant/70" />
            <span>{site.district || 'Safe Zone'}</span>
            <span>•</span>
            <span className="font-medium text-emerald-700">{site.distance_km || 0} km away</span>
          </div>
        </div>

        {/* Overall Suitability Score */}
        <div className="flex flex-col items-end flex-shrink-0">
          <div className="text-sm font-black text-emerald-700">
            {score}<span className="text-[10px] font-normal text-on-surface-variant">/100</span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
            Suitability
          </span>
        </div>
      </div>

      {/* Algorithmic Narrative Explanation */}
      {site.explanation && (
        <div className="my-2.5 p-2.5 rounded-lg bg-surface border border-outline-variant/40 text-[11px] text-on-surface leading-relaxed flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{site.explanation}</span>
        </div>
      )}

      {/* 6-Factor Radar/Grid Breakdown */}
      <div className="grid grid-cols-3 gap-1.5 my-2.5 p-2 rounded-lg bg-surface-low border border-outline-variant/30 text-[10px]">
        <div className="flex items-center gap-1.5 p-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <div>
            <div className="text-on-surface-variant text-[9px]">Safety</div>
            <div className="font-bold text-on-surface">{breakdown.safety || 90}%</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1">
          <Users className="w-3 h-3 text-blue-600" />
          <div>
            <div className="text-on-surface-variant text-[9px]">Capacity</div>
            <div className="font-bold text-on-surface">{breakdown.capacity || 85}%</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1">
          <Navigation className="w-3 h-3 text-purple-600" />
          <div>
            <div className="text-on-surface-variant text-[9px]">Road Access</div>
            <div className="font-bold text-on-surface">{breakdown.road || 80}%</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1">
          <Droplets className="w-3 h-3 text-sky-600" />
          <div>
            <div className="text-on-surface-variant text-[9px]">Water</div>
            <div className="font-bold text-on-surface">{breakdown.water || 85}%</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1">
          <HeartPulse className="w-3 h-3 text-rose-600" />
          <div>
            <div className="text-on-surface-variant text-[9px]">Healthcare</div>
            <div className="font-bold text-on-surface">{breakdown.healthcare || 80}%</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1">
          <MapPin className="w-3 h-3 text-amber-600" />
          <div>
            <div className="text-on-surface-variant text-[9px]">Proximity</div>
            <div className="font-bold text-on-surface">{breakdown.distance || 85}%</div>
          </div>
        </div>
      </div>

      {/* Footer: Capacity Details */}
      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-outline-variant/40">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span>Available Capacity:</span>
          <span className="font-bold text-on-surface">
            {site.available_capacity ? site.available_capacity.toLocaleString() : 'Available'}
          </span>
          {site.total_capacity && (
            <span className="text-[10px] text-on-surface-variant/70">
              / {site.total_capacity.toLocaleString()}
            </span>
          )}
        </div>

        {isFallback && (
          <WarningBadge text="⚠ Cached data" size="sm" />
        )}
      </div>
    </div>
  );
};

export default RelocationCard;
