import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, MapPin, Eye, ChevronRight, AlertTriangle } from 'lucide-react';
import { getRiskColor, getRiskLevel } from '../map/VillageMarker';

/**
 * VillageTable Component
 * Searchable, sortable, filterable executive data table
 */
export const VillageTable = ({ 
  villages = [], 
  onVillageSelect 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePriorityFilter, setActivePriorityFilter] = useState('All');
  const [sortField, setSortField] = useState('risk_score');
  const [sortAsc, setSortAsc] = useState(false);

  const priorityFilters = ['All', 'Immediate', 'Short-term', 'Medium-term', 'Monitor'];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    return villages
      .filter((v) => {
        const matchesQuery = 
          v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.district?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = 
          activePriorityFilter === 'All' || 
          v.priority?.toLowerCase() === activePriorityFilter.toLowerCase();
        return matchesQuery && matchesPriority;
      })
      .sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortAsc ? -1 : 1;
        if (aVal > bVal) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [villages, searchQuery, activePriorityFilter, sortField, sortAsc]);

  const getPriorityClasses = (priority) => {
    switch (priority) {
      case 'Immediate': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Short-term': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'Medium-term': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Monitor': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getRiskBadgeClasses = (score) => {
    if (score >= 81) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (score >= 61) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (score >= 31) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="bg-surface-lowest border border-outline-variant/70 rounded-xl shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-low">
        {/* Priority Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {priorityFilters.map((filter) => {
            const isSelected = activePriorityFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActivePriorityFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface text-on-surface-variant hover:bg-surface-container border border-outline-variant/60'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Filter by village or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-lowest border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
          />
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-surface border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-on-surface select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Village</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-on-surface select-none"
                onClick={() => handleSort('district')}
              >
                <div className="flex items-center gap-1.5">
                  <span>District</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th 
                className="py-3 px-4 text-right cursor-pointer hover:text-on-surface select-none"
                onClick={() => handleSort('population')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Population</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th 
                className="py-3 px-4 text-center cursor-pointer hover:text-on-surface select-none"
                onClick={() => handleSort('risk_score')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Risk Score</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/40">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-on-surface-variant">
                  No villages match the active filter criteria.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((v, idx) => {
                const score = Math.round(v.risk_score || 0);
                const level = v.risk_level || getRiskLevel(score);
                const isFallback = v._source === 'fallback';

                return (
                  <tr 
                    key={v.id} 
                    className="hover:bg-surface transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-on-surface-variant font-medium">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 font-bold text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <span>{v.name}</span>
                        {isFallback && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-semibold" title="Cached data">
                            ⚠
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-on-surface-variant">
                      {v.district}, {v.state || 'UK'}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-on-surface">
                      {v.population ? v.population.toLocaleString() : 'N/A'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getRiskBadgeClasses(score)}`}>
                        {score} <span className="text-[10px] font-normal opacity-75">/ 100</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-on-surface">
                        {level}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getPriorityClasses(v.priority)}`}>
                        {v.priority || 'Standard'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onVillageSelect(v.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary-container font-semibold text-xs transition-colors shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 bg-surface-low border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
        <span>Showing {filteredAndSorted.length} of {villages.length} villages</span>
        <span>Click 'View' to inspect hazard gauges and relocation sites</span>
      </div>
    </div>
  );
};

export default VillageTable;
