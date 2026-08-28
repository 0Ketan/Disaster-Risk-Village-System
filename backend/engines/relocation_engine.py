"""
Safe Relocation Recommendation Engine for VillageShield.
Filters candidate sites based on available capacity and maximum distance (200km),
computes multi-factor suitability scores, ranks top 3 candidates, and generates
plain English 2-sentence rationale.
"""

import math
from typing import Dict, Any, List


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two decimal coordinates in kilometers.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    r = 6371.0  # Earth radius in kilometers
    return round(c * r, 1)


def explain_recommendation(site: Dict[str, Any]) -> str:
    """
    Generates a clear 2-sentence plain English explanation for the site recommendation.
    """
    name = site.get('name', 'Site')
    distance_km = site.get('distance_km', 0.0)
    available_capacity = site.get('available_capacity', 0)
    breakdown = site.get('score_breakdown', {})

    factor_names = {
        'safety': 'geological safety',
        'capacity': 'shelter capacity',
        'road': 'road connectivity',
        'water': 'water availability',
        'healthcare': 'healthcare access',
        'distance': 'proximity'
    }

    scores = {
        k: float(breakdown.get(k, 0.0))
        for k in ['safety', 'capacity', 'road', 'water', 'healthcare', 'distance']
    }

    strongest_key = max(scores, key=scores.get)
    weakest_key = min(scores, key=scores.get)

    strong_name = factor_names.get(strongest_key, strongest_key)
    weak_name = factor_names.get(weakest_key, weakest_key)
    strong_val = scores[strongest_key]
    weak_val = scores[weakest_key]

    sentence1 = (
        f"{name} is strongly recommended due to its superior {strong_name} "
        f"(rated {strong_val:.0f}/100) and capacity to accommodate {available_capacity:,} people within {distance_km:.1f} km."
    )
    sentence2 = (
        f"While its {weak_name} (rated {weak_val:.0f}/100) requires logistics coordination, "
        f"the overall suitability score of {site.get('overall_score', 0):.1f}/100 makes it a prime relocation destination."
    )

    return f"{sentence1} {sentence2}"


def find_best_sites(village: Dict[str, Any], all_sites: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Identifies and ranks top 3 candidate relocation sites for a vulnerable village.
    """
    village_pop = int(village.get('population', 0))
    village_lat = float(village.get('latitude', 0.0))
    village_lon = float(village.get('longitude', 0.0))

    eligible_sites = []

    for site in all_sites:
        total_cap = int(site.get('total_capacity', 0))
        curr_pop = int(site.get('current_population', 0))
        available_cap = max(0, total_cap - curr_pop)

        # Constraint 1: Site must have sufficient available capacity
        if available_cap < village_pop:
            continue

        site_lat = float(site.get('latitude', 0.0))
        site_lon = float(site.get('longitude', 0.0))

        # Constraint 2: Haversine distance must be <= 200 km
        dist_km = haversine_distance(village_lat, village_lon, site_lat, site_lon)
        if dist_km > 200.0:
            continue

        # Sub-factor 1: Safety Score (30% weight, 0 - 100)
        safety_score = float(site.get('safety_score', 80.0))

        # Sub-factor 2: Capacity Adequacy Score (25% weight, 0 - 100)
        usage_pct = (village_pop / total_cap * 100.0) if total_cap > 0 else 100.0
        capacity_score = max(0.0, 100.0 - usage_pct)

        # Sub-factor 3: Road Connectivity Score (15% weight, scaled from 0-10 to 0-100)
        road_scaled = float(site.get('road_connectivity_score', 7.0)) * 10.0

        # Sub-factor 4: Water Availability Score (10% weight, scaled from 0-10 to 0-100)
        water_scaled = float(site.get('water_availability_score', 7.0)) * 10.0

        # Sub-factor 5: Healthcare Score (10% weight, scaled from 0-10 to 0-100)
        health_scaled = float(site.get('healthcare_score', 7.0)) * 10.0

        # Sub-factor 6: Proximity Score (10% weight, 0 - 100)
        distance_score = max(0.0, 100.0 - (dist_km / 200.0) * 100.0)

        # Weighted Composite Suitability Score
        overall_score = (
            safety_score * 0.30 +
            capacity_score * 0.25 +
            road_scaled * 0.15 +
            water_scaled * 0.10 +
            health_scaled * 0.10 +
            distance_score * 0.10
        )

        score_breakdown = {
            'safety': round(safety_score, 1),
            'capacity': round(capacity_score, 1),
            'road': round(road_scaled, 1),
            'water': round(water_scaled, 1),
            'healthcare': round(health_scaled, 1),
            'distance': round(distance_score, 1)
        }

        enhanced_site = site.copy()
        enhanced_site.update({
            'available_capacity': available_cap,
            'distance_km': round(dist_km, 1),
            'overall_score': round(min(max(overall_score, 0.0), 100.0), 1),
            'score_breakdown': score_breakdown
        })

        enhanced_site['explanation'] = explain_recommendation(enhanced_site)
        eligible_sites.append(enhanced_site)

    # Sort descending by overall_score and return top 3
    eligible_sites.sort(key=lambda x: x['overall_score'], reverse=True)
    return eligible_sites[:3]
