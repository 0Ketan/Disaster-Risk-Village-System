import React, { useState, useEffect } from 'react';
import { X, MapPin, Users, AlertOctagon, ShieldCheck, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import RiskGauge from './RiskGauge';
import FactorBreakdown from './FactorBreakdown';
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
  const [relocationData, setRelocationData] = useState(null);
  const [isLoadingRelocation, setIsLoadingRelocation] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [marineView, setMarineView] = useState('current');

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

  useEffect(() => {
    let isMounted = true;

    if (village && village.id && needsRelocation && !village.is_coastal_erosion) {
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

  if (village.is_coastal_erosion) {
    return (
      <aside 
        className="relative w-full sm:w-[440px] flex-shrink-0 bg-surface-lowest border-l border-outline-variant/80 shadow-2xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        data-testid="coastal-detail-drawer"
      >
        <div className="p-4 border-b border-outline-variant/60 bg-surface-low flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>ODISHA, INDIA</span>
            </div>
            <h2 className="text-xl font-black text-on-surface tracking-tight">
              {village.name}
            </h2>
            <div className="text-[11px] text-on-surface-variant mt-0.5 font-medium">
              District: {village.district}
            </div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">
              Coordinates: {village.latitude}° N, {village.longitude}° E
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <section className="bg-surface p-4 rounded-xl border border-outline-variant/60 text-center flex flex-col items-center">
            <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Live Calculated Risk Score</div>
            {village.risk_score !== undefined && village.risk_score !== 0 ? (
              <>
                <div className="text-4xl font-black mb-1">{village.risk_score} <span className="text-lg text-on-surface-variant/70 font-bold">/ 100</span></div>
                <div className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                  DYNAMIC SCORE
                </div>
              </>
            ) : (
              <div className="text-base font-bold text-on-surface-variant">RISK SCORE: Calculating...</div>
            )}
            
            <div className="mt-4 text-[10px] uppercase font-bold text-on-surface-variant">Risk Level</div>
            <div className={`text-sm font-extrabold uppercase mt-0.5 ${
              village.risk_level === 'Severe' || village.risk_level === 'Critical' ? 'text-rose-600' :
              village.risk_level === 'High' ? 'text-orange-600' :
              village.risk_level === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {village.risk_level || 'Not available'}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-on-surface uppercase tracking-wider">Live Marine Intelligence</div>
              <div className="flex bg-surface-variant rounded-md overflow-hidden border border-outline-variant/40">
                <button 
                  onClick={() => setMarineView('current')}
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${marineView === 'current' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-white/50'}`}
                >
                  Current
                </button>
                <button 
                  onClick={() => setMarineView('forecast')}
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${marineView === 'forecast' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-white/50'}`}
                >
                  24h Forecast
                </button>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-surface border border-outline-variant/50 flex flex-col gap-2 relative overflow-hidden">
              {marineView === 'forecast' && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                  TREND PREDICTION
                </div>
              )}
              {marineView === 'current' && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                  LIVE OBSERVATION
                </div>
              )}

              <div className="flex items-center justify-between text-sm mt-1">
                <div className="flex items-center gap-1.5 font-bold"><span className="text-lg">🌊</span> Coastal Risk</div>
                <span className={`font-extrabold px-2 py-0.5 rounded text-xs ${
                  village.hazard_zones?.coastal_erosion === 'Red' ? 'bg-red-100 text-red-800' :
                  village.hazard_zones?.coastal_erosion === 'Orange' ? 'bg-orange-100 text-orange-800' :
                  village.hazard_zones?.coastal_erosion === 'Yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>{village.hazard_zones?.coastal_erosion || 'Unknown'} Zone</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 border-t border-outline-variant/40 pt-2 mt-1">
                <div className="text-center">
                  <div className="text-[10px] text-on-surface-variant">Wave (m)</div>
                  <div className="font-bold text-sm text-blue-700">
                    {marineView === 'current' 
                      ? (village.live_wave_height?.toFixed(1) || '--')
                      : (village.live_conditions?.forecast?.wave_height ? Math.max(...village.live_conditions.forecast.wave_height).toFixed(1) : '--')}
                  </div>
                </div>
                <div className="text-center border-l border-r border-outline-variant/40">
                  <div className="text-[10px] text-on-surface-variant">Swell (m)</div>
                  <div className="font-bold text-sm text-teal-700">
                    {marineView === 'current' 
                      ? (village.live_swell_height?.toFixed(1) || '--')
                      : (village.live_conditions?.forecast?.swell_wave_height ? Math.max(...village.live_conditions.forecast.swell_wave_height).toFixed(1) : '--')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-on-surface-variant">Wind (km/h)</div>
                  <div className="font-bold text-sm text-gray-700">
                    {marineView === 'current' 
                      ? (village.live_wind_speed?.toFixed(1) || '--')
                      : (village.live_conditions?.forecast?.wind_speed_10m ? Math.max(...village.live_conditions.forecast.wind_speed_10m).toFixed(1) : 'Trend')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-outline-variant/40 pt-2">
                <span className="text-on-surface-variant">Live Elevation:</span>
                <span className="font-semibold">{village.live_elevation_m !== undefined ? `${village.live_elevation_m} m` : 'Fetching...'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Live Rainfall:</span>
                <span className="font-semibold">{village.live_rainfall_mm !== undefined ? `${village.live_rainfall_mm.toFixed(1)} mm` : 'Fetching...'}</span>
              </div>
            </div>
          </section>

          <section className="bg-surface p-4 rounded-xl border border-outline-variant/60">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-extrabold text-on-surface">Future Risk Outlook (2026–2030)</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-surface-low p-2 rounded border border-outline-variant/30">
                <div className="text-xs text-on-surface-variant font-bold">Historical Baseline (2023)</div>
                <div className="text-sm font-black text-gray-500">{village.historical_baseline_score || village.risk_score_suggested || 'N/A'} <span className="text-[10px] font-normal">/ 100</span></div>
              </div>

              <div className="flex justify-between items-center bg-rose-50 p-2 rounded border border-rose-200">
                <div className="text-xs text-rose-900 font-bold">Projected Threat (2026-2030)</div>
                <div className="text-sm font-black text-rose-700">{village.risk_score} <span className="text-[10px] font-normal">/ 100</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 border-t border-outline-variant/40 pt-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-on-surface-variant">Annual Shoreline Retreat</div>
                  <div className="text-sm font-extrabold text-on-surface mt-0.5">{village.projected_retreat_m_yr ? `${village.projected_retreat_m_yr} m/yr` : 'Calculating...'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-on-surface-variant">7-Day Max Wave Trend</div>
                  <div className="text-sm font-extrabold text-on-surface mt-0.5">{village.max_forecast_wave ? `${village.max_forecast_wave.toFixed(1)} m` : '--'}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg bg-surface border border-outline-variant/50">
              <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-0.5">Observed Area</div>
              <div className="text-sm font-extrabold text-on-surface">{village.erosion_area_sq_m ? `${village.erosion_area_sq_m.toLocaleString()} m²` : 'Not available'}</div>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-outline-variant/50">
              <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-0.5">Mitigation</div>
              <div className="text-sm font-extrabold text-on-surface truncate" title={village.mitigation_status}>{village.mitigation_status || 'Not available'}</div>
            </div>
          </section>

          <section className="bg-surface p-4 rounded-xl border border-outline-variant/60">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-on-surface">Context & Reference</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-on-surface-variant">Source Classification:</span> <span className="font-medium text-right">{village.risk_score_suggested} ({village.risk_level})</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Source Data:</span> <span className="font-medium text-right">{village.source || 'N/A'}</span></div>
              {village.context && (
                <div className="mt-2 pt-2 border-t border-outline-variant/40 text-on-surface-variant italic">
                  "{village.context}"
                </div>
              )}
            </div>
          </section>

          <section className="pt-2 border-t border-outline-variant/60 pb-4">
            <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Data Source</div>
            {village.source_url ? (
              <a href={village.source_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline">
                {village.source}
              </a>
            ) : (
              <div className="text-sm font-bold text-on-surface">{village.source || 'Unknown'}</div>
            )}
            <div className="text-[10px] mt-1 text-on-surface-variant font-medium">SOURCE DATA</div>
          </section>
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className="relative w-full sm:w-[440px] flex-shrink-0 bg-surface-lowest border-l border-outline-variant/80 shadow-2xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
      data-testid="detail-drawer"
    >
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

      {isFallback && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <WarningBadge text="⚠️ Cached data in use" size="sm" />
          <span className="text-[10px] text-amber-800">External services offline</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section>
          <RiskGauge score={riskScore} />
        </section>

        <section>
          <HazardZoneBadges village={village} />
        </section>

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

        <section>
          <FactorBreakdown village={village} />
        </section>

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
