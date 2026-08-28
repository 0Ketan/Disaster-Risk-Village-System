import os
import sys
import folium
import pandas as pd

# Add backend directory to sys.path to import risk_engine
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
backend_engines_dir = os.path.abspath(os.path.join(current_dir, "..", "backend", "engines"))
sys.path.insert(0, backend_dir)
sys.path.insert(0, backend_engines_dir)

try:
    from engines.risk_engine import calculate_risk_score
except ImportError:
    try:
        from risk_engine import calculate_risk_score
    except ImportError:
        # Fallback dummy calculation for isolated testing if Member 1 hasn't committed yet
        def calculate_risk_score(v):
            v_copy = dict(v)
            slope_s = min(10.0, (float(v.get("slope_degrees", 0)) / 45.0) * 10)
            rain_s = min(10.0, (float(v.get("annual_rainfall_mm", 0)) / 3000.0) * 10)
            land_s = min(10.0, float(v.get("past_landslides", 0)) * 2.0)
            flood_s = float(v.get("flood_risk_index", 0))
            road_s = 10.0 - float(v.get("road_access_score", 5))  # lower access = higher risk
            
            raw_score = (slope_s * 0.25 + rain_s * 0.25 + land_s * 0.20 + flood_s * 0.20 + road_s * 0.10) * 10.0
            score = round(raw_score, 1)
            
            if score >= 75:
                level, priority = "Critical", "Immediate"
            elif score >= 50:
                level, priority = "High", "Short-term"
            elif score >= 30:
                level, priority = "Moderate", "Medium-term"
            else:
                level, priority = "Low", "Monitor"
                
            v_copy.update({
                "risk_score": score,
                "risk_level": level,
                "priority": priority,
                "slope_score": round(slope_s, 1),
                "rainfall_score": round(rain_s, 1),
                "landslide_score": round(land_s, 1),
                "flood_score": round(flood_s, 1),
                "road_score": round(road_s, 1),
            })
            return v_copy


def get_marker_radius(population: int) -> int:
    """Calculates marker radius based on population size."""
    if population > 5000:
        return 20
    elif population > 2000:
        return 15
    elif population > 500:
        return 10
    else:
        return 7


def get_risk_color(risk_level: str) -> str:
    """Returns color associated with risk level."""
    color_map = {
        "Critical": "red",
        "High": "orange",
        "Moderate": "yellow",
        "Low": "green"
    }
    return color_map.get(risk_level, "blue")


def generate_map(csv_path: str, output_path: str):
    """
    Reads villages CSV, calculates risk scores, and generates interactive Folium map.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Villages CSV file not found at: {csv_path}")

    # 1. Read CSV and score each village
    df = pd.read_csv(csv_path)
    villages = df.to_dict(orient="records")
    scored_villages = [calculate_risk_score(v) for v in villages]

    if not scored_villages:
        print("Warning: No village records found in CSV.")
        return

    # 2. Calculate map center
    mean_lat = sum(v["latitude"] for v in scored_villages) / len(scored_villages)
    mean_lng = sum(v["longitude"] for v in scored_villages) / len(scored_villages)

    # 3. Create Folium Map with 100% free OpenStreetMap (no API key required)
    m = folium.Map(
        location=[mean_lat, mean_lng],
        zoom_start=10,
        tiles="OpenStreetMap"
    )

    # 4. Add markers for each village
    for v in scored_villages:
        v_id = v.get("id", 0)
        name = v.get("name", "Unknown Village")
        district = v.get("district", "N/A")
        pop = v.get("population", 0)
        risk_score = v.get("risk_score", 0.0)
        risk_level = v.get("risk_level", "Low")

        radius = get_marker_radius(pop)
        color = get_risk_color(risk_level)

        # Tooltip on hover
        tooltip_text = f"{name} — {risk_level} ({risk_score}/100)"

        # Popup HTML with postMessage communication for React Frontend
        popup_html = f"""
        <div style="font-family: Arial, sans-serif; min-width: 190px; padding: 4px;">
            <h3 style="margin: 0 0 6px 0; color: #2c3e50; font-size: 15px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                {name}
            </h3>
            <div style="font-size: 12px; line-height: 1.5; color: #34495e; margin-bottom: 8px;">
                <b>Risk Level:</b> <span style="font-weight: bold; color: {color};">{risk_level}</span><br>
                <b>Risk Score:</b> {risk_score}/100<br>
                <b>Population:</b> {pop:,}<br>
                <b>District:</b> {district}
            </div>
            <button onclick="window.parent.postMessage({{type: 'village_click', id: {v_id}}}, '*')"
                    style="width: 100%; background-color: #2980b9; color: white; border: none; 
                           padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">
                Select Village &rarr;
            </button>
        </div>
        """
        popup = folium.Popup(popup_html, max_width=250)

        folium.CircleMarker(
            location=[v["latitude"], v["longitude"]],
            radius=radius,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.8,
            weight=1.5,
            tooltip=tooltip_text,
            popup=popup
        ).add_to(m)

    # 5. Add Legend in bottom-left corner
    legend_html = """
    <div style="
        position: fixed; 
        bottom: 25px; left: 25px; width: 150px; 
        background-color: white; 
        border: 2px solid #ccc; 
        border-radius: 8px; 
        z-index: 9999; 
        font-size: 12px; 
        font-family: Arial, sans-serif;
        padding: 10px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    ">
        <b style="font-size: 13px;">Risk Level</b><br>
        <div style="margin-top: 6px; display: flex; align-items: center; margin-bottom: 4px;">
            <span style="background: red; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
            Critical (75-100)
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="background: orange; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
            High (50-74)
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="background: yellow; border: 1px solid #ccc; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
            Moderate (30-49)
        </div>
        <div style="display: flex; align-items: center;">
            <span style="background: green; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
            Low (0-29)
        </div>
    </div>
    """
    m.get_root().html.add_child(folium.Element(legend_html))

    # 6. Ensure destination directory exists and save
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    m.save(output_path)
    print(f"Map successfully generated and saved to: {output_path}")


if __name__ == "__main__":
    # Standard paths relative to script location
    default_csv = os.path.abspath(os.path.join(current_dir, "..", "data", "villages.csv"))
    default_output = os.path.abspath(os.path.join(current_dir, "risk_map.html"))
    
    generate_map(default_csv, default_output)
