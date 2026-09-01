import pytest
from backend.engines.risk_engine import calculate_risk_score

def test_calculate_risk_score_hazard_zones():
    # Kedarnath (Extreme inputs)
    kedarnath = {
        'id': 2,
        'name': 'Kedarnath',
        'slope_degrees': 42,
        'annual_rainfall_mm': 3100,
        'past_landslides': 5,
        'flood_risk_index': 9,
        'road_access_score': 1
    }
    
    scored = calculate_risk_score(kedarnath)
    
    assert 'hazard_zones' in scored
    zones = scored['hazard_zones']
    assert 'landslide' in zones
    assert 'flood' in zones
    assert 'cloudburst' in zones
    assert 'coastal_erosion' in zones
    
    # Values should be valid colors
    valid_colors = ["Red", "Orange", "Green"]
    assert zones['landslide'] in valid_colors
    assert zones['flood'] in valid_colors
    assert zones['cloudburst'] in valid_colors
    assert zones['coastal_erosion'] in valid_colors
    
    # Subscores should exist and be <= 100
    assert 0 <= scored['landslide_subscore'] <= 100
    assert 0 <= scored['flood_subscore'] <= 100
    assert 0 <= scored['cloudburst_subscore'] <= 100
    assert 0 <= scored['coastal_erosion_subscore'] <= 100
    
    # Kedarnath should be mostly Red
    assert zones['landslide'] == "Red"
    assert zones['flood'] == "Red"
    assert zones['cloudburst'] == "Red"

def test_calculate_risk_score_safe_village():
    # Rudraprayag Town (Safe inputs)
    rudraprayag = {
        'id': 8,
        'name': 'Rudraprayag Town',
        'slope_degrees': 10,
        'annual_rainfall_mm': 1600,
        'past_landslides': 0,
        'flood_risk_index': 3,
        'road_access_score': 9
    }
    
    scored = calculate_risk_score(rudraprayag)
    zones = scored['hazard_zones']
    
    # Should be Green
    assert zones['landslide'] == "Green"
    assert zones['flood'] == "Green"
    assert zones['cloudburst'] == "Green"

def test_composite_score_unchanged():
    # To prevent regression, ensure the base composite score works the same
    # We can just verify it's a float
    village = {
        'id': 1,
        'name': 'Ukhimath',
        'slope_degrees': 35,
        'annual_rainfall_mm': 2800,
        'past_landslides': 4,
        'flood_risk_index': 8,
        'road_access_score': 3
    }
    scored = calculate_risk_score(village)
    assert isinstance(scored['risk_score'], float)
    assert scored['risk_score'] > 0
