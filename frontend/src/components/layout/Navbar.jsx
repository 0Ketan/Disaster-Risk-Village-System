import React from 'react';
import { Shield, Map, LayoutDashboard, AlertTriangle, Users, RefreshCw, Clock } from 'lucide-react';
import WarningBadge from '../common/WarningBadge';

/**
 * Top Navigation Bar (60px height)
 * Features VillageShield branding, active view toggle, global risk counters,
 * on-demand Refresh Data button, timestamp, and provenance status indicator.
 */
export const Navbar = ({ 
  activeView, 
  setActiveView, 
  totalVillages = 18, 
  criticalCount = 0, 
  highCount = 0,
  populationAtRisk = 0,
  hasFallbackData = false,
  lastSyncTime = null,
  lastUpdated = null,
  liveFeedActive = false,
  onRefresh,
  isRefreshing = false
}) => {
  const formatPop = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  const activeTimestamp = lastUpdated || lastSyncTime;

  return (
    <header className="fixed top-0 left-0 right-0 h-nav bg-primary text-white z-50 flex items-center justify-between px-4 sm:px-6 shadow-md border-b border-primary-container">
      {/* Brand & Tabs */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div 
          onClick={() => setActiveView('map')}
          className="flex items-center gap-2.5 font-bold text-lg cursor-pointer tracking-tight select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5 fill-emerald-400/20 text-emerald-400" />
          </div>
          <span className="font-extrabold text-white tracking-wide">
            Village<span className="text-emerald-400">Shield</span>
          </span>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-primary-container/80 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveView('map')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'map'
                ? 'bg-white text-primary shadow-sm'
                : 'text-primary-dim hover:text-white hover:bg-white/5'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Risk Map</span>
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'dashboard'
                ? 'bg-white text-primary shadow-sm'
                : 'text-primary-dim hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </nav>
      </div>

      {/* Global Actions, Counters & Provenance Indicator */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* On-Demand Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isRefreshing
                ? 'bg-white/10 text-white/50 border-white/10 cursor-not-allowed'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 active:scale-95 shadow-xs'
            }`}
            title="Fetch live weather and recalculate dynamic risk scores"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        )}

        {/* Last Updated Timestamp */}
        {activeTimestamp && (
          <div className="hidden xl:flex items-center gap-1 text-[11px] text-primary-dim/90 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Updated: {new Date(activeTimestamp).toLocaleTimeString()}</span>
          </div>
        )}

        {/* Monitored Count */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
          <span className="text-primary-dim">Monitored:</span>
          <span className="font-bold text-white">{totalVillages}</span>
        </div>

        {/* Critical & High risk count */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs">
          <span className="text-rose-300">Action Required:</span>
          <span className="font-bold text-rose-400">{criticalCount + highCount}</span>
        </div>

        {/* Population at Risk */}
        {populationAtRisk > 0 && (
          <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
            <Users className="w-3.5 h-3.5 text-primary-dim" />
            <span className="text-primary-dim">At Risk:</span>
            <span className="font-bold text-white">{formatPop(populationAtRisk)}</span>
          </div>
        )}

        {/* Live Sync Indicator */}
        {liveFeedActive && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-emerald-300 font-semibold">Live</span>
          </div>
        )}

        {/* Provenance Badge */}
        {hasFallbackData && (
          <WarningBadge 
            text="⚠ Cached data" 
            size="sm"
            className="animate-pulse"
          />
        )}
      </div>
    </header>
  );
};

export default Navbar;
