import matplotlib.pyplot as plt
import os
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

def create_visualizations(data: List[Dict[str, Any]], output_dir: str) -> None:
    """Generates basic visual plots using real data."""
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Bar chart of erosion area by location
    erosion_data = [d for d in data if str(d.get("hazard_type", "")).lower() == "coastal erosion" and d.get("erosion_area_sq_m")]
    if erosion_data:
        names = [d["village_name"] for d in erosion_data]
        areas = [d["erosion_area_sq_m"] for d in erosion_data]
        
        plt.figure(figsize=(10, 6))
        plt.bar(names, areas, color='red')
        plt.title('Erosion Area by Location (Real Data)')
        plt.xlabel('Location')
        plt.ylabel('Area (sq m)')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'erosion_by_location.png'))
        plt.close()
        
    # 2. Bar chart of accretion area by location
    accretion_data = [d for d in data if str(d.get("hazard_type", "")).lower() == "accretion" and d.get("erosion_area_sq_m")]
    if accretion_data:
        names = [d["village_name"] for d in accretion_data]
        areas = [abs(d["erosion_area_sq_m"]) for d in accretion_data]
        
        plt.figure(figsize=(10, 6))
        plt.bar(names, areas, color='blue')
        plt.title('Accretion Area by Location (Real Data)')
        plt.xlabel('Location')
        plt.ylabel('Area (sq m)')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'accretion_by_location.png'))
        plt.close()
        
    # 3. District-wise erosion summary
    district_erosion = {}
    for d in erosion_data:
        dist = d.get("district", "Unknown")
        area = d.get("erosion_area_sq_m", 0)
        district_erosion[dist] = district_erosion.get(dist, 0) + area
        
    if district_erosion:
        districts = list(district_erosion.keys())
        areas = list(district_erosion.values())
        
        plt.figure(figsize=(10, 6))
        plt.bar(districts, areas, color='orange')
        plt.title('District-wise Total Erosion Area (Real Data)')
        plt.xlabel('District')
        plt.ylabel('Area (sq m)')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'district_erosion_summary.png'))
        plt.close()
        
    # 4. Geographic map
    valid_coords = [d for d in data if d.get("latitude") is not None and d.get("longitude") is not None]
    if valid_coords:
        plt.figure(figsize=(10, 8))
        
        for d in valid_coords:
            lat = d["latitude"]
            lon = d["longitude"]
            htype = str(d.get("hazard_type", "Unknown"))
            
            color = 'red' if htype.lower() == 'coastal erosion' else ('blue' if htype.lower() == 'accretion' else 'gray')
            plt.scatter(lon, lat, c=color, label=htype)
            
        handles, labels = plt.gca().get_legend_handles_labels()
        by_label = dict(zip(labels, handles))
        plt.legend(by_label.values(), by_label.keys())
        
        plt.title('Geographic Distribution of Coastal Hazards\n(Note: Coordinates may be approximate)')
        plt.xlabel('Longitude')
        plt.ylabel('Latitude')
        plt.grid(True, linestyle='--', alpha=0.7)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'hazard_map.png'))
        plt.close()
