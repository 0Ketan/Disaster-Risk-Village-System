import React from 'react';
import { calculateGaugeMetrics, getRiskColor, getRiskLevel } from '../../utils/risk_math';

export { calculateGaugeMetrics };

/**
 * Precision SVG Risk Gauge (0-100)
 * Renders calibrated semi-circular arc with accurate lengths and color zones.
 */
export const RiskGauge = ({ score = 0, size = "default" }) => {
  const radius = 70;
  const metrics = calculateGaugeMetrics(score, radius);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-surface-lowest rounded-xl border border-outline-variant/60 shadow-xs" data-testid="risk-gauge">
      <div className="relative w-48 h-28 flex items-center justify-center">
        <svg 
          className="w-full h-full overflow-visible" 
          viewBox="0 0 180 95"
          data-testid="gauge-svg"
        >
          {/* Background Track Arc */}
          <path
            d="M 20 85 A 70 70 0 0 1 160 85"
            fill="none"
            stroke="#e0e3e6"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active Color Progress Arc */}
          <path
            d="M 20 85 A 70 70 0 0 1 160 85"
            fill="none"
            stroke={metrics.color}
            strokeWidth="14"
            strokeDasharray={metrics.circumference}
            strokeDashoffset={metrics.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            data-testid="gauge-progress-arc"
          />

          {/* End-point needle indicator dot */}
          <circle
            cx={metrics.needleX}
            cy={metrics.needleY}
            r="4"
            fill="#ffffff"
            stroke={metrics.color}
            strokeWidth="2.5"
            className="transition-all duration-700 ease-out"
          />

          {/* Value Display Centered */}
          <text 
            x="90" 
            y="66" 
            textAnchor="middle" 
            className="text-2xl font-black fill-slate-900 tracking-tight"
            style={{ fontSize: '26px', fontWeight: '800' }}
          >
            {metrics.score}
          </text>
          <text 
            x="90" 
            y="82" 
            textAnchor="middle" 
            className="text-[11px] font-bold fill-slate-500 uppercase tracking-wider"
            style={{ fontSize: '10px' }}
          >
            Risk Score / 100
          </text>
        </svg>
      </div>

      {/* Risk Tier Badge */}
      <div 
        className="mt-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide text-white shadow-xs transition-colors"
        style={{ backgroundColor: metrics.color }}
        data-testid="gauge-level-badge"
      >
        {metrics.level} Risk
      </div>
    </div>
  );
};

export default RiskGauge;
