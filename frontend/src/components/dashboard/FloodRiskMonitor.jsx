import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { RefreshCw, Droplets } from 'lucide-react';

export default function FloodRiskMonitor() {
  const [floodData, setFloodData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = () => {
    apiClient.get('/api/flood/dashboard')
      .then(res => setFloodData(res.data.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await apiClient.get('/api/flood/risk/all');
      fetchDashboard();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!floodData || floodData.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-on-surface flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            Flood Risk Monitor
          </h3>
          <p className="text-xs text-on-surface-variant">Live metrics for coastal and riverine flood-prone settlements</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            isRefreshing
              ? 'bg-surface-container text-on-surface-variant/50 border-outline-variant cursor-not-allowed'
              : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95 shadow-xs'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {floodData.map((v, i) => {
          const score = (v.final_flood_risk_score || 0) * 100;
          let badgeColor = 'bg-green-100 text-green-800 border-green-200';
          let barColor = 'bg-green-500';
          if (v.risk_level === 'CRITICAL') { badgeColor = 'bg-red-100 text-red-800 border-red-200'; barColor = 'bg-red-500'; }
          else if (v.risk_level === 'HIGH') { badgeColor = 'bg-orange-100 text-orange-800 border-orange-200'; barColor = 'bg-orange-500'; }
          else if (v.risk_level === 'MODERATE') { badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-200'; barColor = 'bg-yellow-500'; }
          
          const name = v.village_id === 'OD_KEN_001' ? 'Rajnagar' : v.village_id === 'OD_JAG_001' ? 'Tirtol' : v.village_id === 'OD_PUR_001' ? 'Brahmagiri' : `Village ${v.village_id}`;

          return (
            <div key={i} className="bg-surface-lowest p-4 rounded-xl border border-outline-variant/60 shadow-xs flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-on-surface">{name}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${badgeColor}`}>
                  {v.risk_level}
                </span>
              </div>
              
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-on-surface-variant font-medium">Risk Score</span>
                  <span className="font-bold">{score.toFixed(0)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(score, 100)}%` }}></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] bg-surface-container p-2 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-on-surface-variant font-medium">Today Rain</span>
                  <span className="font-bold">{v.raw_data?.today_rainfall_mm ?? '--'} mm</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-on-surface-variant font-medium">Next 24h Rain</span>
                  <span className="font-bold">{v.raw_data?.next_24hr_rainfall_mm ?? '--'} mm</span>
                </div>
              </div>
              
              <div className="text-[10px] text-on-surface-variant leading-tight bg-blue-50/50 p-2 rounded border border-blue-100">
                {v.summary}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
