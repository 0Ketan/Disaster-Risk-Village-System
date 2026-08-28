"""
Risk scoring engine for Disaster Risk Village System.
Calculates risk scores for Indian villages based on multiple factors.
"""

import math
import pandas as pd


def calculate_risk_score(village: dict) -> dict:
    """
    Calculate risk score for a single village based on multiple factors.

    Args:
        village: Dictionary containing village data with fields:
            id, name, district, state, latitude, longitude, population,
            slope_degrees, annual_rainfall_mm, past_landslides,
            flood_risk_index (0-10), road_access_score (0-10)

    Returns:
        Same dictionary with added risk scoring fields:
        risk_score (0-100 float), risk_level (string), priority (string),
        slope_score (0-10), rainfall_score (0-10), landslide_score (0-10),
        flood_score (0-10), road_score (0-10)
    """
    # Create a copy to avoid modifying the original
    scored_village = village.copy()

    # Normalize inputs to 0-10 scale
    # Slope: assume max 90 degrees (vertical), normalize to 0-10
    slope_score = min((village['slope_degrees'] / 90) * 10, 10)

    # Rainfall: assume max 5000mm annual rainfall, normalize to 0-10
    rainfall_score = min((village['annual_rainfall_mm'] / 5000) * 10, 10)

    # Landslides: already 0-10 scale, but ensure it's capped
    landslide_score = min(village['past_landslides'], 10)

    # Flood risk: already 0-10 scale
    flood_score = min(village['flood_risk_index'], 10)

    # Road access: invert (lower score = worse access = higher risk)
    # Road access score is 0-10 where 10 = good access, 0 = poor access
    # We want: poor access (0) -> high risk score (10), good access (10) -> low risk score (0)
    road_score = 10 - min(village['road_access_score'], 10)

    # Apply weights: slope 25%, rainfall 25%, landslides 20%, flood 20%, road 10%
    weighted_sum = (
        slope_score * 0.25 +
        rainfall_score * 0.25 +
        landslide_score * 0.20 +
        flood_score * 0.20 +
        road_score * 0.10
    )

    # Convert to 0-100 scale
    risk_score = weighted_sum * 10

    # Determine risk level
    if risk_score >= 75:
        risk_level = "Critical"
    elif risk_score >= 50:
        risk_level = "High"
    elif risk_score >= 30:
        risk_level = "Moderate"
    else:
        risk_level = "Low"

    # Determine priority based on risk level
    if risk_level == "Critical":
        priority = "Immediate"
    elif risk_level == "High":
        priority = "Short-term"
    elif risk_level == "Moderate":
        priority = "Medium-term"
    else:  # Low
        priority = "Monitor"

    # Add all calculated fields to the village dictionary
    scored_village.update({
        'risk_score': round(risk_score, 2),
        'risk_level': risk_level,
        'priority': priority,
        'slope_score': round(slope_score, 2),
        'rainfall_score': round(rainfall_score, 2),
        'landslide_score': round(landslide_score, 2),
        'flood_score': round(flood_score, 2),
        'road_score': round(road_score, 2)
    })

    return scored_village


def score_all_villages(villages: list) -> list:
    """
    Calculate risk scores for all villages and return sorted by risk score.

    Args:
        villages: List of village dictionaries

    Returns:
        List of scored village dictionaries sorted by risk_score descending
    """
    # Score each village
    scored_villages = [calculate_risk_score(village) for village in villages]

    # Sort by risk_score descending (highest risk first)
    scored_villages.sort(key=lambda x: x['risk_score'], reverse=True)

    return scored_villages