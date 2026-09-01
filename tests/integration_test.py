import pytest
import os
import pandas as pd
from backend.engines.risk_engine import score_all_villages
from backend.engines.relocation_engine import find_best_sites

def test_integration_full_pipeline():
    # Load villages
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    villages_csv = os.path.join(base_dir, "data", "villages.csv")
    sites_csv = os.path.join(base_dir, "data", "relocation_sites.csv")
    
    df_villages = pd.read_csv(villages_csv)
    raw_villages = df_villages.to_dict('records')
    
    df_sites = pd.read_csv(sites_csv)
    raw_sites = df_sites.to_dict('records')
    
    # Score all
    scored = score_all_villages(raw_villages)
    
    # Assert
    assert len(scored) == len(raw_villages)
    
    for v in scored:
        assert 'hazard_zones' in v
        assert 'landslide' in v['hazard_zones']
        assert 'flood' in v['hazard_zones']
        assert 'cloudburst' in v['hazard_zones']
        
        # Test relocation engine works without crashing
        if v.get('relocation_required'):
            sites = find_best_sites(v, raw_sites)
            assert len(sites) <= 3
