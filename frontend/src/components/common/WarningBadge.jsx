import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Provenance Warning Badge
 * Displays a visible yellow badge when fallback / cached data is being used.
 * Complies with GEMINI.md Rule 5 & Acceptance Criteria.
 */
export const WarningBadge = ({ 
  text = "⚠ Cached data", 
  source, 
  size = "md",
  className = "" 
}) => {
  // If source is provided and it is 'live', do not render
  if (source && source !== 'fallback') {
    return null;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2"
  };

  return (
    <div 
      className={`inline-flex items-center font-semibold rounded-md bg-amber-100 border border-amber-300 text-amber-900 shadow-sm ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title="External API unavailable. Displaying cached baseline data."
      data-testid="warning-badge"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
};

export default WarningBadge;
