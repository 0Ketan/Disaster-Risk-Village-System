"""
Backward compatibility bridge for relocation engine.
"""

from backend.engines.relocation_engine import (
    haversine_distance,
    find_best_sites,
    explain_recommendation
)

__all__ = ["haversine_distance", "find_best_sites", "explain_recommendation"]
