"""
Backward compatibility bridge for risk engine.
"""

from backend.engines.risk_engine import calculate_risk_score, score_all_villages, generate_predictive_forecast

__all__ = ["calculate_risk_score", "score_all_villages", "generate_predictive_forecast"]
