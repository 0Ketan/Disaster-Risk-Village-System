import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';

/**
 * ApiHealthPill Component
 * Displays real-time health indicator for external APIs:
 * - OpenTopoData (Elevation & Slope)
 * - OpenWeatherMap (Precipitation & Real-time Weather)
 * - Meteostat (Historical Climate Records)
 */
export const ApiHealthPill = ({ service }) => {
  const isLive = service.mode === 'live' || service.status === 'healthy';
  const isFallback = service.mode === 'fallback' || service.status === 'degraded';
  
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-lowest border border-outline-variant/60 shadow-xs hover:border-outline-variant transition-all">
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative flex-shrink-0">
          {isLive ? (
            <span className="flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          ) : isFallback ? (
            <span className="flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          ) : (
            <span className="flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          )}
        </div>
        <div className="truncate">
          <div className="text-xs font-semibold text-on-surface truncate">
            {service.name || service.service}
          </div>
          <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
            {isLive ? (
              <span className="text-emerald-700 font-medium">Live Feed</span>
            ) : isFallback ? (
              <span className="text-amber-700 font-medium">Cached Backup</span>
            ) : (
              <span className="text-rose-700 font-medium">Offline</span>
            )}
            {service.latency_ms > 0 && isLive && (
              <>
                <span>•</span>
                <span>{service.latency_ms}ms</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 ml-2">
        {isLive ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        ) : isFallback ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
        )}
      </div>
    </div>
  );
};

export default ApiHealthPill;
