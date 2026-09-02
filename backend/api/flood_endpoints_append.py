
# --- Flood Engine Integration ---
from ..engines.flood_engine import compute_flood_risk
from ..db import get_db_connection
import csv

def update_village_csv_score(village_id: str, new_score: float):
    # Helper to update the risk_score in the CSV for the given village_id
    if not os.path.exists(VILLAGES_CSV): return
    rows = []
    with open(VILLAGES_CSV, 'r') as f:
        reader = csv.reader(f)
        headers = next(reader)
        rows.append(headers)
        for row in reader:
            if row[0] == str(village_id):
                # Update risk_score, assuming it's the 14th column, wait, let's find the index
                try:
                    idx = headers.index('risk_score')
                    row[idx] = str(new_score)
                except ValueError:
                    pass # risk_score not in headers, skip
            rows.append(row)
    with open(VILLAGES_CSV, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

@router.get("/flood/risk/{village_id}")
def get_flood_risk_for_village(village_id: str):
    raw_villages = load_villages_raw()
    matching = [v for v in raw_villages if str(v.get('id', '')) == village_id]
    if not matching:
        raise HTTPException(status_code=404, detail="Village not found")
        
    v = matching[0]
    lat = float(v.get('latitude', 0))
    lon = float(v.get('longitude', 0))
    
    result = compute_flood_risk(village_id, lat, lon)
    
    # Save to flood_risk_data
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO flood_risk_data (
            village_id, final_flood_risk_score, risk_level, elevation_m, 
            today_rainfall_mm, next_24hr_rainfall_mm, flood_gauge_status, summary, data_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        village_id, result['final_flood_risk_score'], result['risk_level'],
        result['raw_data']['elevation_m'], result['raw_data']['today_rainfall_mm'],
        result['raw_data']['next_24hr_rainfall_mm'], result['flood_gauge_status'],
        result['summary'], result['data_timestamp']
    ))
    conn.commit()
    conn.close()
    
    # Update village risk score (Scale to 100 for consistency)
    scaled_score = result['final_flood_risk_score'] * 100
    update_village_csv_score(village_id, scaled_score)
    
    return result

@router.get("/flood/risk/all")
def get_flood_risk_all():
    demo_villages = ['V_RAJ', 'V_TIR', 'V_BRA']
    results = []
    for vid in demo_villages:
        try:
            res = get_flood_risk_for_village(vid)
            results.append(res)
        except HTTPException:
            pass
    return {"status": "success", "data": results}

@router.get("/flood/dashboard")
def get_flood_dashboard():
    conn = get_db_connection()
    demo_villages = ['V_RAJ', 'V_TIR', 'V_BRA']
    results = []
    for vid in demo_villages:
        row = conn.execute('''
            SELECT * FROM flood_risk_data 
            WHERE village_id = ? 
            ORDER BY id DESC LIMIT 1
        ''', (vid,)).fetchone()
        
        if row:
            results.append(dict(row))
    conn.close()
    return {"status": "success", "data": results}
