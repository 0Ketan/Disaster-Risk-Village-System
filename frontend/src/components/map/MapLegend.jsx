import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Info } from 'lucide-react';

/**
 * MapLegend Component
 * Displays Risk Spectrum Tiers and Population Radius Scaling guide
 */
export const MapLegend = () => {
  const [collapsed, setCollapsed] = useState(false);

  const riskTiers = [
    { label: "Critical Risk (81 - 100)", color: "#e74c3c", desc: "Immediate evacuation" },
    { label: "High Risk (61 - 80)", color: "#e67e22", desc: "Relocation planning" },
    { label: "Moderate Risk (31 - 60)", color: "#f39c12", desc: "Monitored hazard" },
    { label: "Low Risk (0 - 30)", color: "#27ae60", desc: "Stable terrain" },
  ];

  const populationSizes = [
    { label: "< 1,000", radius: "7px", size: "w-3 h-3" },
    { label: "1k - 2.5k", radius: "10px", size: "w-4 h-4" },
    { label: "2.5k - 5k", radius: "14px", size: "w-5 h-5" },
    { label: "5,000+", radius: "18px", size: "w-6 h-6" },
  ];

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = React.useCallback((e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  }, [isDragging]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur-sm border border-outline-variant/80 rounded-xl shadow-lg p-3.5 max-w-xs select-none transition-shadow cursor-move"
      style={{ transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)` }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="flex items-center justify-between cursor-pointer gap-4"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>Risk & Population Legend</span>
        </div>
        <button className="text-on-surface-variant hover:text-on-surface">
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-3 pt-3 border-t border-outline-variant/40 space-y-3">
          {/* Risk Tiers */}
          <div>
            <div className="text-[11px] font-semibold text-on-surface-variant mb-1.5">
              Risk Level (0 - 100)
            </div>
            <div className="space-y-1.5">
              {riskTiers.map((tier) => (
                <div key={tier.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full border border-black/20 flex-shrink-0"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="font-medium text-on-surface">{tier.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Population Radius Scaling */}
          <div>
            <div className="text-[11px] font-semibold text-on-surface-variant mb-1.5">
              Marker Radius (Population)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {populationSizes.map((pop) => (
                <div key={pop.label} className="flex items-center gap-2 text-xs text-on-surface">
                  <div className="flex items-center justify-center w-6 h-6">
                    <span 
                      className={`${pop.size} rounded-full bg-slate-400 border border-slate-600 inline-block`}
                    />
                  </div>
                  <span className="text-[11px]">{pop.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
