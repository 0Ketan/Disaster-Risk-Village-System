import requests
from functools import wraps

# Globally force all requests to bypass SSL verification
old_send = requests.Session.send
@wraps(old_send)
def new_send(self, request, **kwargs):
    kwargs['verify'] = False
    return old_send(self, request, **kwargs)
requests.Session.send = new_send

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import pandas as pd
import xarray as xr
from erddapy import ERDDAP
from dotenv import load_dotenv

load_dotenv()


def fetch_oceansat2_via_api(dataset_id, lat, lon, target_date):
    """
    Fetch gridded satellite data from NOAA CoastWatch ERDDAP.

    Args:
        dataset_id: ERDDAP dataset identifier (e.g. 'jplMURSST41')
        lat: Target latitude (degrees North)
        lon: Target longitude (degrees East)
        target_date: Date string (e.g. '2023-12-01T12:00:00Z') or datetime object

    Returns:
        xarray.Dataset of the selected data point, or None on failure.
    """
    server_url = "https://coastwatch.pfeg.noaa.gov/erddap"

    try:
        print(f"Connecting to NOAA CoastWatch ERDDAP: {server_url}/griddap/{dataset_id} ...\n")

        # 1. Parse target_date early so we can use it in constraints
        if isinstance(target_date, str):
            target_date = pd.to_datetime(target_date)

        # Ensure timezone-aware UTC to match dataset's datetime index
        if target_date.tzinfo is None:
            target_date = target_date.tz_localize("UTC")
        else:
            target_date = target_date.tz_convert("UTC")

        # 2. Build a small bounding box around the target point
        #    This prevents downloading the entire global dataset (413 error).
        lat_margin = 1.0  # +/- 1 degree
        lon_margin = 1.0
        time_margin = pd.Timedelta(days=1)

        time_min = (target_date - time_margin).strftime("%Y-%m-%dT%H:%M:%SZ")
        time_max = (target_date + time_margin).strftime("%Y-%m-%dT%H:%M:%SZ")

        # 3. Connect to the ERDDAP server
        e = ERDDAP(
            server=server_url,
            protocol="griddap"
        )
        e.dataset_id = dataset_id

        # Initialize griddap to fetch coordinate metadata (required before setting constraints)
        e.griddap_initialize()

        # Update the constraints with our bounding box
        e.constraints["time>="] = time_min
        e.constraints["time<="] = time_max
        e.constraints["latitude>="] = lat - lat_margin
        e.constraints["latitude<="] = lat + lat_margin
        e.constraints["longitude>="] = lon - lon_margin
        e.constraints["longitude<="] = lon + lon_margin

        print(f"Constraints set:")
        print(f"  time:      {time_min} to {time_max}")
        print(f"  latitude:  {lat - lat_margin:.4f} to {lat + lat_margin:.4f}")
        print(f"  longitude: {lon - lon_margin:.4f} to {lon + lon_margin:.4f}")
        print()

        # 4. Download the constrained subset into xarray
        ds = e.to_xarray()

        if ds is None:
            print("Error: ERDDAP returned an empty dataset.")
            return None

        # 5. Print available variables
        print(f"Available Variables in '{dataset_id}':")
        for var in ds.data_vars:
            print(f"  - {var}")
        print("\n" + "-" * 60)

        # Print coordinate info for debugging
        print("Coordinate Dimensions:")
        for coord_name, coord_vals in ds.coords.items():
            if coord_vals.size <= 5:
                print(f"  {coord_name}: {coord_vals.values}")
            else:
                print(f"  {coord_name}: shape={coord_vals.shape}, "
                      f"range=[{coord_vals.values.min()} ... {coord_vals.values.max()}]")
        print("-" * 60)

        # 6. Detect the correct coordinate names for lat/lon
        coord_names = list(ds.coords.keys())
        lat_key = next((c for c in coord_names if c.lower() in ("latitude", "lat")), None)
        lon_key = next((c for c in coord_names if c.lower() in ("longitude", "lon")), None)
        time_key = next((c for c in coord_names if c.lower() == "time"), None)

        if not lat_key or not lon_key or not time_key:
            print(f"\nError: Could not identify coordinate names from: {coord_names}")
            print(f"  Detected: lat_key={lat_key}, lon_key={lon_key}, time_key={time_key}")
            return None

        print(f"\nUsing coordinates: time='{time_key}', lat='{lat_key}', lon='{lon_key}'")

        # 7. Align target_date tz-awareness with the dataset's time coordinate
        #    Some datasets use naive datetime64[ns], others use tz-aware datetime64[us, UTC].
        ds_time_dtype = str(ds[time_key].dtype)
        print(f"Dataset time dtype: {ds_time_dtype}")

        if "UTC" in ds_time_dtype or "tz" in ds_time_dtype:
            # Dataset is tz-aware: ensure target_date is also UTC-aware
            if target_date.tzinfo is None:
                target_date = target_date.tz_localize("UTC")
        else:
            # Dataset is tz-naive: strip timezone from target_date to match
            if target_date.tzinfo is not None:
                target_date = target_date.tz_localize(None)

        print(f"Querying: time={target_date}, {lat_key}={lat}, {lon_key}={lon}")

        # 7. Select data using nearest neighbor
        try:
            selected_data = ds.sel(
                {time_key: target_date, lat_key: lat, lon_key: lon},
                method="nearest"
            )
        except KeyError as ke:
            print(f"\nCoordinate out of bounds: {ke}")
            print("The requested lat/lon/time may be outside the dataset's coverage.")
            return None

        # 8. Print results
        print("\n[OK] Successfully fetched data:")
        for var in selected_data.data_vars:
            val = selected_data[var].values
            units = selected_data[var].attrs.get("units", "N/A")
            print(f"  {var}: {val}  (units: {units})")

        return selected_data

    except Exception:
        import traceback
        print("\n[FAIL] Failed to fetch data:")
        traceback.print_exc()
        return None


# --- Self-Test ---
if __name__ == "__main__":
    # jplMURSST41 = Multi-scale Ultra-high Resolution SST (global, daily, reliable)
    test_dataset = "jplMURSST41"
    test_lat = 9.9312       # Near Kochi, Kerala
    test_lon = 76.2673
    test_time = "2023-12-01T09:00:00Z"

    print("=" * 60)
    print("  NOAA CoastWatch ERDDAP -- Self-Test")
    print("=" * 60 + "\n")

    result = fetch_oceansat2_via_api(test_dataset, test_lat, test_lon, test_time)

    print("\n" + "=" * 60)
    if result is not None:
        print("  TEST PASSED -- Data fetched successfully.")
    else:
        print("  TEST FAILED -- See errors above.")
    print("=" * 60)