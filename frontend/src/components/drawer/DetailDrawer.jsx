import React, { useState, useEffect } from 'react';
import { X, MapPin, Users, AlertOctagon, ShieldCheck, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import RiskGauge from './RiskGauge';
import FactorBreakdown from './FactorBreakdown';
import FloodFactorBreakdown from './FloodFactorBreakdown';
import RelocationCard from './RelocationCard';
import HazardZoneBadges from './HazardZoneBadges';
import WarningBadge from '../common/WarningBadge';
import { getRelocationSites } from '../../api/villages';

/**
 * Slide-out Detail Drawer (440px width)
 * Opens upon village selection on the map or sidebar.
 * Automatically fetches relocation site recommendations when risk_score >= 70.
 */
export const DetailDrawer = ({
  village,
  onClose,
  onDispatchOrder
}) => {
  console.log("Sidebar rendering village:", village?.name);
  const [relocationData, setRelocationData] = useState(null);
  const [isLoadingRelocation, setIsLoadingRelocation] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const handleDispatch = (site) => {
    const villageName = village?.name || 'Village';
    const pop = village?.population || 0;
    const message = `Evacuation Order Dispatched to District Magistrate: Relocate ${pop.toLocaleString()} citizens from ${villageName} to ${site.name}.`;
    setToastMessage(message);
    // Auto hide after 4 seconds
    setTimeout(() => setToastMessage(null), 4000);
    // optional callback to parent
    if (onDispatchOrder) onDispatchOrder(village, site);
  };

  const riskScore = Number(village?.risk_score) || 0;
  const needsRelocation = riskScore >= 70;
  const isFallback = village?._source === 'fallback' || !village?._source;

  // Load relocation recommendations when village risk >= 70
  useEffect(() => {
    let isMounted = true;

    if (village && village.id && needsRelocation) {
      setIsLoadingRelocation(true);
      getRelocationSites(village.id)
        .then((res) => {
          if (isMounted) {
            setRelocationData(res);
            setIsLoadingRelocation(false);
          }
        })
        .catch((err) => {
          console.warn('Failed to load relocation recommendations:', err);
          if (isMounted) setIsLoadingRelocation(false);
        });
    } else {
      setRelocationData(null);
      setIsLoadingRelocation(false);
    }

    return () => {
      isMounted = false;
    };
  }, [village?.id, needsRelocation]);

  if (!village) return null;

  return (
    <aside 
      className="relative w-full sm:w-[440px] flex-shrink-0 bg-surface-lowest border-l border-outline-variant/80 shadow-2xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
      data-testid="detail-drawer"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-outline-variant/60 bg-surface-low flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>{village.district}, {village.state || 'Uttarakhand'}</span>
          </div>
          <h2 className="text-xl font-black text-on-surface tracking-tight">
            {village.name}
          </h2>
          <div className="text-[11px] text-on-surface-variant mt-0.5">
            Coord: {village.latitude?.toFixed(4)}° N, {village.longitude?.toFixed(4)}° E
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
          title="Close details"
          data-testid="close-drawer-button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Provenance Warning Banner if village is from fallback/cached data */}
      {isFallback && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <WarningBadge text="⚠ Cached data in use" size="sm" />
          <span className="text-[10px] text-amber-800">External services offline</span>
        </div>
      )}

      {/* Drawer Content Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Risk Gauge Section */}
        <section>
          <RiskGauge score={riskScore} />
        </section>

        {/* Hazard Zone Classification */}
        <section>
          <HazardZoneBadges village={village} />
        </section>

        {/* Priority & Quick Stats Grid */}
        <section className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-lg bg-surface border border-outline-variant/50">
            <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-0.5">
              Population
            </div>
            <div className="text-base font-extrabold text-on-surface flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              <span>{village.population ? village.population.toLocaleString() : 'N/A'}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-outline-variant/50">
            <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-0.5">
              Evacuation Priority
            </div>
            <div className={`text-base font-extrabold flex items-center gap-1.5 ${
              village.priority === 'Immediate' ? 'text-rose-600' :
              village.priority === 'Short-term' ? 'text-orange-600' :
              village.priority === 'Medium-term' ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              <AlertOctagon className="w-4 h-4" />
              <span>{village.priority || 'Standard'}</span>
            </div>
          </div>
        </section>

        {/* 5-Factor Hazard Breakdown OR Flood Risk Monitor */}
        <section>
          {(village.hazard_type === 'flood' || ['OD_KEN_001', 'OD_JAG_001', 'OD_PUR_001'].includes(String(village.id)))
            ? <FloodFactorBreakdown village={village} />
            : <FactorBreakdown village={village} />
          }
        </section>

        {/* Relocation Site Recommendations (Risk >= 70) */}
        <section className="space-y-3 pt-2 border-t border-outline-variant/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-on-surface">
                Safe Relocation Options
              </h3>
            </div>
            {needsRelocation ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200">
                Triggered (Risk ≥ 70)
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Monitoring Only
              </span>
            )}
          </div>

          {needsRelocation ? (
            isLoadingRelocation ? (
              <div className="p-6 text-center text-xs text-on-surface-variant bg-surface rounded-xl border border-outline-variant/40">
                <div className="animate-spin w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                Evaluating safe shelter capacities and road accessibility...
              </div>
            ) : relocationData && relocationData.sites && relocationData.sites.length > 0 ? (
              <div className="space-y-3" data-testid="relocation-list">
                {relocationData.sites.map((site, index) => (
                  <RelocationCard
                    key={site.id || index}
                    site={site}
                    rank={index}
                    villageName={village.name}
                    onDispatch={() => handleDispatch(site)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface border border-outline-variant/40 text-center text-xs text-on-surface-variant">
                No safe relocation sites currently meeting criteria.
              </div>
            )
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-0.5">Relocation Not Required</strong>
                Risk score is below the emergency threshold of 70. Continuous meteorological monitoring is active.
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
};

export default DetailDrawer;
