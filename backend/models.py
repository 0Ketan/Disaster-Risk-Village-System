"""
Disaster Risk Village System - Database Models
Member 2: Backend Developer
Defines SQLite database schema and database initialization.
"""

import sqlite3
import os
import pandas as pd

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")

def init_db():
    """Initializes the SQLite database schema if not already created."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Villages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS villages (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        population INTEGER NOT NULL,
        slope_degrees REAL NOT NULL,
        annual_rainfall_mm REAL NOT NULL,
        past_landslides INTEGER NOT NULL,
        flood_risk_index REAL NOT NULL,
        road_access_score REAL NOT NULL
    )
    """)
    
    # Relocation sites table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS relocation_sites (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        district TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        total_capacity INTEGER NOT NULL,
        current_population INTEGER NOT NULL,
        safety_score REAL NOT NULL,
        road_connectivity_score REAL NOT NULL,
        water_availability_score REAL NOT NULL,
        healthcare_score REAL NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()

def sync_csv_to_db(villages_csv_path: str, sites_csv_path: str):
    """Syncs CSV datasets into SQLite database tables."""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    
    if os.path.exists(villages_csv_path):
        try:
            df_v = pd.read_csv(villages_csv_path)
            df_v.to_sql("villages", conn, if_exists="replace", index=False)
        except Exception as e:
            print(f"Warning: Failed to sync villages CSV to SQLite: {e}")
            
    if os.path.exists(sites_csv_path):
        try:
            df_s = pd.read_csv(sites_csv_path)
            df_s.to_sql("relocation_sites", conn, if_exists="replace", index=False)
        except Exception as e:
            print(f"Warning: Failed to sync relocation sites CSV to SQLite: {e}")
            
    conn.close()

if __name__ == "__main__":
    init_db()
    print(f"Database initialized at: {DB_PATH}")
