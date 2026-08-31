import React, { useState, useMemo } from 'react';
import { Shield, AlertTriangle, Users, Home, MapPin, RefreshCw, Layers, CheckCircle2, Clock } from 'lucide-react';
import VillageTable from './VillageTable';
import WarningBadge from '../common/WarningBadge';

/**
 * DashboardView Component
 * Executive management dashboard with high-level KPI cards and village risk matrix.
 */
export const DashboardView = ({ 
  villages = [], 
  summary, 
  onVillageSelect,
  onRefresh,
  isRefreshing = false,
  lastSyncTime = null,
  lastUpdated = null,
  liveFeedActive = false
}) => {
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');

  // Extract unique states and districts
  const availableStates = useMemo(() => {
    const states = new Set(villages.map((v) => v.state).filter(Boolean));
    return ['All States', ...Array.from(states)];
  }, [villages]);

  const availableDistricts = useMemo(() => {
    const matching = villages.filter(
      (v) => selectedState === 'All States' || v.state === selectedState
    );
    const districts = new Set(matching.map((v) => v.district).filter(Boolean));
    return ['All Districts', ...Array.from(districts)];
  }, [villages, selectedState]);

  // Base villages filtered by state and district
  const baseVillages = useMemo(() => {
    return villages.filter((v) => {
      const matchState = selectedState === 'All States' || v.state === selectedState;
      const matchDistrict = selectedDistrict === 'All Districts' || v.district === selectedDistrict;
      return matchState && matchDistrict;
    });
  }, [villages, selectedState, selectedDistrict]);

  // Calculate dynamic stats
  const criticalCount = baseVillages.filter((v) => (v.risk_score >= 81 || v.risk_level === 'Critical')).length;
  const highCount = baseVillages.filter((v) => (v.risk_score >= 61 && v.risk_score <= 80) || v.risk_level === 'High').length;
  const moderateCount = baseVillages.filter((v) => (v.risk_score >= 31 && v.risk_score <= 60) || v.risk_level === 'Moderate').length;
  const lowCount = baseVillages.filter((v) => (v.risk_score < 31 || v.risk_level === 'Low')).length;
  const totalPop = baseVillages.reduce((sum, v) => sum + (Number(v.population) || 0), 0);
  const relocationsNeeded = baseVillages.filter((v) => Number(v.risk_score) >= 70).length;

  const hasFallback = baseVillages.some((v) => v._source === 'fallback') || summary?._source === 'fallback';

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  return (
    <div className="flex-1 bg-surface min-h-[calc(100vh-60px)] overflow-y-auto">
      {/* Top Filter and Actions Bar */}
      <div className="bg-surface-lowest border-b border-outline-variant/60 sticky top-0 z-20 px-6 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant">
              <Layers className="w-4 h-4 text-primary" />
              <span>Scope:</span>
            </div>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('All Districts');
              }}
              className="px-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {availableStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* District Filter */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Refresh Action & Provenance */}
          <div className="flex items-center gap-3">
            {/* Live Feed Indicator */}
            {liveFeedActive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Live Weather Feed</span>
              </div>
            )}

            {/* Last Sync / Update Time */}
            {(lastUpdated || lastSyncTime) && (
              <div className="flex items-center gap-1 text-[11px] text-on-surface-variant bg-surface px-2.5 py-1 rounded-lg border border-outline-variant/60">
                <Clock className="w-3 h-3 text-primary" />
                <span>Updated: {new Date(lastUpdated || lastSyncTime).toLocaleTimeString()}</span>
              </div>
            )}

            {hasFallback && (
              <WarningBadge text="⚠ Cached data" size="sm" />
            )}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isRefreshing
                  ? 'bg-surface-container text-on-surface-variant/50 border-outline-variant cursor-not-allowed'
                  : 'bg-primary text-white border-primary hover:bg-primary-hover active:scale-95 shadow-xs'
              }`}
              title="Fetch live weather and recalculate risk scores"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards Row (5 Risk Tiers) */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Total */}
          <div className="bg-surface-lowest p-4 rounded-xl border border-outline-variant/60 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-on-surface-variant mb-1">
              Monitored Villages
            </div>
            <div className="text-2xl font-black text-primary">
              {baseVillages.length}
            </div>
            <div className="text-[10px] text-on-surface-variant mt-1">
              In selected region
            </div>
          </div>

          {/* Critical */}
          <div className="bg-surface-lowest p-4 rounded-xl border-l-4 border-l-rose-500 border border-outline-variant/60 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-rose-700 mb-1">
              Critical (81-100)
            </div>
            <div className="text-2xl font-black text-rose-600">
              {criticalCount}
            </div>
            <div className="text-[10px] text-rose-600/80 mt-1 font-medium">
              Immediate action
            </div>
          </div>

          {/* High */}
          <div className="bg-surface-lowest p-4 rounded-xl border-l-4 border-l-orange-500 border border-outline-variant/60 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-orange-700 mb-1">
              High Risk (61-80)
            </div>
            <div className="text-2xl font-black text-orange-600">
              {highCount}
            </div>
            <div className="text-[10px] text-orange-600/80 mt-1 font-medium">
              Relocation planning
            </div>
          </div>

          {/* Moderate */}
          <div className="bg-surface-lowest p-4 rounded-xl border-l-4 border-l-amber-500 border border-outline-variant/60 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-amber-700 mb-1">
              Moderate (31-60)
            </div>
            <div className="text-2xl font-black text-amber-600">
              {moderateCount}
            </div>
            <div className="text-[10px] text-amber-600/80 mt-1 font-medium">
              Sensor monitoring
            </div>
          </div>

          {/* Low */}
          <div className="bg-surface-lowest p-4 rounded-xl border-l-4 border-l-emerald-500 border border-outline-variant/60 shadow-xs col-span-2 md:col-span-1">
            <div className="text-[11px] font-bold uppercase text-emerald-700 mb-1">
              Low Risk (0-30)
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {lowCount}
            </div>
            <div className="text-[10px] text-emerald-600/80 mt-1 font-medium">
              Safe settlements
            </div>
          </div>
        </section>

        {/* Macro Summary Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-lowest border border-outline-variant/60 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-on-surface-variant mb-1">
                Total Population in Monitored Corridor
              </div>
              <div className="text-2xl font-black text-on-surface">
                {formatNumber(totalPop)}
              </div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                Vulnerable rural inhabitants tracked
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-lowest border border-outline-variant/60 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-rose-700 mb-1">
                Villages Requiring Relocation (Risk ≥ 70)
              </div>
              <div className="text-2xl font-black text-rose-600">
                {relocationsNeeded}
              </div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                Eligible for safe shelter staging
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Master Village Data Table */}
        <section>
          <div className="mb-3">
            <h3 className="text-base font-extrabold text-on-surface">
              Settlement Risk Directory
            </h3>
            <p className="text-xs text-on-surface-variant">
              Comprehensive index of villages, topography slopes, precipitation ratings, and evacuation priority
            </p>
          </div>

          <VillageTable 
            villages={baseVillages} 
            onVillageSelect={onVillageSelect} 
          />
        </section>
      </main>
    </div>
  );
};

export default DashboardView;
