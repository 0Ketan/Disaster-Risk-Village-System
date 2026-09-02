import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Mountain, AlertTriangle, Clock } from 'lucide-react';
import { getPredictiveLandslideForecast } from '../../api/villages';

/**
 * PredictiveLandslideForecast Component
 * Displays a 24h-72h predictive landslide risk forecast card with
 * visual timeline, probability indicators, and trend analysis.
 */
export const PredictiveLandslideForecast = ({ village }) => {
  if (!village) return null;

  const forecast = village.predictive_forecast;
  const isLoading = !forecast; // No longer fetching, if it's not there it's just missing

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-rose-600 text-white border-rose-700';
      case 'HIGH': return 'bg-orange-500 text-white border-orange-600';
      case 'MODERATE': return 'bg-amber-500 text-white border-amber-600';
      case 'LOW': return 'bg-emerald-500 text-white border-emerald-600';
      default: return 'bg-slate-400 text-white border-slate-500';
    }
  };

  const getRiskBarColor = (risk) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-rose-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MODERATE': return 'bg-amber-500';
      case 'LOW': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  const getRiskDescription = (risk, prob, hours) => {
    if (risk === 'CRITICAL') return `${prob}% Immediate Debris Flow Risk`;
    if (risk === 'HIGH') return `${prob}% Sustained Landslide Risk`;
    if (risk === 'MODERATE') return `${prob}% Subsiding Risk`;
    return `${prob}% Low Risk`;
  };

  const TrendIcon = forecast?.trend === 'Increasing' ? TrendingUp
    : (forecast?.trend === 'Subsiding' || forecast?.trend === 'Decreasing') ? TrendingDown
    : Minus;

  const trendColor = forecast?.trend === 'Increasing' ? 'text-rose-600'
    : (forecast?.trend === 'Subsiding' || forecast?.trend === 'Decreasing') ? 'text-emerald-600'
    : 'text-amber-600';

  const timeSlots = forecast ? [
    { label: 'Next 24h', risk: forecast['24h_risk'], prob: forecast['24h_probability'] },
    { label: 'Next 48h', risk: forecast['48h_risk'], prob: forecast['48h_probability'] },
    { label: 'Next 72h', risk: forecast['72h_risk'], prob: forecast['72h_probability'] },
  ] : [];

  return (
    <div className="bg-surface-lowest rounded-xl border border-outline-variant/60 overflow-hidden shadow-xs">
      <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-outline-variant/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Predictive Landslide Forecast (24h – 72h)
          </span>
        </div>
        {forecast && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{forecast.trend}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-on-surface-variant">
            <div className="animate-spin w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full mx-auto mb-2" />
            Analyzing terrain susceptibility and precipitation trends...
          </div>
        ) : forecast ? (
          <div className="space-y-4">
            {/* 3-Step Timeline */}
            <div className="flex flex-col gap-3">
              {timeSlots.map((slot, idx) => (
                <div key={slot.label} className="flex items-center gap-3">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center w-5 flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full border-2 ${slot.risk === 'CRITICAL' ? 'bg-rose-500 border-rose-600' : slot.risk === 'HIGH' ? 'bg-orange-500 border-orange-600' : slot.risk === 'MODERATE' ? 'bg-amber-500 border-amber-600' : 'bg-emerald-500 border-emerald-600'}`} />
                    {idx < 2 && <div className="w-0.5 h-4 bg-outline-variant/40" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-on-surface">
                        {slot.label}: {getRiskDescription(slot.risk, slot.prob, (idx + 1) * 24)}
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getRiskColor(slot.risk)}`}>
                      {slot.risk}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Probability Bars */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/40">
              {timeSlots.map((slot) => (
                <div key={`bar-${slot.label}`} className="flex items-center gap-2">
                  <span className="text-[10px] text-on-surface-variant w-12 flex-shrink-0 font-medium">{slot.label.replace('Next ', '')}</span>
                  <div className="flex-1 bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getRiskBarColor(slot.risk)}`}
                      style={{ width: `${Math.min(slot.prob, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-on-surface w-10 text-right">{slot.prob}%</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-2 mt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-bold text-indigo-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Powered by OceanSat-2 Telemetry & NOAA ERDDAP
              </span>
            </div>

            {/* Active Triggers */}
            {forecast.triggers && forecast.triggers.length > 0 && (
              <div className="pt-2 border-t border-outline-variant/40">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Active Triggers</span>
                </div>
                <div className="space-y-1">
                  {forecast.triggers.map((trigger, idx) => (
                    <div key={idx} className="text-[10px] text-on-surface-variant pl-4 flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{trigger}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-on-surface-variant">
            <Clock className="w-5 h-5 mx-auto mb-1.5 text-slate-400" />
            Predictive forecast unavailable. Awaiting telemetry data.
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveLandslideForecast;
