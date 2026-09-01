import pandas as pd
import json
import random
import os

def generate_seed_data():
    # Paths (assuming files are in the data directory)
    files = [
        "data/DCHB_Village_Amenities-UTTARAKHAND-Garhwal-061.csv",
        "data/DCHB_Village_Amenities-UTTARAKHAND-Nainital-066.csv"
    ]

    target_villages = [
        'Srinagar', 'Janasu', 'Ukhimath', 'Kedarnath', 'Gaurikund', 'Phata', 'Sonprayag',
        'Guptkashi', 'Agastyamuni', 'Rudraprayag Town', 'Tilwara', 'Chandrapuri',
        'Syalsaur', 'Kalimath', 'Mansuna', 'Ransi', 'Triyuginarayan', 'Sari', 'Chopta',
        'Sumari', 'Kosya Kutauli', 'Bhowali', 'Betalghat', 'Nainital', 'Haldwani'
    ]

    all_data = []
    for file in files:
        if not os.path.exists(file):
            print(f"Warning: {file} not found. Skipping.")
            continue

        df = pd.read_csv(file, low_memory=False)
        # Assuming column names are close to Census standards, mapping them:
        # Note: In real scenarios, these might need fuzzy matching

        # Filtering (simple string match)
        mask = df['Village Name'].str.contains('|'.join(target_villages), case=False, na=False)
        subset = df[mask].copy()

        for _, row in subset.iterrows():
            # Logic for road_access_score
            score = 10
            if row.get('Black Topped (pucca) Road (Status A(1)/NA(2))') == 1.0:
                score = 2
            elif row.get('Gravel (kuchha) Roads (Status A(1)/NA(2))') == 1.0:
                score = 5
            elif row.get('Footpath (Status A(1)/NA(2))') == 1.0:
                score = 8

            # Logic for mobile
            has_mobile = row.get('Mobile Phone Coverage (Status A(1)/NA(2))') == 1.0

            village_obj = {
                "id": len(all_data) + 1,
                "name": row['Village Name'],
                "district": row['District Name'],
                "population": int(row['Total Population of Village']),
                "road_access_score": score,
                "has_mobile_coverage": bool(has_mobile),
                "slope_degrees": round(random.uniform(15.0, 45.0), 1),
                "past_landslides": random.randint(0, 5),
                "flood_risk_index": random.randint(1, 10),
                "annual_rainfall_mm": random.randint(1200, 3500)
            }
            all_data.append(village_obj)

    # Save to JSON
    output_path = "backend/data/seed_villages.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(all_data, f, indent=2)
    print(f"Generated {len(all_data)} villages to {output_path}")

if __name__ == "__main__":
    generate_seed_data()