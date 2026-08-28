"""
Relocation scoring engine for Disaster Risk Village System.
Finds best relocation sites for villages at risk.
"""

import math


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees).
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r


def find_best_sites(village: dict, all_sites: list) -> list:
    """
    Find the best relocation sites for a given village.

    Args:
        village: Dictionary containing village data with fields:
            id, name, population, latitude, longitude
        all_sites: List of site dictionaries, each with:
            id, name, district, latitude, longitude, total_capacity,
            current_population, safety_score (0-100),
            road_connectivity_score (0-10),
            water_availability_score (0-10),
            healthcare_score (0-10)

    Returns:
        List of top 3 eligible sites sorted by overall_score descending.
        Each site includes: all original fields + available_capacity +
        overall_score (0-100) + distance_km + score_breakdown dict
    """
    village_population = village['population']
    village_lat = village['latitude']
    village_lon = village['longitude']

    eligible_sites = []

    for site in all_sites:
        # Calculate available capacity
        available_capacity = site['total_capacity'] - site['current_population']

        # Skip if site doesn't have enough capacity
        if available_capacity < village_population:
            continue

        # Calculate distance
        distance_km = haversine_distance(
            village_lat, village_lon,
            site['latitude'], site['longitude']
        )

        # Distance score: closer is better, max 200km
        # At 0km: score = 100, at 200km: score = 0
        distance_score = max(0, 100 - (distance_km / 200) * 100)

        # Capacity adequacy score: percentage of capacity that would be used
        # Lower usage = higher score
        usage_percentage = (village_population / site['total_capacity']) * 100
        capacity_adequacy_score = max(0, 100 - usage_percentage)

        # Calculate overall score using weights:
        # safety 30%, capacity adequacy 25%, road 15%, water 10%, healthcare 10%, distance 10%
        overall_score = (
            site['safety_score'] * 0.30 +
            capacity_adequacy_score * 0.25 +
            site['road_connectivity_score'] * 0.15 +
            site['water_availability_score'] * 0.10 +
            site['healthcare_score'] * 0.10 +
            distance_score * 0.10
        )

        # Create score breakdown
        score_breakdown = {
            'safety': round(site['safety_score'], 2),
            'capacity': round(capacity_adequacy_score, 2),
            'road': round(site['road_connectivity_score'], 2),
            'water': round(site['water_availability_score'], 2),
            'healthcare': round(site['healthcare_score'], 2),
            'distance': round(distance_score, 2)
        }

        # Create enhanced site dictionary
        enhanced_site = site.copy()
        enhanced_site.update({
            'available_capacity': available_capacity,
            'overall_score': round(overall_score, 2),
            'distance_km': round(distance_km, 2),
            'score_breakdown': score_breakdown
        })

        eligible_sites.append(enhanced_site)

    # Sort by overall_score descending and return top 3
    eligible_sites.sort(key=lambda x: x['overall_score'], reverse=True)
    return eligible_sites[:3]


def explain_recommendation(site: dict) -> str:
    """
    Generate a 2-sentence plain English explanation of why this site is recommended.

    Args:
        site: Dictionary containing site data with score breakdown

    Returns:
        2-sentence explanation string
    """
    name = site['name']
    overall_score = site['overall_score']
    distance_km = site['distance_km']
    available_capacity = site['available_capacity']
    score_breakdown = site['score_breakdown']

    # Find the strongest and weakest factors
    factors = {
        'safety': score_breakdown['safety'],
        'capacity': score_breakdown['capacity'],
        'road': score_breakdown['road'],
        'water': score_breakdown['water'],
        'healthcare': score_breakdown['healthcare'],
        'distance': score_breakdown['distance']
    }

    strongest_factor = max(factors, key=factors.get)
    weakest_factor = min(factors, key=factors.get)

    # Create explanation
    explanation = (
        f"{name} is recommended because it has excellent "
        f"{strongest_factor.replace('_', ' ')} "
        f"(score: {factors[strongest_factor]:.1f}/100) and is only "
        f"{distance_km:.1f}km away with {available_capacity} spots available. "
        f"While {weakest_factor.replace('_', ' ')} "
        f"(score: {factors[weakest_factor]:.1f}/100) could be improved, "
        f"the overall balance makes it suitable for relocation."
    )

    return explanation