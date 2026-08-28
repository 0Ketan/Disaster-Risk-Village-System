import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, ChevronRight, Activity, ShieldAlert, Users } from 'lucide-react';
import ApiHealthPill from '../common/ApiHealthPill';
import WarningBadge from '../common/WarningBadge';

/**
 * Risk Color mapping helper
 */
export const getRiskColor = (score) => {
  if (score >= 81) return "#e74c3c"; // Critical: Red (81-100)
  if (score >= 61) return "#e67e22"; // High: Orange (61-80)
  if (score >= 31) return "#f39c12"; // Moderate: Yellow (31-60)
  return "#27ae60";                  // Low: Green (0-30)
};

export const getRiskLevel = (score) => {
  if (score >= 81) return "Critical";
  if (score >= 61) return "High";
  if (score >= 31) return "Moderate";
  return "Low";
};

/**
 * Left Sidebar Component (380px width)
 * Search, filter chips, API health monitor, and scrollable village list.
 */
export const Sidebar = ({ 
  villages = [], 
  selectedVillageId, 
  onVillageSelect, 
  apiHealth = [], 
  isLoading = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('All');

  const riskFilters = ['All', 'Critical', 'High', 'Moderate', 'Low'];

  // Filter villages by search query and risk level filter chip
  const filteredVillages = useMemo(() => {
    return villages.filter((v) => {
      const nameMatch = v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        v.district?.toLowerCase().includes(searchQuery.toLowerCase());
      const level = v.risk_level || getRiskLevel(v.risk_score);
      const riskMatch = selectedRiskFilter === 'All' || level.toLowerCase() === selectedRiskFilter.toLowerCase();
      return nameMatch && riskMatch;
    });
  }, [villages, searchQuery, selectedRiskFilter]);

  const getRiskBadgeClasses = (score) => {
    if (score >= 81) return "bg-rose-100 text-rose-800 border-rose-200";
    if (score >= 61) return "bg-orange-100 text-orange-800 border-orange-200";
    if (score >= 31) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  return (
    <aside className="w-full md:w-sidebar flex-shrink-0 bg-surface-lowest border-r border-outline-variant/60 flex flex-col h-[calc(100vh-60px)] shadow-xs">
      {/* Top Search & Filter Bar */}
      <div className="p-3.5 border-b border-outline-variant/60 bg-surface-lowest space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search village or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface placeholder:text-on-surface-variant/70"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-on-surface"
            >
              ✕
            </button>
          )}
        </div>

        {/* Risk Level Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {riskFilters.map((filter) => {
            const isSelected = selectedRiskFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setSelectedRiskFilter(filter)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-outline-variant/60'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* API Health Monitor Section */}
      <div className="px-3.5 py-2.5 bg-surface-low border-b border-outline-variant/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>External API Status</span>
          </div>
          <span className="text-[10px] text-on-surface-variant/80">8s timeout • auto-retry</span>
        </div>
        <div className="space-y-1.5">
          {apiHealth && apiHealth.length > 0 ? (
            apiHealth.map((svc) => (
              <ApiHealthPill key={svc.service} service={svc} />
            ))
          ) : (
            <div className="text-[11px] text-on-surface-variant text-center py-1">
              Checking external APIs...
            </div>
          )}
        </div>
      </div>

      {/* Villages List Header */}
      <div className="px-3.5 py-2 bg-surface-container-lowest flex items-center justify-between border-b border-outline-variant/40">
        <span className="text-xs font-semibold text-on-surface">
          Villages ({filteredVillages.length})
        </span>
        <span className="text-[11px] text-on-surface-variant">
          Sorted by risk
        </span>
      </div>

      {/* Scrollable Village List */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/40">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-on-surface-variant">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading village risk data...
          </div>
        ) : filteredVillages.length === 0 ? (
          <div className="p-6 text-center text-xs text-on-surface-variant">
            No villages match criteria
          </div>
        ) : (
          filteredVillages.map((v) => {
            const isSelected = Number(selectedVillageId) === Number(v.id);
            const score = Math.round(v.risk_score || 0);
            const level = v.risk_level || getRiskLevel(score);
            const color = getRiskColor(score);
            const isFallback = v._source === 'fallback';

            return (
              <div
                key={v.id}
                onClick={() => onVillageSelect(v.id)}
                className={`p-3.5 cursor-pointer transition-all hover:bg-surface flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/70 border-l-4 border-emerald-600 shadow-inner'
                    : 'hover:border-l-4 hover:border-outline-variant'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-sm text-on-surface truncate">
                      {v.name}
                    </span>
                    {isFallback && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-medium" title="Using cached terrain/weather data">
                        ⚠ Cached
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-on-surface-variant flex items-center gap-2">
                    <span>{v.district}, {v.state || 'UK'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Users className="w-3 h-3 text-on-surface-variant/70" />
                      {v.population ? v.population.toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Risk Score Pill */}
                <div className="flex flex-col items-end flex-shrink-0 gap-1">
                  <div 
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1 ${getRiskBadgeClasses(score)}`}
                  >
                    <span>{score}</span>
                    <span className="text-[10px] font-normal opacity-75">/100</span>
                  </div>
                  <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    {level}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
