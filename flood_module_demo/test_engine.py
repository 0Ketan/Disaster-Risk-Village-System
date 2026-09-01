from flood_engine import compute_flood_risk
import json

villages = [
    {"id": "V_RAJ", "name": "Rajnagar", "lat": 20.7010, "lon": 86.8780, "population": 1240},
    {"id": "V_TIR", "name": "Tirtol", "lat": 20.1580, "lon": 86.3980, "population": 870},
    {"id": "V_BRA", "name": "Brahmagiri", "lat": 19.8950, "lon": 85.6730, "population": 640},
]

print("--- Testing Flood Engine ---")
for v in villages:
    print(f"\nProcessing {v['name']} ({v['id']})...")
    res = compute_flood_risk(v['id'], v['lat'], v['lon'])
    print(json.dumps(res, indent=2))
