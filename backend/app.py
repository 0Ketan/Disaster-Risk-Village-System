"""
Disaster Risk Village System - Flask Backend API
Member 2: Backend Developer
Serves risk scoring, relocation suggestions, dashboard priority data, and interactive map HTML.
"""

import os
import sys
import json
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

# Add sys.path to include current directory and parent directories
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
sys.path.insert(0, current_dir)
sys.path.insert(0, parent_dir)

# Import functions from engines
from risk_engine import calculate_risk_score, score_all_villages
from relocation_engine import find_best_sites, explain_recommendation

# Initialize Flask application with CORS enabled
app = Flask(__name__)
CORS(app)

# Dataset and map paths
DATA_DIR = os.path.abspath(os.path.join(current_dir, "..", "data"))
VILLAGES_CSV = os.path.join(DATA_DIR, "villages.csv")
SITES_CSV = os.path.join(DATA_DIR, "relocation_sites.csv")
MAP_HTML_PATH = os.path.abspath(os.path.join(current_dir, "..", "map_generator", "risk_map.html"))

# -------------------------------------------------------------
# Data Loading Helpers (Pandas DataFrames on Startup / Request)
# -------------------------------------------------------------
def get_villages_df() -> pd.DataFrame:
    """Loads villages CSV into a DataFrame or returns an empty DataFrame if missing."""
    if os.path.exists(VILLAGES_CSV):
        try:
            return pd.read_csv(VILLAGES_CSV)
        except Exception as e:
            print(f"Warning: Error reading villages CSV: {e}")
            return pd.DataFrame()
    else:
        print(f"Warning: {VILLAGES_CSV} not found.")
        return pd.DataFrame()

def get_sites_df() -> pd.DataFrame:
    """Loads relocation sites CSV into a DataFrame or returns an empty DataFrame if missing."""
    if os.path.exists(SITES_CSV):
        try:
            return pd.read_csv(SITES_CSV)
        except Exception as e:
            print(f"Warning: Error reading relocation sites CSV: {e}")
            return pd.DataFrame()
    else:
        print(f"Warning: {SITES_CSV} not found.")
        return pd.DataFrame()


# -------------------------------------------------------------
# Endpoint 1: GET /api/health
# -------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint to verify backend status."""
    return jsonify({
        "status": "ok",
        "message": "Disaster Risk API is running smoothly"
    }), 200


# -------------------------------------------------------------
# Endpoint 2: GET /api/villages
# -------------------------------------------------------------
@app.route("/api/villages", methods=["GET"])
def get_villages():
    """
    Converts villages DataFrame to a list of dicts, scores them with
    score_all_villages, and returns the result sorted by risk_score descending.
    JSON Contract: { "villages": [ Village, ... ] }
    """
    df = get_villages_df()
    if df.empty:
        return jsonify({"villages": []}), 200
    
    villages_list = df.to_dict(orient="records")
    scored_villages = score_all_villages(villages_list)
    return jsonify({"villages": scored_villages}), 200


# -------------------------------------------------------------
# Endpoint 3: GET /api/villages/<int:village_id>
# -------------------------------------------------------------
@app.route("/api/villages/<int:village_id>", methods=["GET"])
def get_village(village_id: int):
    """
    Finds village with matching id, runs calculate_risk_score on it,
    and returns JSON with key "village" containing the scored village dict.
    JSON Contract: { "village": Village }
    """
    df = get_villages_df()
    if df.empty:
        return jsonify({"error": "Village data not available"}), 503
        
    matching = df[df["id"] == village_id]
    if matching.empty:
        return jsonify({"error": "Village not found"}), 404
        
    village_dict = matching.iloc[0].to_dict()
    scored_village = calculate_risk_score(village_dict)
    return jsonify({"village": scored_village}), 200


# -------------------------------------------------------------
# Endpoint 4: GET /api/villages/<int:village_id>/relocation
# -------------------------------------------------------------
@app.route("/api/villages/<int:village_id>/relocation", methods=["GET"])
def get_relocation(village_id: int):
    """
    Finds village by id, scores it, gets all candidate sites, calls find_best_sites,
    and returns top candidate sites with explanations.
    JSON Contract: { "village_name": str, "sites": [ RelocationSite, ... ] }
    """
    v_df = get_villages_df()
    s_df = get_sites_df()
    
    if v_df.empty:
        return jsonify({"error": "Village data not available"}), 503
        
    matching = v_df[v_df["id"] == village_id]
    if matching.empty:
        return jsonify({"error": "Village not found"}), 404
        
    village_dict = matching.iloc[0].to_dict()
    scored_village = calculate_risk_score(village_dict)
    
    if s_df.empty:
        return jsonify({
            "village_name": scored_village.get("name", "Unknown"),
            "sites": []
        }), 200
        
    all_sites = s_df.to_dict(orient="records")
    best_sites = find_best_sites(scored_village, all_sites)
    
    return jsonify({
        "village_name": scored_village.get("name", "Unknown"),
        "sites": best_sites
    }), 200


# -------------------------------------------------------------
# Endpoint 5: GET /api/dashboard
# -------------------------------------------------------------
@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """
    Returns a simplified prioritized list for the executive dashboard.
    Each item has: id, name, district, population, risk_score, risk_level, priority.
    Sorted by risk_score descending.
    JSON Contract: { "priority_list": [ ... ] }
    """
    df = get_villages_df()
    if df.empty:
        return jsonify({"priority_list": []}), 200
        
    villages_list = df.to_dict(orient="records")
    scored_villages = score_all_villages(villages_list)
    
    priority_list = [
        {
            "id": int(v["id"]),
            "name": str(v["name"]),
            "district": str(v["district"]),
            "population": int(v["population"]),
            "risk_score": float(v["risk_score"]),
            "risk_level": str(v["risk_level"]),
            "priority": str(v["priority"])
        }
        for v in scored_villages
    ]
    
    return jsonify({"priority_list": priority_list}), 200


# -------------------------------------------------------------
# Endpoint 6: GET /api/map
# -------------------------------------------------------------
@app.route("/api/map", methods=["GET"])
def get_map():
    """
    Reads ../map_generator/risk_map.html and returns its contents
    as a JSON string with key "map_html".
    JSON Contract: { "map_html": "<!DOCTYPE html>..." }
    """
    # If the map HTML file does not exist yet, attempt to generate it
    if not os.path.exists(MAP_HTML_PATH):
        try:
            # Adjust map generation logic
            sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "map_generator")))
            from generate_map import generate_map
            generate_map(VILLAGES_CSV, MAP_HTML_PATH)
        except Exception as e:
            print(f"Warning: Could not auto-generate map: {e}")
            return jsonify({"error": "Map not generated yet"}), 404
            
    try:
        with open(MAP_HTML_PATH, "r", encoding="utf-8") as f:
            map_html = f.read()
        return jsonify({"map_html": map_html}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to read map file: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
