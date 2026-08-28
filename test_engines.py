"""
Test script to verify risk_engine.py and relocation_engine.py work correctly.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from risk_engine import calculate_risk_score, score_all_villages
from relocation_engine import find_best_sites, explain_recommendation

def test_risk_engine():
    print("Testing Risk Engine...")

    # Test village data matching the JSON contract
    test_village = {
        "id": 1,
        "name": "Ukhimath",
        "district": "Rudraprayag",
        "state": "Uttarakhand",
        "latitude": 30.4934,
        "longitude": 79.0547,
        "population": 2100,
        "slope_degrees": 35,
        "annual_rainfall_mm": 2800,
        "past_landslides": 4,
        "flood_risk_index": 8,
        "road_access_score": 3
    }

    scored_village = calculate_risk_score(test_village)

    # Check that all required fields are present
    required_fields = [
        'risk_score', 'risk_level', 'priority',
        'slope_score', 'rainfall_score', 'landslide_score',
        'flood_score', 'road_score'
    ]

    for field in required_fields:
        if field not in scored_village:
            print(f"ERROR: Missing field {field}")
            return False

    # Check value ranges
    if not (0 <= scored_village['risk_score'] <= 100):
        print(f"ERROR: risk_score out of range: {scored_village['risk_score']}")
        return False

    if scored_village['risk_level'] not in ["Critical", "High", "Moderate", "Low"]:
        print(f"ERROR: Invalid risk_level: {scored_village['risk_level']}")
        return False

    if scored_village['priority'] not in ["Immediate", "Short-term", "Medium-term", "Monitor"]:
        print(f"ERROR: Invalid priority: {scored_village['priority']}")
        return False

    for field in ['slope_score', 'rainfall_score', 'landslide_score', 'flood_score', 'road_score']:
        if not (0 <= scored_village[field] <= 10):
            print(f"ERROR: {field} out of range: {scored_village[field]}")
            return False

    print(f"Risk Score: {scored_village['risk_score']}")
    print(f"Risk Level: {scored_village['risk_level']}")
    print(f"Priority: {scored_village['priority']}")
    print(f"Slope Score: {scored_village['slope_score']}")
    print(f"Rainfall Score: {scored_village['rainfall_score']}")
    print(f"Landslide Score: {scored_village['landslide_score']}")
    print(f"Flood Score: {scored_village['flood_score']}")
    print(f"Road Score: {scored_village['road_score']}")

    # Test score_all_villages
    villages_list = [test_village]
    scored_villages = score_all_villages(villages_list)

    if len(scored_villages) != 1:
        print("ERROR: score_all_villages didn't return correct number of villages")
        return False

    if scored_villages[0]['risk_score'] != scored_village['risk_score']:
        print("ERROR: score_all_villages didn't preserve scores")
        return False

    print("Risk Engine tests PASSED\n")
    return True

def test_relocation_engine():
    print("Testing Relocation Engine...")

    # Test village data
    test_village = {
        "id": 1,
        "name": "Ukhimath",
        "population": 2100,
        "latitude": 30.4934,
        "longitude": 79.0547
    }

    # Test sites data
    test_sites = [
        {
            "id": 1,
            "name": "Guptkashi",
            "district": "Rudraprayag",
            "latitude": 30.5267,
            "longitude": 79.0743,
            "total_capacity": 5000,
            "current_population": 1200,
            "safety_score": 92,
            "road_connectivity_score": 8,
            "water_availability_score": 9,
            "healthcare_score": 7
        },
        {
            "id": 2,
            "name": "Another Site",
            "district": "Rudraprayag",
            "latitude": 30.6000,
            "longitude": 79.1000,
            "total_capacity": 1000,  # Too small for our village
            "current_population": 800,
            "safety_score": 80,
            "road_connectivity_score": 7,
            "water_availability_score": 6,
            "healthcare_score": 5
        }
    ]

    best_sites = find_best_sites(test_village, test_sites)

    # Should only return the first site since second doesn't have enough capacity
    if len(best_sites) != 1:
        print(f"ERROR: Expected 1 eligible site, got {len(best_sites)}")
        return False

    site = best_sites[0]

    # Check required fields
    required_fields = [
        'available_capacity', 'overall_score', 'distance_km', 'score_breakdown'
    ]

    for field in required_fields:
        if field not in site:
            print(f"ERROR: Missing field {field} in site")
            return False

    # Check value ranges
    if not (0 <= site['overall_score'] <= 100):
        print(f"ERROR: overall_score out of range: {site['overall_score']}")
        return False

    if site['available_capacity'] < test_village['population']:
        print("ERROR: Site doesn't have enough capacity")
        return False

    # Check score breakdown
    breakdown = site['score_breakdown']
    required_breakdown = ['safety', 'capacity', 'road', 'water', 'healthcare', 'distance']
    for factor in required_breakdown:
        if factor not in breakdown:
            print(f"ERROR: Missing breakdown factor {factor}")
            return False
        if not (0 <= breakdown[factor] <= 100):
            print(f"ERROR: Breakdown factor {factor} out of range: {breakdown[factor]}")
            return False

    print(f"Site Name: {site['name']}")
    print(f"Overall Score: {site['overall_score']}")
    print(f"Distance: {site['distance_km']} km")
    print(f"Available Capacity: {site['available_capacity']}")
    print(f"Score Breakdown: {site['score_breakdown']}")

    # Test explanation
    explanation = explain_recommendation(site)
    print(f"Explanation: {explanation}")

    # Check that explanation is a string and not empty
    if not isinstance(explanation, str) or len(explanation.strip()) == 0:
        print("ERROR: Explanation is not a valid string")
        return False

    print("Relocation Engine tests PASSED\n")
    return True

if __name__ == "__main__":
    print("Running Engine Tests...\n")

    risk_passed = test_risk_engine()
    relocation_passed = test_relocation_engine()

    if risk_passed and relocation_passed:
        print("All tests PASSED! Engines are working correctly.")
        sys.exit(0)
    else:
        print("Some tests FAILED!")
        sys.exit(1)