import React from 'react';
import { Shield, Map, LayoutDashboard, AlertTriangle, Users } from 'lucide-react';
import WarningBadge from '../common/WarningBadge';

/**
 * Top Navigation Bar (60px height)
 * Features VillageShield branding, active view toggle, global risk counters,
 * and provenance status indicator.
 */
export const Navbar = ({ 
  activeView, 
  setActiveView, 
  totalVillages = 18, 
  criticalCount = 0, 
  highCount = 0,
  populationAtRisk = 0,
  hasFallbackData = false 
}) => {
  const formatPop = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-nav bg-primary text-white z-50 flex items-center justify-between px-4 sm:px-6 shadow-md border-b border-primary-container">
      {/* Brand & Tabs */}
      <div className="flex items-center gap-6">
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

      {/* Global Counters & Provenance Indicator */}
      <div className="flex items-center gap-3 sm:gap-5">
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
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
            <Users className="w-3.5 h-3.5 text-primary-dim" />
            <span className="text-primary-dim">At Risk:</span>
            <span className="font-bold text-white">{formatPop(populationAtRisk)}</span>
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
