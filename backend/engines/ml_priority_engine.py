def calculate_priority_score(
    flood_score: float,
    landslide_score: float,
    population_density: float,
    percentage_elderly: float,
    historical_disaster_count: int
) -> dict:
    """
    Weighted Multi-Criteria Decision Analysis function to calculate relocation priority.
    
    Returns:
        dict: containing 'Relocation_Priority_Score' (0-100) and 'Zone_Category' (Safe, Medium, Red Zone)
    """
    # 1. Normalize vulnerability inputs (simple heuristic normalization)
    # Assume max density 2000 per sq km -> normalize to 0-1
    norm_density = min(population_density / 2000.0, 1.0)
    # Percentage elderly is already 0-100, normalize to 0-1
    norm_elderly = min(percentage_elderly / 100.0, 1.0)
    # Normalize historical disaster count (cap at 10)
    norm_history = min(historical_disaster_count / 10.0, 1.0)
    
    # 2. Weights for the Multi-Criteria Decision Analysis
    # Hazard is 60% of the score, Vulnerability is 40%
    w_flood = 0.30
    w_landslide = 0.30
    w_density = 0.15
    w_elderly = 0.10
    w_history = 0.15
    
    # 3. Calculate Weighted Sum
    total_score = (
        (flood_score * w_flood) +
        (landslide_score * w_landslide) +
        (norm_density * w_density) +
        (norm_elderly * w_elderly) +
        (norm_history * w_history)
    )
    
    # Scale to 0-100
    priority_score_100 = round(total_score * 100, 2)
    
    # 4. Zone Classification
    if priority_score_100 >= 70:
        zone = "Red Zone"
    elif priority_score_100 >= 40:
        zone = "Medium"
    else:
        zone = "Safe"
        
    return {
        "Relocation_Priority_Score": priority_score_100,
        "Zone_Category": zone
    }
