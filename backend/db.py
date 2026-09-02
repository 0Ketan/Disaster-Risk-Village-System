import sqlite3
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(BASE_DIR, "data", "flood_data.db")

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS flood_risk_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            village_id TEXT NOT NULL,
            final_flood_risk_score REAL,
            risk_level TEXT,
            elevation_m REAL,
            today_rainfall_mm REAL,
            next_24hr_rainfall_mm REAL,
            flood_gauge_status TEXT,
            summary TEXT,
            data_timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

if __name__ == "__main__":
    init_db()
