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
        distance_score = max(0, 100 - (distance_km / 200) * 100)

        # Capacity adequacy score
        usage_percentage = (village_population / site['total_capacity']) * 100
        capacity_adequacy_score = max(0, 100 - usage_percentage)

        # Fix: Multiply 0-10 scores by 10 to scale to 0-100 before weighting
        road_scaled = site['road_connectivity_score'] * 10
        water_scaled = site['water_availability_score'] * 10
        health_scaled = site['healthcare_score'] * 10

        overall_score = (
            site['safety_score'] * 0.30 +
            capacity_adequacy_score * 0.25 +
            road_scaled * 0.15 +
            water_scaled * 0.10 +
            health_scaled * 0.10 +
            distance_score * 0.10
        )

        # Create score breakdown
        score_breakdown = {
            'safety': round(site['safety_score'], 1),
            'capacity': round(capacity_adequacy_score, 1),
            'road': round(road_scaled, 1),
            'water': round(water_scaled, 1),
            'healthcare': round(health_scaled, 1),
            'distance': round(distance_score, 1)
        }

        # Create enhanced site dictionary
        enhanced_site = site.copy()
        enhanced_site.update({
            'available_capacity': available_capacity,
            'overall_score': round(overall_score, 1),
            'distance_km': round(distance_km, 1),
            'score_breakdown': score_breakdown
        })

        # Add explanation
        enhanced_site['explanation'] = explain_recommendation(enhanced_site)

        eligible_sites.append(enhanced_site)

    # Sort by overall_score descending and return top 3
    eligible_sites.sort(key=lambda x: x['overall_score'], reverse=True)
    return eligible_sites[:3]


def explain_recommendation(site: dict) -> str:
    """
    Generate a 2-sentence plain English explanation of why this site is recommended.
    """
    name = site['name']
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
