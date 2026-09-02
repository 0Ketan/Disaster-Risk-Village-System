import os
import argparse
import sys
from data_loader import load_data
from validator import validate_data
from analysis import analyze_data
from geojson_export import export_geojson
from visualization import create_visualizations
from risk_engine import CoastalRiskEngine

def main():
    parser = argparse.ArgumentParser(description="Odisha Coastal Erosion Analysis Module")
    parser.add_argument('--dataset', type=str, default='odisha_coastal_erosion_villages.json',
                        help='Path to the JSON dataset')
    parser.add_argument('--output-dir', type=str, default='output',
                        help='Directory to save outputs')
    
    args = parser.parse_args()
    
    dataset_path = args.dataset
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset {dataset_path} not found.")
        sys.exit(1)
        
    data = load_data(dataset_path)
    
    print("\n==================================================")
    print("ODISHA COASTAL EROSION ANALYSIS")
    print("==================================================")
    
    is_valid, errors = validate_data(data)
    print(f"\nDataset validation: {'PASS' if is_valid else 'FAIL'}")
    if not is_valid:
        print("Validation errors:")
        for err in errors:
            print(f" - {err}")
            
    stats = analyze_data(data)
    
    print(f"\nTotal locations: {stats['total_locations']}")
    print(f"Erosion locations: {stats['erosion_locations']}")
    print(f"Accretion locations: {stats['accretion_locations']}")
    
    if stats['largest_erosion']:
        print(f"\nLargest erosion: {stats['largest_erosion']['name']} ({stats['largest_erosion']['area']} sq m)")
    else:
        print("\nLargest erosion: N/A")
        
    if stats['largest_accretion']:
        print(f"Largest accretion: {stats['largest_accretion']['name']} ({stats['largest_accretion']['area']} sq m)")
    else:
        print("Largest accretion: N/A")
        
    print("\nDistrict summary:")
    for dist, info in stats['district_erosion'].items():
        print(f" - {dist}: {info['count']} erosion locations, {info['total_area']} sq m total area")
        
    print("\nSource information:")
    sources = set([str(d.get("source")) for d in data if d.get("source")])
    for s in sources:
        print(f" - {s}")
        
    # Evaluate model requirements
    engine = CoastalRiskEngine()
    
    # Check what features are available in the dataset (using first row as representative)
    sample_features = data[0] if data else {}
    risk_result = engine.calculate_risk(sample_features)
    
    available_vars = [k for k in engine.REQUIRED_VARS if sample_features.get(k) is not None]
    
    print(f"\nAvailable model variables:")
    if available_vars:
        for v in available_vars:
            print(f" - {v}")
    else:
        print(" - None")
        
    print(f"\nMissing model variables:")
    for v in risk_result.get('missing_variables', []):
        print(f" - {v}")
        
    print(f"\nModel prediction:")
    if risk_result['status'] == 'insufficient_data':
        print("NOT AVAILABLE UNTIL SUFFICIENT REAL FEATURES ARE PROVIDED")
    else:
        print(risk_result['model_score'])
        
    print("\nSource scores (e.g. from NCCR) are separated from the model score:")
    for row in data:
        score = row.get('risk_score_suggested')
        if score is not None:
            print(f" - {row.get('village_name')}: {score}")
            
    print("\n==================================================")
    
    os.makedirs(args.output_dir, exist_ok=True)
    geojson_path = os.path.join(args.output_dir, 'coastal_data.geojson')
    export_geojson(data, geojson_path)
    print(f"Exported GeoJSON to {geojson_path}")
    
    create_visualizations(data, args.output_dir)
    print(f"Exported visualizations to {args.output_dir}/")
    
if __name__ == "__main__":
    main()
