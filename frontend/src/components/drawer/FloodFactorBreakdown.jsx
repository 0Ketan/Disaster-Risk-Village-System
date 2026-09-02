import React, { useState, useEffect } from 'react';
import { Droplets, RefreshCw, Gauge, CloudRain, Mountain, Radio } from 'lucide-react';
import apiClient from '../../api/client';

/**
 * FloodFactorBreakdown Component
 * Replaces the generic FactorBreakdown for flood-zone villages (IDs 43, 44, 45).
 * Fetches live data from /api/flood/dashboard and /api/flood/risk/all.
 * Zero hardcoded values — all metrics flow from the API.
 */
export const FloodFactorBreakdown = ({ village }) => {
  const [floodData, setFloodData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [errorMsg, setErrorMsg] = useState(null);

  const villageId = String(village?.id);

  const fetchFloodDashboard = async () => {
    setErrorMsg(null);
    try {
      // Calling the individual endpoint automatically triggers compute_flood_risk on the backend if missing
      const res = await apiClient.get(`/api/flood/risk/${villageId}`);
      if (res.data) {
        setFloodData(res.data);
      }
    } catch (err) {
      console.error('Flood dashboard fetch error:', err);
      setErrorMsg("Failed to load live API data. Click retry.");
    }
  };

  useEffect(() => {
    setFloodData(null); // Reset when switching villages
    fetchFloodDashboard();
  }, [villageId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchFloodDashboard();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Risk level badge styling
  const getBadgeStyle = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getBarColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MODERATE': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getGaugeStyle = (status) => {
    if (!status || status === 'NO_DATA') return 'text-gray-500 bg-gray-100 border-gray-200';
    switch (status) {
      case 'EMERGENCY': return 'text-red-600 bg-red-50 border-red-200';
      case 'WARNING': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'WATCH': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'RISING': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-green-700 bg-green-50 border-green-200';
    }
  };

  // Loading / no-data state
  if (!floodData) {
    return (
      <div className="bg-surface-lowest rounded-xl border border-outline-variant/60 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-4 h-4" />
            Flood Risk Monitor
          </span>
        </div>
        <div className="p-6 text-center">
          {errorMsg ? (
            <div className="text-red-600 text-xs font-bold mb-2">
              {errorMsg}
            </div>
          ) : (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-on-surface-variant">Loading live flood data...</p>
            </>
          )}
          <button
            onClick={handleRefresh}
            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {errorMsg ? 'Retry' : 'Fetch Live Data'}
          </button>
        </div>
      </div>
    );
  }

  const scorePercent = Math.round((floodData.final_flood_risk_score || 0) * 100);

  return (
    <div className="bg-surface-lowest rounded-xl border border-outline-variant/60 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
          <Droplets className="w-4 h-4" />
          Flood Risk Monitor
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase ${getBadgeStyle(floodData.risk_level)}`}>
            {floodData.risk_level}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg transition-colors ${
              isRefreshing 
                ? 'text-on-surface-variant/50 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-100'
            }`}
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Score Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-on-surface">Composite Flood Risk Score</span>
            <span className="text-sm font-extrabold text-on-surface">{scorePercent}%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(floodData.risk_level)}`}
              style={{ width: `${Math.min(scorePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid — all values from API */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Elevation */}
          <div className="p-2.5 rounded-lg bg-surface border border-outline-variant/50 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-on-surface-variant">
              <Mountain className="w-3 h-3 text-blue-500" />
              Elevation
            </div>
            <div className="text-base font-extrabold text-on-surface">
              {floodData.raw_data?.elevation_m ?? '-- '}m
            </div>
          </div>

          {/* Today's Rainfall */}
          <div className="p-2.5 rounded-lg bg-surface border border-outline-variant/50 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-on-surface-variant">
              <CloudRain className="w-3 h-3 text-blue-500" />
              Today's Rainfall
            </div>
            <div className="text-base font-extrabold text-on-surface">
              {floodData.raw_data?.today_rainfall_mm ?? '-- '} mm
            </div>
          </div>

          {/* 24hr Forecast */}
          <div className="p-2.5 rounded-lg bg-surface border border-outline-variant/50 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-on-surface-variant">
              <CloudRain className="w-3 h-3 text-cyan-500" />
              24hr Forecast
            </div>
            <div className="text-base font-extrabold text-on-surface">
              {floodData.raw_data?.next_24hr_rainfall_mm ?? '-- '} mm
            </div>
          </div>

          {/* River Gauge Status */}
          <div className={`p-2.5 rounded-lg border space-y-0.5 ${getGaugeStyle(floodData.flood_gauge_status)}`}>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
              <Radio className="w-3 h-3" />
              River Gauge
            </div>
            <div className="text-base font-extrabold">
              {(!floodData.flood_gauge_status || floodData.flood_gauge_status === 'NO_DATA') ? 'Offline/No Data' : floodData.flood_gauge_status}
            </div>
          </div>
        </div>

        {/* Dynamic Summary — generated by the engine, never hardcoded */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-[10px] font-bold uppercase text-blue-800 mb-1 flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            Live Assessment
          </div>
          <p className="text-xs text-blue-900 leading-relaxed font-medium">
            {floodData.summary}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FloodFactorBreakdown;
