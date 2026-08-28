"""
Integration test for Disaster Risk Village System.
Tests the complete workflow: risk scoring -> relocation recommendations.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from risk_engine import score_all_villages
from relocation_engine import find_best_sites, explain_recommendation

def test_integration():
    print("=== Disaster Risk Village System Integration Test ===\n")

    # Sample village data (same as in test_engines.py)
    test_villages = [
        {
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
        },
        {
            "id": 2,
            "name": "Kedarnath",
            "district": "Rudraprayag",
            "state": "Uttarakhand",
            "latitude": 30.7352,
            "longitude": 79.0669,
            "population": 600,
            "slope_degrees": 42,
            "annual_rainfall_mm": 3100,
            "past_landslides": 5,
            "flood_risk_index": 9,
            "road_access_score": 1
        }
    ]

    # Sample relocation sites data
    relocation_sites = [
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
            "name": "Agastyamuni",
            "district": "Rudraprayag",
            "latitude": 30.3920,
            "longitude": 78.9850,
            "total_capacity": 8000,
            "current_population": 5200,
            "safety_score": 85,
            "road_connectivity_score": 7,
            "water_availability_score": 8,
            "healthcare_score": 6
        },
        {
            "id": 3,
            "name": "Ransi",
            "district": "Rudraprayag",
            "latitude": 30.5560,
            "longitude": 79.1430,
            "total_capacity": 2000,
            "current_population": 950,
            "safety_score": 78,
            "road_connectivity_score": 6,
            "water_availability_score": 7,
            "healthcare_score": 5
        }
    ]

    # Step 1: Risk Assessment
    print("Step 1: Risk Assessment")
    print("-" * 30)
    scored_villages = score_all_villages(test_villages)

    for village in scored_villages:
        print(f"{village['name']}:")
        print(f"  Risk Score: {village['risk_score']}/100 ({village['risk_level']})")
        print(f"  Priority: {village['priority']}")
        print()

    # Step 2: Relocation Recommendations for High-Risk Villages
    print("Step 2: Relocation Recommendations")
    print("-" * 30)

    high_risk_villages = [v for v in scored_villages if v['risk_score'] >= 30]

    for village in high_risk_villages:
        print(f"\nFinding relocation sites for {village['name']} (Risk: {village['risk_score']}/100):")
        best_sites = find_best_sites(village, relocation_sites)

        if best_sites:
            for i, site in enumerate(best_sites, 1):
                print(f"  Option {i}: {site['name']}")
                print(f"    Overall Score: {site['overall_score']}/100")
                print(f"    Distance: {site['distance_km']} km")
                print(f"    Available Capacity: {site['available_capacity']}")
                print(f"    Explanation: {explain_recommendation(site)}")
                print()
        else:
            print("  No suitable relocation sites found.")

    print("Integration test completed successfully!")

if __name__ == "__main__":
    test_integration()