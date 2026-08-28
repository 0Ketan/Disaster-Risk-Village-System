/**
 * VillageShield Core Mathematical and Risk Calculation Utilities
 * 
 * Rules:
 * 1. Risk Color Spectrum:
 *    - Critical (81-100): Red (#e74c3c)
 *    - High (61-80): Orange (#e67e22)
 *    - Moderate (31-60): Yellow (#f39c12)
 *    - Low (0-30): Green (#27ae60)
 * 2. Population Marker Radius:
 *    - <= 0 / empty: 6px
 *    - < 1,000: 7px
 *    - 1,000 - 2,499: 10px
 *    - 2,500 - 4,999: 14px
 *    - 5,000+: 18px
 * 3. Semi-Circular SVG Risk Gauge (Radius = 70):
 *    - Circumference C = PI * R = 219.91148575...
 *    - Progress Ratio = score / 100
 *    - StrokeDashoffset = C * (1 - score / 100)
 */

export const getRiskColor = (score) => {
  const numericScore = Number(score) || 0;
  if (numericScore >= 81) return "#e74c3c"; // Critical: Red (81-100)
  if (numericScore >= 61) return "#e67e22"; // High: Orange (61-80)
  if (numericScore >= 31) return "#f39c12"; // Moderate: Yellow (31-60)
  return "#27ae60";                         // Low: Green (0-30)
};

export const getRiskLevel = (score) => {
  const numericScore = Number(score) || 0;
  if (numericScore >= 81) return "Critical";
  if (numericScore >= 61) return "High";
  if (numericScore >= 31) return "Moderate";
  return "Low";
};

export const getMarkerRadius = (population) => {
  const pop = Number(population);
  if (!pop || pop <= 0) return 6;
  if (pop < 1000) return 7;
  if (pop < 2500) return 10;
  if (pop < 5000) return 14;
  return 18; // 5000+
};

export const calculateGaugeMetrics = (score = 0, radius = 70) => {
  const clampedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const circumference = Math.PI * radius; // Semi-circle arc length
  const progressRatio = clampedScore / 100;
  const strokeDashoffset = circumference * (1 - progressRatio);
  
  // Angle in radians (0 = 180deg (left), 50 = 90deg (top), 100 = 0deg (right))
  const angleRad = Math.PI * progressRatio;
  const cx = 90;
  const cy = 85;
  const needleX = cx - radius * Math.cos(angleRad);
  const needleY = cy - radius * Math.sin(angleRad);

  return {
    score: clampedScore,
    circumference,
    strokeDashoffset,
    progressRatio,
    needleX,
    needleY,
    color: getRiskColor(clampedScore),
    level: getRiskLevel(clampedScore),
  };
};

export default {
  getRiskColor,
  getRiskLevel,
  getMarkerRadius,
  calculateGaugeMetrics,
};
