import sqlite3
conn = sqlite3.connect('data/flood_data.db')
print(conn.execute('SELECT village_id, risk_level, final_flood_risk_score FROM flood_risk_data WHERE village_id = "OD_PUR_001" ORDER BY id DESC LIMIT 5').fetchall())
