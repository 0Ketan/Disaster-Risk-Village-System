# Odisha Coastal Erosion Analysis

This is an independent module for analyzing real Odisha coastal erosion data, based on NCCR and State Government observations.

## Features
- Strict validation of real-world datasets without fabrication.
- Separate handling of source risk scores and model-based predictions.
- Enforces NCCR parameters before generating any model risk predictions.
- Generates GeoJSON and statistical charts for observations.

## Usage
```
python coastal_erosion.py --dataset odisha_coastal_erosion_villages.json --output-dir output
```

## Structure
- `data_loader.py`: Loads the JSON data.
- `validator.py`: Strictly validates the data according to real-world rules.
- `analysis.py`: Computes aggregation logic without creating artificial data.
- `risk_engine.py`: Defines the interface for a future coastal vulnerability model, currently ensuring required features are present.
- `geojson_export.py`: Exports data to GeoJSON with standard `[longitude, latitude]` ordering.
- `visualization.py`: Generates bar charts and spatial point maps of observations.

## Principles
Do not invent environmental values. If a variable is missing, it is reported as missing. Do not generate random population, rainfall, slope, or other values. The system only outputs an official risk prediction when all mandatory real features are provided.
